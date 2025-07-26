import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getTokenFromHeader, verifyAuthToken } from "@/lib/verify-jwt";
import { deleteImage, uploadImage } from "@/lib/image-handler";

const updateMenuSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name too long")
    .optional(),
  description: z
    .array(z.string())
    .min(1, "At least one description is required")
    .optional(),
  price: z.number().positive("Price must be positive").optional(),
  discountedPrice: z
    .number()
    .positive("Discounted price must be positive")
    .optional()
    .nullable(),
  discountPercent: z
    .number()
    .int("Discount percent must be an integer")
    .min(0)
    .max(100, "Discount percent must be between 0-100")
    .optional()
    .nullable(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  imageUrl: z.string().url("Invalid image URL").optional().nullable(),
  imageKey: z.string().optional().nullable(),
  imageAlt: z.string().optional().nullable(),
  categoryId: z.string().min(1, "Category is required").optional(),
});

function getIdFromRequest(request: NextRequest): string | null {
  const segments = request.nextUrl.pathname.split("/");
  return segments[segments.length - 1] || null;
}

// GET - Get menu by ID
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request);
    const session = token ? verifyAuthToken(token) : null;

    if (!session || session.user_role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = getIdFromRequest(request);
    if (!id) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const menu = await prisma.menu.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!menu) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    return NextResponse.json({ menu });
  } catch (error) {
    console.error("GET /api/admin/menus/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update menu (with optional image upload)
export async function PUT(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request);
    const session = token ? verifyAuthToken(token) : null;

    if (!session || session.user_role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = getIdFromRequest(request);
    if (!id) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Check if request contains file upload
    const contentType = request.headers.get("content-type");
    let validatedData: z.infer<typeof updateMenuSchema>;
    let imageFile: File | null = null;

    if (contentType?.includes("multipart/form-data")) {
      // Handle form data with file upload
      const formData = await request.formData();
      const jsonData = formData.get("data") as string;
      imageFile = formData.get("image") as File | null;

      if (jsonData) {
        const parsedData = JSON.parse(jsonData);
        validatedData = updateMenuSchema.parse(parsedData);
      } else {
        validatedData = {};
      }
    } else {
      // Handle JSON data only
      const body = await request.json();
      validatedData = updateMenuSchema.parse(body);
    }

    const existingMenu = await prisma.menu.findUnique({
      where: { id },
    });

    if (!existingMenu) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    // Check if category exists (if provided)
    if (validatedData.categoryId) {
      const categoryExists = await prisma.category.findUnique({
        where: { id: validatedData.categoryId },
      });

      if (!categoryExists) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 400 }
        );
      }
    }

    // Handle image upload if provided
    let imageData = {};
    if (imageFile && imageFile.size > 0) {
      try {
        // Delete old image if exists
        if (existingMenu.imageKey) {
          await deleteImage(existingMenu.imageKey);
        }

        // Upload new image
        const uploadResult = await uploadImage(imageFile, "menus");
        imageData = {
          imageUrl: uploadResult.url,
          imageKey: uploadResult.key,
          imageAlt: validatedData.imageAlt || existingMenu.imageAlt,
        };
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
        return NextResponse.json(
          { error: "Failed to upload image" },
          { status: 500 }
        );
      }
    }

    // Prepare update data with discount calculation
    const updateData = {
      ...validatedData,
      ...imageData,
    };

    // Calculate discount percent if both price and discounted price are provided
    if (updateData.price && updateData.discountedPrice) {
      updateData.discountPercent = Math.round(
        ((updateData.price - updateData.discountedPrice) / updateData.price) *
          100
      );
    } else if (updateData.discountedPrice === null) {
      updateData.discountPercent = null;
    }

    const updatedMenu = await prisma.menu.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Menu updated successfully",
      menu: updatedMenu,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("PUT /api/admin/menus/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete menu
export async function DELETE(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request);
    const session = token ? verifyAuthToken(token) : null;

    if (!session || session.user_role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = getIdFromRequest(request);
    if (!id) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const existingMenu = await prisma.menu.findUnique({
      where: { id },
    });

    if (!existingMenu) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    // Delete associated image if exists
    if (existingMenu.imageKey) {
      try {
        await deleteImage(existingMenu.imageKey);
      } catch (imageError) {
        console.error("Failed to delete image:", imageError);
        // Continue with menu deletion even if image deletion fails
      }
    }

    await prisma.menu.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Menu deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/admin/menus/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
