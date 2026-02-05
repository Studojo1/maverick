import type { Route } from "./+types/$id";
import { getUserFromRequest } from "~/lib/auth-helper.server";
import db from "~/lib/db.server";
import { sql } from "drizzle-orm";
import slugify from "slugify";
import readingTime from "reading-time";

// GET /api/blog/:id - Get single post
export async function loader({ request, params }: Route.LoaderArgs) {
  // Check authentication and ops/admin role
  const user = await getUserFromRequest(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user has ops or admin role
  const roleResult = await db.execute(
    sql`SELECT role FROM "user" WHERE id = ${user.id} LIMIT 1`
  );

  if (roleResult.rows.length === 0) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const role = roleResult.rows[0].role as string | null;
  if (role !== "ops" && role !== "admin") {
    return Response.json({ error: "Forbidden - Ops or Admin access required" }, { status: 403 });
  }

  const { id } = params;

  const result = await db.execute(
    sql`SELECT * FROM blog_posts WHERE id = ${id} LIMIT 1`
  );

  if (result.rows.length === 0) {
    return Response.json({ error: "Post not found" }, { status: 404 });
  }

  return Response.json({ post: result.rows[0] });
}

// PUT /api/blog/:id - Update post
export async function action({ request, params }: Route.ActionArgs) {
  // Check authentication and ops/admin role
  const user = await getUserFromRequest(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user has ops or admin role
  const roleResult = await db.execute(
    sql`SELECT role FROM "user" WHERE id = ${user.id} LIMIT 1`
  );

  if (roleResult.rows.length === 0) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const role = roleResult.rows[0].role as string | null;
  if (role !== "ops" && role !== "admin") {
    return Response.json({ error: "Forbidden - Ops or Admin access required" }, { status: 403 });
  }

  const { id } = params;
  const method = request.method;

  if (method === "PUT") {
    // Get existing post
    const existingResult = await db.execute(
      sql`SELECT * FROM blog_posts WHERE id = ${id} LIMIT 1`
    );

    if (existingResult.rows.length === 0) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    const existing = existingResult.rows[0] as any;
    const body = await request.json();
    const {
      title,
      content,
      excerpt,
      featuredImage,
      status,
      seo,
      categories,
      tags,
    } = body;

    // Update fields
    const updates: string[] = [];
    const values: any[] = [];

    if (title !== undefined) {
      const escapedTitle = title.replace(/'/g, "''");
      updates.push(`title = '${escapedTitle}'`);

      // Regenerate slug if title changed
      if (title !== existing.title) {
        let slug = slugify(title, { lower: true, strict: true });
        let counter = 1;
        const originalSlug = slug;

        while (true) {
          const checkResult = await db.execute(
            sql`SELECT id FROM blog_posts WHERE slug = ${slug} AND id != ${id} LIMIT 1`
          );
          if (checkResult.rows.length === 0) {
            break;
          }
          slug = `${originalSlug}-${counter}`;
          counter++;
        }

        updates.push(`slug = '${slug}'`);
      }
    }

    if (content !== undefined) {
      const escapedContent = content.replace(/'/g, "''");
      updates.push(`content = '${escapedContent}'`);

      // Recalculate reading time if content changed
      if (content !== existing.content) {
        const readingTimeResult = readingTime(content);
        const readingTimeMinutes = Math.ceil(readingTimeResult.minutes);
        updates.push(`reading_time = ${readingTimeMinutes}`);
      }
    }

    if (excerpt !== undefined) {
      const escapedExcerpt = excerpt.replace(/'/g, "''");
      updates.push(`excerpt = '${escapedExcerpt}'`);
    }

    if (featuredImage !== undefined) {
      const escapedImage = featuredImage ? featuredImage.replace(/'/g, "''") : "";
      updates.push(`featured_image = ${featuredImage ? `'${escapedImage}'` : "NULL"}`);
    }

    if (status !== undefined) {
      updates.push(`status = '${status}'`);

      // Set published_at if status changes to published
      if (status === "published" && existing.status !== "published") {
        updates.push(`published_at = NOW()`);
      }
    }

    if (seo !== undefined) {
      if (seo.metaTitle !== undefined) {
        const escaped = seo.metaTitle.replace(/'/g, "''");
        updates.push(`seo_meta_title = ${seo.metaTitle ? `'${escaped}'` : "NULL"}`);
      }
      if (seo.metaDescription !== undefined) {
        const escaped = seo.metaDescription.replace(/'/g, "''");
        updates.push(`seo_meta_description = ${seo.metaDescription ? `'${escaped}'` : "NULL"}`);
      }
      if (seo.keywords !== undefined) {
        if (seo.keywords && seo.keywords.length > 0) {
          const escapedKeywords = seo.keywords.map((k: string) => `'${k.replace(/'/g, "''")}'`).join(", ");
          updates.push(`seo_keywords = ARRAY[${escapedKeywords}]`);
        } else {
          updates.push(`seo_keywords = NULL`);
        }
      }
      if (seo.ogImage !== undefined) {
        const escaped = seo.ogImage ? seo.ogImage.replace(/'/g, "''") : "";
        updates.push(`seo_og_image = ${seo.ogImage ? `'${escaped}'` : "NULL"}`);
      }
    }

    if (categories !== undefined) {
      if (categories && categories.length > 0) {
        const escapedCategories = categories.map((c: string) => `'${c.replace(/'/g, "''")}'`).join(", ");
        updates.push(`categories = ARRAY[${escapedCategories}]`);
      } else {
        updates.push(`categories = NULL`);
      }
    }

    if (tags !== undefined) {
      if (tags && tags.length > 0) {
        const escapedTags = tags.map((t: string) => `'${t.replace(/'/g, "''")}'`).join(", ");
        updates.push(`tags = ARRAY[${escapedTags}]`);
      } else {
        updates.push(`tags = NULL`);
      }
    }

    // Always update updated_at
    updates.push(`updated_at = NOW()`);

    if (updates.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    // Build and execute update query
    const updateClause = updates.join(", ");
    const result = await db.execute(
      sql.raw(`UPDATE blog_posts SET ${updateClause} WHERE id = '${id}' RETURNING *`)
    );

    if (result.rows.length === 0) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    return Response.json({ success: true, post: result.rows[0] });
  } else if (method === "DELETE") {
    // Delete post
    const result = await db.execute(
      sql`DELETE FROM blog_posts WHERE id = ${id} RETURNING id`
    );

    if (result.rows.length === 0) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}

