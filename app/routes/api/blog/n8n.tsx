import type { Route } from "./+types/n8n";
import db from "~/lib/db.server";
import { sql } from "drizzle-orm";
import slugify from "slugify";
import readingTime from "reading-time";

/**
 * POST /api/blog/n8n
 *
 * Webhook endpoint for n8n to create or publish blog posts.
 * Auth: X-API-Key header must match N8N_BLOG_API_KEY env var.
 *
 * Body:
 * {
 *   title: string               — required
 *   content: string             — required, HTML
 *   excerpt: string             — required
 *   status?: "draft"|"published" — default: "published"
 *   featured_image?: string
 *   author_name?: string        — default: "Studojo"
 *   author_email?: string       — default: "admin@studojo.com"
 *   categories?: string[]
 *   tags?: string[]
 *   seo?: {
 *     meta_title?: string
 *     meta_description?: string
 *     keywords?: string[]
 *     og_image?: string
 *   }
 * }
 *
 * Returns:
 * {
 *   success: true,
 *   post: { id, slug, title, status, url }
 * }
 */

async function getApiKey(): Promise<string | null> {
  // 1. Prefer env var (set via kubectl)
  if (process.env.N8N_BLOG_API_KEY) return process.env.N8N_BLOG_API_KEY;
  // 2. Fall back to platform_settings table (set via admin panel)
  try {
    const result = await db.execute(
      sql`SELECT value FROM platform_settings WHERE key = 'n8n_blog_api_key' LIMIT 1`
    );
    if (result.rows.length > 0) return (result.rows[0] as any).value as string;
  } catch {
    // Table may not exist yet
  }
  return null;
}

async function apiKeyAuth(request: Request): Promise<boolean> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    console.error("[n8n blog] No API key configured. Set N8N_BLOG_API_KEY env var or via Admin > Settings.");
    return false;
  }
  const provided = request.headers.get("X-API-Key") || request.headers.get("x-api-key");
  return provided === apiKey;
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  if (!await apiKeyAuth(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    title,
    content,
    excerpt,
    status = "published",
    featured_image,
    author_name = "Studojo",
    author_email = "admin@studojo.com",
    categories,
    tags,
    seo,
  } = body;

  if (!title || !content || !excerpt) {
    return Response.json(
      { error: "title, content, and excerpt are required" },
      { status: 400 }
    );
  }

  if (!["draft", "published"].includes(status)) {
    return Response.json(
      { error: "status must be 'draft' or 'published'" },
      { status: 400 }
    );
  }

  try {
    // Generate unique slug
    let slug = slugify(title, { lower: true, strict: true });
    const originalSlug = slug;
    let counter = 1;
    while (true) {
      const existing = await db.execute(
        sql`SELECT id FROM blog_posts WHERE slug = ${slug} LIMIT 1`
      );
      if (existing.rows.length === 0) break;
      slug = `${originalSlug}-${counter++}`;
    }

    const readingTimeMinutes = Math.ceil(readingTime(content).minutes);
    const publishedAt = status === "published" ? new Date() : null;

    const seoKeywordsValue =
      seo?.keywords?.length > 0
        ? sql.raw(`ARRAY[${seo.keywords.map((k: string) => `'${k.replace(/'/g, "''")}'`).join(", ")}]`)
        : sql.raw("NULL");
    const categoriesValue =
      categories?.length > 0
        ? sql.raw(`ARRAY[${categories.map((c: string) => `'${c.replace(/'/g, "''")}'`).join(", ")}]`)
        : sql.raw("NULL");
    const tagsValue =
      tags?.length > 0
        ? sql.raw(`ARRAY[${tags.map((t: string) => `'${t.replace(/'/g, "''")}'`).join(", ")}]`)
        : sql.raw("NULL");

    const result = await db.execute(
      sql`
        INSERT INTO blog_posts (
          title, slug, content, excerpt, featured_image,
          author_user_id, author_name, author_email,
          status, published_at,
          seo_meta_title, seo_meta_description, seo_keywords, seo_og_image,
          categories, tags, reading_time
        ) VALUES (
          ${title}, ${slug}, ${content}, ${excerpt}, ${featured_image || null},
          ${"n8n-automation"}, ${author_name}, ${author_email},
          ${status}, ${publishedAt},
          ${seo?.meta_title || null}, ${seo?.meta_description || null},
          ${seoKeywordsValue},
          ${seo?.og_image || null},
          ${categoriesValue},
          ${tagsValue},
          ${readingTimeMinutes}
        ) RETURNING id, slug, title, status, created_at
      `
    );

    const post = result.rows[0] as any;
    const baseUrl = process.env.SITE_URL || "https://studojo.com";

    return Response.json({
      success: true,
      post: {
        id: post.id,
        slug: post.slug,
        title: post.title,
        status: post.status,
        url: `${baseUrl}/blog/${post.slug}`,
        created_at: post.created_at,
      },
    });
  } catch (error: any) {
    console.error("[n8n blog] Error creating post:", error);
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
