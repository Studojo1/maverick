import type { Route } from "./+types/upload-image";
import { getUserFromRequest } from "~/lib/auth-helper.server";
import { uploadBlogImage } from "~/lib/blob-storage.server";
import {
  validateFileContent,
  generateUniqueFilename,
} from "~/lib/file-validation.server";
import db from "~/lib/db.server";
import { sql } from "drizzle-orm";

export async function action({ request }: Route.ActionArgs) {
  // Check authentication and ops/admin role
  const authHeader = request.headers.get("Authorization");
  const cookies = request.headers.get("Cookie");
  const origin = request.headers.get("Origin");
  
  console.debug("[upload-image] Authorization header:", authHeader ? "present" : "missing");
  console.debug("[upload-image] Cookies:", cookies ? "present" : "missing");
  console.debug("[upload-image] Origin:", origin || "missing");
  
  const user = await getUserFromRequest(request);
  if (!user) {
    console.debug("[upload-image] No user found from request - auth failed");
    // Return more helpful error message
    return Response.json({ 
      error: "Unauthorized", 
      message: "Please ensure you are logged in and have the required permissions. Try refreshing the page."
    }, { status: 401 });
  }
  
  console.debug("[upload-image] User authenticated:", user.id);

  // Check if user has ops or admin role
  const result = await db.execute(
    sql`SELECT role FROM "user" WHERE id = ${user.id} LIMIT 1`
  );

  if (result.rows.length === 0) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const role = result.rows[0].role as string | null;
  if (role !== "ops" && role !== "admin") {
    return Response.json({ error: "Forbidden - Ops or Admin access required" }, { status: 403 });
  }

  // Parse form data
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate file type (MIME type check)
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const mimeType = file.type || "image/jpeg";
  if (!allowedTypes.includes(mimeType)) {
    return Response.json(
      { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." },
      { status: 400 }
    );
  }

  // Validate file content using magic bytes (prevents MIME type spoofing)
  const isValidContent = await validateFileContent(file, mimeType);
  if (!isValidContent) {
    return Response.json(
      { error: "File content does not match declared file type. Possible file type spoofing." },
      { status: 400 }
    );
  }

  // Validate file size (5MB max)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return Response.json(
      { error: "File size exceeds 5MB limit." },
      { status: 400 }
    );
  }

  try {
    // Generate unique, sanitized filename
    const uniqueFilename = generateUniqueFilename(file.name);
    
    // Upload to Azure Blob Storage with sanitized filename
    const url = await uploadBlogImage(file, uniqueFilename);
    
    return Response.json({
      url,
      filename: uniqueFilename,
    });
  } catch (error: any) {
    console.error("Error uploading image:", error);
    return Response.json(
      { error: "Failed to upload image", details: error.message },
      { status: 500 }
    );
  }
}

