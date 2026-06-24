import { BlobServiceClient, StorageSharedKeyCredential } from "@azure/storage-blob";

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || "";
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY || "";
// Blog images should always use the blog-images container, regardless of AZURE_STORAGE_CONTAINER_NAME
const blogImagesContainerName = "blog-images";
const useLocalStack = process.env.USE_LOCALSTACK === "true";
const localStackEndpoint = process.env.LOCALSTACK_ENDPOINT || "http://localhost:4566";

let blobServiceClient: BlobServiceClient | null = null;

function getBlobServiceClient(): BlobServiceClient {
  if (blobServiceClient) {
    return blobServiceClient;
  }

  if (useLocalStack) {
    // Use LocalStack for local development
    const connectionString = `DefaultEndpointsProtocol=http;AccountName=${accountName};AccountKey=${accountKey};BlobEndpoint=${localStackEndpoint}/${accountName};`;
    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  } else {
    // Use real Azure Blob Storage
    if (!accountName || !accountKey) {
      throw new Error("AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY are required");
    }
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    const blobServiceUrl = `https://${accountName}.blob.core.windows.net`;
    blobServiceClient = new BlobServiceClient(blobServiceUrl, sharedKeyCredential);
  }

  return blobServiceClient;
}

/**
 * Download an application's preserved resume file from blob storage.
 * The frontend's /api/resumes/parse stores uploaded PDFs in a private container
 * (see Studojo1/frontend/app/lib/blob-storage.server.ts uploadApplicationResume).
 * This reads the bytes back so the ops dashboard can stream the *original* file
 * to the reviewer instead of a re-rendered JSON snapshot.
 *
 * Accepts the full blob URL as stored in internship_applications.resume_file_url
 * and returns the raw bytes plus the storage-reported content type. Returns null
 * if the blob can't be located or fetched.
 */
export async function downloadApplicationResume(
  blobUrl: string,
): Promise<{ bytes: ArrayBuffer; contentType: string | null } | null> {
  try {
    const url = new URL(blobUrl);
    // Path is "/<container>/<blobName...>" for real Azure, or
    // "/<account>/<container>/<blobName...>" when using LocalStack endpoints.
    // We normalize by stripping the leading slash and the first segment iff
    // it matches the configured storage account (LocalStack quirk).
    const segments = url.pathname.replace(/^\/+/, "").split("/");
    let containerName: string | undefined;
    let blobName: string | undefined;
    if (useLocalStack && segments[0] === accountName) {
      containerName = segments[1];
      blobName = segments.slice(2).join("/");
    } else {
      containerName = segments[0];
      blobName = segments.slice(1).join("/");
    }
    if (!containerName || !blobName) {
      console.error("[downloadApplicationResume] couldn't parse blob URL:", blobUrl);
      return null;
    }

    const client = getBlobServiceClient();
    const containerClient = client.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);

    const response = await blobClient.download();
    const contentType = response.contentType ?? null;
    const chunks: Buffer[] = [];
    const stream = response.readableStreamBody;
    if (!stream) {
      console.error("[downloadApplicationResume] no readable stream returned for", blobUrl);
      return null;
    }
    await new Promise<void>((resolve, reject) => {
      stream.on("data", (chunk: Buffer | string) => {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
      });
      stream.on("end", () => resolve());
      stream.on("error", reject);
    });
    const buf = Buffer.concat(chunks);
    return { bytes: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), contentType };
  } catch (error: any) {
    console.error("[downloadApplicationResume] failed:", error?.message || error);
    return null;
  }
}

export async function uploadBlogImage(
  file: File | Buffer,
  filename: string
): Promise<string> {
  try {
    console.log(`[uploadBlogImage] Starting upload: filename=${filename}`);
    
    const client = getBlobServiceClient();
    // Always use blog-images container for blog image uploads
    const containerClient = client.getContainerClient(blogImagesContainerName);

    // Ensure container exists (defaults to private if access not specified)
    console.log(`[uploadBlogImage] Ensuring container exists: ${blogImagesContainerName}`);
    await containerClient.createIfNotExists();
    console.log(`[uploadBlogImage] Container verified: ${blogImagesContainerName}`);

    // Use the filename as-is (it should already be unique from generateUniqueFilename)
    // Note: blobName should NOT include the container name since we're already in the container
    // The filename passed in should already have timestamp and random string from generateUniqueFilename
    const blobName = filename;
    const fileSize = file instanceof File ? file.size : (file as Buffer).length;
    
    console.log(`[uploadBlogImage] Upload details: container=${blogImagesContainerName}, blobName=${blobName}, fileSize=${fileSize} bytes`);

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload file
    console.log(`[uploadBlogImage] Starting blob upload...`);
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      const uploadResponse = await blockBlobClient.uploadData(Buffer.from(arrayBuffer), {
        blobHTTPHeaders: {
          blobContentType: file.type || "image/jpeg",
        },
      });
      console.log(`[uploadBlogImage] Upload response: etag=${uploadResponse.etag}, lastModified=${uploadResponse.lastModified}`);
    } else {
      const uploadResponse = await blockBlobClient.uploadData(file, {
        blobHTTPHeaders: {
          blobContentType: "image/jpeg",
        },
      });
      console.log(`[uploadBlogImage] Upload response: etag=${uploadResponse.etag}, lastModified=${uploadResponse.lastModified}`);
    }

    // Verify blob exists after upload
    console.log(`[uploadBlogImage] Verifying blob exists: ${blobName}`);
    const blobExists = await blockBlobClient.exists();
    if (!blobExists) {
      const errorMsg = `[uploadBlogImage] ERROR: Blob upload appeared to succeed but blob does not exist: ${blobName}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    console.log(`[uploadBlogImage] Blob verified to exist: ${blobName}`);

    // Return URL pointing to frontend app's image serving endpoint
    // Include the container name in the URL path
    const frontendUrl = process.env.VITE_FRONTEND_URL || 
                        process.env.FRONTEND_URL || 
                        "https://studojo.com";
    const imageUrl = `${frontendUrl}/api/images/blog-images/${blobName}`;
    console.log(`[uploadBlogImage] Upload successful, returning URL: ${imageUrl}`);
    return imageUrl;
  } catch (error: any) {
    console.error(`[uploadBlogImage] ERROR during upload:`, error);
    console.error(`[uploadBlogImage] Error details: message=${error.message}, stack=${error.stack}`);
    throw error;
  }
}

export async function getBlobUrl(blobName: string): Promise<string> {
  // Return URL pointing to frontend app's image serving endpoint
  // Include the container name in the URL path
  const frontendUrl = process.env.VITE_FRONTEND_URL || 
                      process.env.FRONTEND_URL || 
                      "https://studojo.com";
  // If blobName already includes blog-images/, use it as is, otherwise add it
  const path = blobName.startsWith("blog-images/") ? blobName : `blog-images/${blobName}`;
  return `${frontendUrl}/api/images/${path}`;
}

