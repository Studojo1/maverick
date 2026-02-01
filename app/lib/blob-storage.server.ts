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

  // Ensure container exists
  await containerClient.createIfNotExists({
    access: "private",
  });

  // Generate unique filename: timestamp-original-filename
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const blobName = `blog-images/${timestamp}-${sanitizedFilename}`;

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

  // Return proxy URL (not direct blob URL)
  return `/api/images/${blobName}`;
}

export async function getBlobUrl(blobName: string): Promise<string> {
  // Return proxy URL for frontend to serve
  return `/api/images/${blobName}`;
}

