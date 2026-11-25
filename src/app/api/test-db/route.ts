
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const result = await sql`
      SELECT
        NOW() AS current_time,
        current_database() AS database_name,
        current_schema() AS schema_name,
        to_regclass('public.admin_users') AS admin_table
    `;

    return NextResponse.json({
      success: true,
      message: "NeonDB connected successfully!",
      data: result,
    });
  } catch (error) {
    console.error("Database error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unknown database error",
      },
      { status: 500 }
    );
  }
}
