// lib/image-handler.ts
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface UploadResult {
  url: string;
  key: string;
}

/**
 * Upload image to Supabase Storage
 * @param file - The image file to upload
 * @param folder - The folder name (e.g., 'menus', 'categories')
 * @returns Upload result with URL and key
 */
export async function uploadImage(
  file: File,
  folder: string
): Promise<UploadResult> {
  try {
    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        "Invalid file type. Only JPEG, PNG, and WebP are allowed."
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error("File size too large. Maximum size is 5MB.");
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    const fileName = `${timestamp}-${randomString}.${fileExtension}`;
    const filePath = `${folder}/${fileName}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from("images")
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("images")
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      key: filePath,
    };
  } catch (error) {
    console.error("Image upload error:", error);
    throw error;
  }
}

/**
 * Delete image from Supabase Storage
 * @param imageKey - The file path/key in storage
 */
export async function deleteImage(imageKey: string): Promise<void> {
  try {
    const { error } = await supabase.storage.from("images").remove([imageKey]);

    if (error) {
      console.error("Supabase delete error:", error);
      throw new Error(`Delete failed: ${error.message}`);
    }
  } catch (error) {
    console.error("Image delete error:", error);
    throw error;
  }
}

/**
 * Update image - delete old and upload new
 * @param oldImageKey - The old image key to delete
 * @param newFile - The new image file to upload
 * @param folder - The folder name
 * @returns Upload result for new image
 */
export async function updateImage(
  oldImageKey: string | null,
  newFile: File,
  folder: string
): Promise<UploadResult> {
  try {
    // Delete old image if exists
    if (oldImageKey) {
      await deleteImage(oldImageKey);
    }

    // Upload new image
    return await uploadImage(newFile, folder);
  } catch (error) {
    console.error("Image update error:", error);
    throw error;
  }
}

/**
 * Validate image file
 * @param file - The file to validate
 * @returns boolean indicating if file is valid
 */
export function validateImageFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "Invalid file type. Only JPEG, PNG, and WebP are allowed.",
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: "File size too large. Maximum size is 5MB.",
    };
  }

  return { isValid: true };
}
