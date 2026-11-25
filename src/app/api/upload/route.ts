
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireAdmin } from "@/lib/auth";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  // Verify admin before accepting an upload.
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json(
      { success: false, message: "Unauthorized. Admin login required." },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "No image file provided." },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Only JPG, PNG and WebP images are allowed.",
        },
        { status: 400 }
      );
    }

    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          message: "Image must be between 1 byte and 5 MB.",
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await new Promise<{ secure_url: string }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "savora/menu",
            resource_type: "image",
          },
          (error, uploadResult) => {
            if (error || !uploadResult) {
              reject(error || new Error("Cloudinary upload failed"));
              return;
            }

            resolve({
              secure_url: uploadResult.secure_url,
            });
          }
        );

        stream.end(buffer);
      }
    );

    return NextResponse.json({
      success: true,
      image_url: result.secure_url,
      message: "Image uploaded successfully.",
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Image upload failed. Please try again.",
      },
      { status: 500 }
    );
  }
}
