import type { Route } from "./+types/upload-image";
import { getUserFromRequest } from "~/lib/auth-helper.server";
import { uploadBlogImage } from "~/lib/blob-storage.server";
import db from "~/lib/db.server";
import { sql } from "drizzle-orm";

export async function action({ request }: Route.ActionArgs) {
  // Check authentication and ops/admin role
  const user = await getUserFromRequest(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return Response.json(
      { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." },
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
    // Upload to Azure Blob Storage
    const url = await uploadBlogImage(file, file.name);
    
    return Response.json({
      url,
      filename: file.name,
    });
  } catch (error: any) {
    console.error("Error uploading image:", error);
    return Response.json(
      { error: "Failed to upload image", details: error.message },
      { status: 500 }
    );
  }
}

