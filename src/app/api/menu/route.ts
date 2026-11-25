
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

function validateMenuItem(body: unknown) {
  const data = body as {
    name?: unknown;
    price?: unknown;
    description?: unknown;
    image_url?: unknown;
    category?: unknown;
  };

  const name =
    typeof data?.name === "string" ? data.name.trim() : "";

  const price = Number(data?.price);

  const description =
    typeof data?.description === "string"
      ? data.description.trim()
      : "";

  const image_url =
    typeof data?.image_url === "string"
      ? data.image_url.trim()
      : "";

  const category =
    typeof data?.category === "string" && data.category.trim()
      ? data.category.trim()
      : "Uncategorized";

  const letterCount = (name.match(/\p{L}/gu) || []).length;

  if (letterCount < 3 || name.length > 100) {
    return {
      valid: false as const,
      message:
        "Dish name must contain at least 3 letters and cannot exceed 100 characters.",
    };
  }

  if (!Number.isFinite(price) || price <= 0 || price > 10000000) {
    return {
      valid: false as const,
      message: "Please enter a valid price greater than zero.",
    };
  }

  if (description.length > 1000) {
    return {
      valid: false as const,
      message: "Description cannot exceed 1000 characters.",
    };
  }

  if (category.length > 100) {
    return {
      valid: false as const,
      message: "Category cannot exceed 100 characters.",
    };
  }

  // Allow direct TheMealDB images and Cloudinary images.
  if (image_url) {
    try {
      const parsedUrl = new URL(image_url);

      const isAllowedHost =
        parsedUrl.hostname === "res.cloudinary.com" ||
        parsedUrl.hostname === "themealdb.com" ||
        parsedUrl.hostname.endsWith(".themealdb.com");

      if (
        parsedUrl.protocol !== "https:" ||
        !isAllowedHost ||
        parsedUrl.username ||
        parsedUrl.password ||
        image_url.length > 2048
      ) {
        throw new Error("Invalid image URL");
      }
    } catch {
      return {
        valid: false as const,
        message:
          "Please select a valid TheMealDB or Cloudinary image URL.",
      };
    }
  }

  return {
    valid: true as const,
    name,
    price,
    description,
    image_url: image_url || null,
    category,
  };
}

// GET: Public menu
export async function GET() {
  try {
    const menuItems = await sql`
      SELECT
        id,
        name,
        price,
        description,
        image_url,
        category
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
      { success: false, message: "Failed to load menu items" },
      { status: 500 }
    );
  }
}

// POST: Add menu item (Admin only)
export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const validation = validateMenuItem(body);

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, message: validation.message },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO menu_items
        (name, price, description, image_url, category)
      VALUES (
        ${validation.name},
        ${validation.price},
        ${validation.description},
        ${validation.image_url},
        ${validation.category}
      )
      RETURNING
        id,
        name,
        price,
        description,
        image_url,
        category
    `;

    return NextResponse.json({
      success: true,
      message: "Menu item added successfully",
      menuItem: result[0],
    });
  } catch (error) {
    console.error("POST menu error:", error);

    const message =
      error instanceof Error ? error.message : "";

    if (message === "Unauthorized") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please login first." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to add menu item" },
      { status: 500 }
    );
  }
}

// PUT: Update menu item (Admin only)
export async function PUT(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const id = Number(body?.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { success: false, message: "Valid menu item ID is required." },
        { status: 400 }
      );
    }

    const validation = validateMenuItem(body);

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, message: validation.message },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE menu_items
      SET
        name = ${validation.name},
        price = ${validation.price},
        description = ${validation.description},
        image_url = ${validation.image_url},
        category = ${validation.category}
      WHERE id = ${id}
      RETURNING
        id,
        name,
        price,
        description,
        image_url,
        category
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, message: "Menu item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Menu item updated successfully",
      menuItem: result[0],
    });
  } catch (error) {
    console.error("PUT menu error:", error);

    const message =
      error instanceof Error ? error.message : "";

    if (message === "Unauthorized") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please login first." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to update menu item" },
      { status: 500 }
    );
  }
}

// DELETE: Remove menu item (Admin only)
export async function DELETE(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const id = Number(body?.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { success: false, message: "Valid menu item ID is required." },
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
        { success: false, message: "Menu item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    console.error("DELETE menu error:", error);

    const message =
      error instanceof Error ? error.message : "";

    if (message === "Unauthorized") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please login first." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to delete menu item" },
      { status: 500 }
    );
  }
}
