
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

interface OrderItemInput {
  menu_item_id: number;
  quantity: number;
}

interface MenuRow {
  id: number;
  name: string;
  price: number | string;
}

const ORDER_STATUSES = [
  "Pending",
  "Preparing",
  "Ready",
  "Completed",
] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number];

// =====================================
// POST: Place a customer order
// =====================================

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const customerName =
      typeof body.customer_name === "string"
        ? body.customer_name.trim()
        : "";

    const phone =
      typeof body.phone === "string" ? body.phone.trim() : "";

    const address =
      typeof body.address === "string"
        ? body.address.trim()
        : "";

    const items = body.items as OrderItemInput[];

    if (
      customerName.length < 2 ||
      customerName.length > 120 ||
      phone.length < 7 ||
      phone.length > 30 ||
      address.length < 5 ||
      address.length > 1000
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide valid customer details.",
        },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(items) ||
      items.length === 0 ||
      items.length > 50
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please add items to your order.",
        },
        { status: 400 }
      );
    }

    const quantities = new Map<number, number>();

    for (const item of items) {
      if (
        !item ||
        !Number.isInteger(item.menu_item_id) ||
        item.menu_item_id <= 0 ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 20
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid menu item or quantity.",
          },
          { status: 400 }
        );
      }

      const newQuantity =
        (quantities.get(item.menu_item_id) || 0) +
        item.quantity;

      if (newQuantity > 20) {
        return NextResponse.json(
          {
            success: false,
            message: "Maximum quantity per dish is 20.",
          },
          { status: 400 }
        );
      }

      quantities.set(item.menu_item_id, newQuantity);
    }

    const itemIds = Array.from(quantities.keys());

    const menuRows = (await sql`
      SELECT id, name, price
      FROM menu_items
      WHERE id = ANY(${itemIds}::int[])
    `) as MenuRow[];

    if (menuRows.length !== itemIds.length) {
      return NextResponse.json(
        {
          success: false,
          message: "One or more menu items are unavailable.",
        },
        { status: 400 }
      );
    }

    const orderItems = menuRows.map((item) => {
      const price = Number(item.price);
      const quantity = quantities.get(item.id) || 0;

      if (!Number.isFinite(price) || price < 0 || quantity < 1) {
        throw new Error("Invalid menu item price.");
      }

      return {
        menu_item_id: item.id,
        item_name: item.name,
        quantity,
        price,
      };
    });

    const totalAmount = orderItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order total.",
        },
        { status: 400 }
      );
    }

    const savedOrders = await sql`
      WITH new_order AS (
        INSERT INTO orders (
          customer_name,
          phone,
          address,
          total_amount,
          status
        )
        VALUES (
          ${customerName},
          ${phone},
          ${address},
          ${totalAmount},
          'Pending'
        )
        RETURNING id
      ),
      inserted_items AS (
        INSERT INTO order_items (
          order_id,
          menu_item_id,
          item_name,
          quantity,
          price
        )
        SELECT
          new_order.id,
          item.menu_item_id,
          item.item_name,
          item.quantity,
          item.price
        FROM new_order
        CROSS JOIN jsonb_to_recordset(
          ${JSON.stringify(orderItems)}::jsonb
        ) AS item(
          menu_item_id INTEGER,
          item_name VARCHAR(150),
          quantity INTEGER,
          price NUMERIC
        )
        RETURNING id
      )
      SELECT id FROM new_order
    `;

    return NextResponse.json(
      {
        success: true,
        message: "Your order has been placed successfully.",
        orderId: savedOrders[0].id,
        totalAmount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create order error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to place your order. Please try again.",
      },
      { status: 500 }
    );
  }
}

// =====================================
// GET: Fetch all orders for admin
// =====================================

export async function GET() {
  try {
    await requireAdmin();

    const orders = await sql`
      SELECT
        o.id,
        o.customer_name,
        o.phone,
        o.address,
        o.total_amount,
        o.status,
        o.created_at,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', oi.id,
                'order_id', oi.order_id,
                'menu_item_id', oi.menu_item_id,
                'item_name', oi.item_name,
                'quantity', oi.quantity,
                'price', oi.price
              )
              ORDER BY oi.id
            )
            FROM order_items oi
            WHERE oi.order_id = o.id
          ),
          '[]'::json
        ) AS items
      FROM orders o
      ORDER BY o.created_at DESC, o.id DESC
    `;

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Fetch orders error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch orders.",
      },
      { status: 401 }
    );
  }
}

// =====================================
// PATCH: Update order status
// =====================================

export async function PATCH(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();

    const orderId = Number(body.orderId);
    const status = body.status as OrderStatus;

    if (
      !Number.isInteger(orderId) ||
      orderId <= 0 ||
      !ORDER_STATUSES.includes(status)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order ID or status.",
        },
        { status: 400 }
      );
    }

    const updatedOrders = await sql`
      UPDATE orders
      SET status = ${status}
      WHERE id = ${orderId}
      RETURNING id, status
    `;

    if (updatedOrders.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Order status updated successfully.",
      order: updatedOrders[0],
    });
  } catch (error) {
    console.error("Update order error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update order status.",
      },
      { status: 401 }
    );
  }
}
