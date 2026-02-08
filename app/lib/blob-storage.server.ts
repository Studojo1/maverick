import { BlobServiceClient, StorageSharedKeyCredential } from "@azure/storage-blob";

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || "";
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY || "";
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "blog-images";
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
  const client = getBlobServiceClient();
  const containerClient = client.getContainerClient(containerName);

  // Ensure container exists (defaults to private if access not specified)
  await containerClient.createIfNotExists();

  // Generate unique filename: timestamp-original-filename
  // Note: blobName should NOT include the container name since we're already in the container
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const blobName = `${timestamp}-${sanitizedFilename}`;

  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  // Upload file
  if (file instanceof File) {
    const arrayBuffer = await file.arrayBuffer();
    await blockBlobClient.uploadData(Buffer.from(arrayBuffer), {
      blobHTTPHeaders: {
        blobContentType: file.type || "image/jpeg",
      },
    });
  } else {
    await blockBlobClient.uploadData(file, {
      blobHTTPHeaders: {
        blobContentType: "image/jpeg",
      },
    });
  }

  // Return URL pointing to frontend app's image serving endpoint
  const frontendUrl = process.env.VITE_FRONTEND_URL || 
                      process.env.FRONTEND_URL || 
                      "https://studojo.com";
  return `${frontendUrl}/api/images/${blobName}`;
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

