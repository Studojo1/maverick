import type { Route } from "./+types/route";
import { getUserFromRequest } from "~/lib/auth-helper.server";
import db from "~/lib/db.server";
import { sql } from "drizzle-orm";
import slugify from "slugify";
import readingTime from "reading-time";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image?: string;
  author_user_id: string;
  author_name: string;
  author_email: string;
  status: "draft" | "published";
  published_at?: Date;
  seo_meta_title?: string;
  seo_meta_description?: string;
  seo_keywords?: string[];
  seo_og_image?: string;
  categories?: string[];
  tags?: string[];
  reading_time: number;
  view_count: number;
  created_at: Date;
  updated_at: Date;
}

// GET /api/blog - List posts
export async function loader({ request }: Route.LoaderArgs) {
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

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "10", 10);
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search");
  const category = url.searchParams.get("category");

  const offset = (page - 1) * limit;

  let query = sql`SELECT * FROM blog_posts WHERE 1=1`;
  const params: any[] = [];

  if (status) {
    query = sql`${query} AND status = ${status}`;
  }

  if (search) {
    query = sql`${query} AND (title ILIKE ${`%${search}%`} OR excerpt ILIKE ${`%${search}%`})`;
  }

  if (category) {
    query = sql`${query} AND ${category} = ANY(categories)`;
  }

  query = sql`${query} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

  const posts = await db.execute(query);
  const countResult = await db.execute(
    sql`SELECT COUNT(*) as total FROM blog_posts WHERE 1=1 ${status ? sql`AND status = ${status}` : sql``} ${search ? sql`AND (title ILIKE ${`%${search}%`} OR excerpt ILIKE ${`%${search}%`})` : sql``} ${category ? sql`AND ${category} = ANY(categories)` : sql``}`
  );

  const total = parseInt((countResult.rows[0] as any).total, 10);

  return Response.json({
    posts: posts.rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

// POST /api/blog - Create post
export async function action({ request }: Route.ActionArgs) {
  try {
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

    // User already fetched above

    const body = await request.json();
    const { title, content, excerpt, featuredImage, status, seo, categories, tags } = body;

    if (!title || !content || !excerpt) {
      return Response.json({ error: "Title, content, and excerpt are required" }, { status: 400 });
    }

    // Generate slug
    let slug = slugify(title, { lower: true, strict: true });
    let counter = 1;
    let originalSlug = slug;

    // Ensure uniqueness
    while (true) {
      const existing = await db.execute(
        sql`SELECT id FROM blog_posts WHERE slug = ${slug} LIMIT 1`
      );
      if (existing.rows.length === 0) {
        break;
      }
      slug = `${originalSlug}-${counter}`;
      counter++;
    }

    // Calculate reading time
    const readingTimeResult = readingTime(content);
    const readingTimeMinutes = Math.ceil(readingTimeResult.minutes);

    // Set published_at if status is published
    const publishedAt = status === "published" ? new Date() : null;

    // Prepare array values - columns are text[] not jsonb
    // Build ARRAY syntax for PostgreSQL text[] columns
    const seoKeywordsValue = seo?.keywords && seo.keywords.length > 0
      ? sql.raw(`ARRAY[${seo.keywords.map((k: string) => `'${k.replace(/'/g, "''")}'`).join(", ")}]`)
      : sql.raw("NULL");
    const categoriesValue = categories && categories.length > 0
      ? sql.raw(`ARRAY[${categories.map((c: string) => `'${c.replace(/'/g, "''")}'`).join(", ")}]`)
      : sql.raw("NULL");
    const tagsValue = tags && tags.length > 0
      ? sql.raw(`ARRAY[${tags.map((t: string) => `'${t.replace(/'/g, "''")}'`).join(", ")}]`)
      : sql.raw("NULL");

    // Insert post
    const result = await db.execute(
      sql`
        INSERT INTO blog_posts (
          title, slug, content, excerpt, featured_image,
          author_user_id, author_name, author_email,
          status, published_at,
          seo_meta_title, seo_meta_description, seo_keywords, seo_og_image,
          categories, tags, reading_time
        ) VALUES (
          ${title}, ${slug}, ${content}, ${excerpt}, ${featuredImage || null},
          ${user.id}, ${user.name}, ${user.email},
          ${status}, ${publishedAt},
          ${seo?.metaTitle || null}, ${seo?.metaDescription || null},
          ${seoKeywordsValue},
          ${seo?.ogImage || null},
          ${categoriesValue},
          ${tagsValue},
          ${readingTimeMinutes}
        ) RETURNING *
      `
    );

    const post = result.rows[0] as BlogPost;

    return Response.json({ success: true, post });
  } catch (error: any) {
    console.error("Error creating blog post:", error);
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

