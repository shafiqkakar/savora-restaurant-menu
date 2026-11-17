
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const menuItems = await sql`
      SELECT id, name, price, description
      FROM menu_items
      ORDER BY id DESC
    `;

    return NextResponse.json({
      success: true,
      menuItems,
    });
  } catch (error) {
    console.error("GET menu error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load menu items",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = body.name?.trim();
    const price = Number(body.price);
    const description = body.description || "";

    if (!name || !Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid name and price are required",
        },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO menu_items (name, price, description)
      VALUES (${name}, ${price}, ${description})
      RETURNING id, name, price, description
    `;

    return NextResponse.json({
      success: true,
      message: "Menu item added successfully",
      menuItem: result[0],
    });
  } catch (error) {
    console.error("POST menu error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to add menu item",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const id = Number(body.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid menu item ID is required",
        },
        { status: 400 }
      );
    }

    const result = await sql`
      DELETE FROM menu_items
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Menu item not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    console.error("DELETE menu error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete menu item",
      },
      { status: 500 }
    );
  }
}
