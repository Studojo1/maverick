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

