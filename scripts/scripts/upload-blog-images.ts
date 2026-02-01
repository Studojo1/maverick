#!/usr/bin/env tsx
/**
 * Script to upload all blog images from local directory to Azure Blob Storage
 * 
 * Usage:
 *   tsx scripts/upload-blog-images.ts
 * 
 * Environment variables required:
 *   AZURE_STORAGE_ACCOUNT_NAME
 *   AZURE_STORAGE_ACCOUNT_KEY
 *   AZURE_STORAGE_CONTAINER_NAME (default: blog-images)
 */

import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { BlobServiceClient, StorageSharedKeyCredential } from "@azure/storage-blob";
import { existsSync } from "fs";

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || "";
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY || "";
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "blog-images";

if (!accountName || !accountKey) {
  console.error("AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY are required");
  process.exit(1);
}

const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
const blobServiceUrl = `https://${accountName}.blob.core.windows.net`;
const blobServiceClient = new BlobServiceClient(blobServiceUrl, sharedKeyCredential);

async function uploadImage(filePath: string, filename: string): Promise<void> {
  const containerClient = blobServiceClient.getContainerClient(containerName);
  // Create container with public blob access (allows public read access to blobs)
  try {
    await containerClient.createIfNotExists({ access: "blob" });
    console.log(`Container "${containerName}" created/verified with public blob access`);
  } catch (error: any) {
    // If creation fails, container might already exist, try to continue
    console.warn(`Container creation warning: ${error.message}`);
  }

  // Use filename as-is (it should already have timestamp prefix from migration)
  const blobName = filename;

  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const fileBuffer = await readFile(filePath);
  
  await blockBlobClient.uploadData(fileBuffer, {
    blobHTTPHeaders: {
      blobContentType: filename.endsWith(".png") ? "image/png" : filename.endsWith(".webp") ? "image/webp" : filename.endsWith(".jfif") ? "image/jpeg" : "image/jpeg",
    },
  });

  console.log(`Uploaded: ${filename}`);
}

async function main() {
  console.log("Starting blog image upload...");

  // Find images directory
  let imagesDir = join(process.cwd(), "data", "blog-images");
  if (!existsSync(imagesDir)) {
    imagesDir = join(process.cwd(), "..", "data", "blog-images");
    if (!existsSync(imagesDir)) {
      imagesDir = join("/app", "data", "blog-images");
      if (!existsSync(imagesDir)) {
        console.error(`Images directory not found. Tried: ${join(process.cwd(), "data", "blog-images")}`);
        console.error(`Also tried: ${imagesDir}`);
        process.exit(1);
      }
    }
  }

  console.log(`Reading images from: ${imagesDir}`);

  const files = await readdir(imagesDir);
  const imageFiles = files.filter(f => f.match(/\.(png|jpg|jpeg|webp|jfif)$/i));

  console.log(`Found ${imageFiles.length} images to upload`);

  let successCount = 0;
  let errorCount = 0;

  for (const filename of imageFiles) {
    try {
      const filePath = join(imagesDir, filename);
      await uploadImage(filePath, filename);
      successCount++;
    } catch (error: any) {
      console.error(`Error uploading ${filename}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\nUpload complete!`);
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
}

main().catch(console.error);

