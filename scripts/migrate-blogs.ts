#!/usr/bin/env tsx
/**
 * Migration script to import old blog posts from MongoDB JSON to PostgreSQL
 * 
 * Usage:
 *   tsx scripts/migrate-blogs.ts
 * 
 * Environment variables required:
 *   DATABASE_URL - PostgreSQL connection string
 *   AZURE_STORAGE_ACCOUNT_NAME
 *   AZURE_STORAGE_ACCOUNT_KEY
 *   AZURE_STORAGE_CONTAINER_NAME (default: blog-images)
 *   USE_LOCALSTACK (optional, set to "true" for local development)
 *   LOCALSTACK_ENDPOINT (optional, default: http://localhost:4566)
 */

import { readFileSync } from "fs";
import { join } from "path";
import { Pool } from "pg";
import { randomUUID } from "crypto";
import { BlobServiceClient, StorageSharedKeyCredential } from "@azure/storage-blob";
import { readdir, readFile } from "fs/promises";
import { existsSync } from "fs";

interface OldBlogPost {
  _id: { $oid: string };
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  author: {
    userId: string;
    name: string;
    email: string;
  };
  status: "draft" | "published";
  publishedAt?: { $date: string };
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    ogImage?: string;
  };
  categories: string[];
  tags: string[];
  readingTime: number;
  viewCount: number;
  createdAt: { $date: string };
  updatedAt: { $date: string };
}

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://studojo:studojo@localhost:5432/postgres";
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || "";
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY || "";
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "blog-images";
const useLocalStack = process.env.USE_LOCALSTACK === "true";
const localStackEndpoint = process.env.LOCALSTACK_ENDPOINT || "http://localhost:4566";

const pool = new Pool({ connectionString: DATABASE_URL });

let blobServiceClient: BlobServiceClient;

function initBlobClient() {
  if (useLocalStack) {
    const connectionString = `DefaultEndpointsProtocol=http;AccountName=${accountName};AccountKey=${accountKey};BlobEndpoint=${localStackEndpoint}/${accountName};`;
    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  } else {
    if (!accountName || !accountKey) {
      throw new Error("AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY are required");
    }
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    const blobServiceUrl = `https://${accountName}.blob.core.windows.net`;
    blobServiceClient = new BlobServiceClient(blobServiceUrl, sharedKeyCredential);
  }
}

async function uploadImage(filePath: string, filename: string): Promise<string> {
  const containerClient = blobServiceClient.getContainerClient(containerName);
  await containerClient.createIfNotExists({ access: "blob" });

  // Use original filename to preserve existing structure, or add timestamp if needed
  // For migration, we'll use the original filename to match existing URLs
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  // Check if filename already has timestamp prefix, if not add one
  const hasTimestamp = /^\d+-/.test(sanitizedFilename);
  const blobName = hasTimestamp 
    ? `blog-images/${sanitizedFilename}`
    : `blog-images/${Date.now()}-${sanitizedFilename}`;

  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const fileBuffer = await readFile(filePath);
  
  await blockBlobClient.uploadData(fileBuffer, {
    blobHTTPHeaders: {
      blobContentType: filename.endsWith(".png") ? "image/png" : filename.endsWith(".webp") ? "image/webp" : "image/jpeg",
    },
  });

  return `/api/images/${blobName}`;
}

function extractFilenameFromUrl(url: string): string | null {
  // Extract filename from URLs like:
  // https://studojo.com/api/images/blog-images%2F1761571810990-Screenshot_2025-10-27_185958.png
  try {
    const decoded = decodeURIComponent(url);
    const match = decoded.match(/blog-images[\/%2F](.+)$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function migrateImage(oldUrl: string, imagesDir: string): Promise<string | null> {
  const filename = extractFilenameFromUrl(oldUrl);
  if (!filename) {
    console.warn(`Could not extract filename from URL: ${oldUrl}`);
    return null;
  }

  const filePath = join(imagesDir, filename);
  if (!existsSync(filePath)) {
    console.warn(`Image file not found: ${filePath}`);
    return null;
  }

  try {
    const newUrl = await uploadImage(filePath, filename);
    console.log(`Uploaded: ${filename} -> ${newUrl}`);
    return newUrl;
  } catch (error) {
    console.error(`Error uploading ${filename}:`, error);
    return null;
  }
}

async function migratePost(post: OldBlogPost, imagesDir: string): Promise<void> {
  // Check if post already exists (by slug)
  const existingResult = await pool.query(
    'SELECT id FROM blog_posts WHERE slug = $1',
    [post.slug]
  );

  if (existingResult.rows.length > 0) {
    console.log(`Skipping duplicate post: ${post.slug}`);
    return;
  }

  // Check if author user exists, if not create a placeholder or use first admin user
  let authorUserId = post.author.userId;
  const userCheck = await pool.query('SELECT id FROM "user" WHERE id = $1', [authorUserId]);
  if (userCheck.rows.length === 0) {
    // Try to find an admin user, otherwise use first user
    const adminUser = await pool.query('SELECT id FROM "user" WHERE role IN (\'admin\', \'ops\') LIMIT 1');
    if (adminUser.rows.length > 0) {
      authorUserId = adminUser.rows[0].id;
      console.log(`Author ${post.author.userId} not found, using admin user ${authorUserId} for post ${post.slug}`);
    } else {
      const anyUser = await pool.query('SELECT id FROM "user" LIMIT 1');
      if (anyUser.rows.length > 0) {
        authorUserId = anyUser.rows[0].id;
        console.log(`Author ${post.author.userId} not found, using user ${authorUserId} for post ${post.slug}`);
      } else {
        console.error(`No users found in database, cannot migrate post ${post.slug}`);
        return;
      }
    }
  }

  // Convert MongoDB ObjectId to UUID (use random UUID for new posts)
  const id = randomUUID();

  // Convert dates
  const publishedAt = post.publishedAt?.$date ? new Date(post.publishedAt.$date) : null;
  const createdAt = new Date(post.createdAt.$date);
  const updatedAt = new Date(post.updatedAt.$date);

  // Migrate featured image
  let featuredImage = post.featuredImage;
  if (featuredImage && featuredImage.includes("blog-images")) {
    const migratedUrl = await migrateImage(featuredImage, imagesDir);
    if (migratedUrl) {
      featuredImage = migratedUrl;
    }
  }

  // Migrate OG image
  let ogImage = post.seo?.ogImage;
  if (ogImage && ogImage.includes("blog-images")) {
    const migratedUrl = await migrateImage(ogImage, imagesDir);
    if (migratedUrl) {
      ogImage = migratedUrl;
    }
  }

  // Insert post
  await pool.query(
    `INSERT INTO blog_posts (
      id, title, slug, content, excerpt, featured_image,
      author_user_id, author_name, author_email,
      status, published_at,
      seo_meta_title, seo_meta_description, seo_keywords, seo_og_image,
      categories, tags, reading_time, view_count,
      created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9,
      $10, $11,
      $12, $13, $14, $15,
      $16, $17, $18, $19,
      $20, $21
    )`,
    [
      id,
      post.title,
      post.slug,
      post.content,
      post.excerpt,
      featuredImage || null,
      authorUserId,
      post.author.name,
      post.author.email,
      post.status,
      publishedAt,
      post.seo?.metaTitle || null,
      post.seo?.metaDescription || null,
      post.seo?.keywords || null,
      ogImage || null,
      post.categories || [],
      post.tags || [],
      post.readingTime,
      post.viewCount || 0,
      createdAt,
      updatedAt,
    ]
  );

  console.log(`Migrated: ${post.title} (${post.slug})`);
}

async function main() {
  console.log("Starting blog migration...");

  // Initialize blob storage client
  try {
    initBlobClient();
  } catch (error: any) {
    console.error("Failed to initialize blob storage client:", error.message);
    process.exit(1);
  }

  // Read JSON file - try multiple possible locations
  let jsonPath = join(process.cwd(), "data", "studojo.blog_posts.json");
  if (!existsSync(jsonPath)) {
    // Try parent directory
    jsonPath = join(process.cwd(), "..", "data", "studojo.blog_posts.json");
    if (!existsSync(jsonPath)) {
      // Try absolute path from project root
      jsonPath = join("/app", "data", "studojo.blog_posts.json");
      if (!existsSync(jsonPath)) {
        console.error(`JSON file not found. Tried: ${join(process.cwd(), "data", "studojo.blog_posts.json")}`);
        console.error(`Also tried: ${jsonPath}`);
        process.exit(1);
      }
    }
  }

  const jsonContent = readFileSync(jsonPath, "utf-8");
  const posts: OldBlogPost[] = JSON.parse(jsonContent);

  console.log(`Found ${posts.length} posts to migrate`);

  // Images directory - try multiple possible locations
  let imagesDir = join(process.cwd(), "data", "blog-images");
  if (!existsSync(imagesDir)) {
    imagesDir = join(process.cwd(), "..", "data", "blog-images");
    if (!existsSync(imagesDir)) {
      imagesDir = join("/app", "data", "blog-images");
      if (!existsSync(imagesDir)) {
        console.warn(`Images directory not found. Tried: ${join(process.cwd(), "data", "blog-images")}`);
        console.warn(`Also tried: ${imagesDir}`);
        console.warn("Continuing without image migration...");
      }
    }
  }

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const post of posts) {
    try {
      await migratePost(post, imagesDir);
      successCount++;
    } catch (error: any) {
      console.error(`Error migrating post ${post.slug}:`, error.message);
      errorCount++;
    }
  }

  console.log("\nMigration complete!");
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Skipped: ${skippedCount}`);

  await pool.end();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

