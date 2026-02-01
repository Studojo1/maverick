/**
 * Magic bytes (file signatures) for image formats
 */
const MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46], [0x57, 0x45, 0x42, 0x50]], // RIFF...WEBP
};

/**
 * Validate file content using magic bytes (file signatures)
 * This prevents MIME type spoofing attacks
 */
export async function validateFileContent(
  file: File,
  expectedMimeType: string
): Promise<boolean> {
  const signatures = MAGIC_BYTES[expectedMimeType];
  if (!signatures) {
    // Unknown MIME type, reject
    return false;
  }

  // Read first few bytes to check magic bytes
  const arrayBuffer = await file.slice(0, 12).arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // Check if any signature matches
  for (const signature of signatures) {
    let matches = true;
    for (let i = 0; i < signature.length; i++) {
      if (bytes[i] !== signature[i]) {
        matches = false;
        break;
      }
    }
    if (matches) {
      return true;
    }
  }

  return false;
}

/**
 * Sanitize filename by removing path components and dangerous characters
 */
export function sanitizeFilename(filename: string): string {
  // Remove path components (../, ./, etc.)
  const basename = filename.split("/").pop() || filename.split("\\").pop() || filename;
  
  // Remove dangerous characters and keep only alphanumeric, dots, hyphens, underscores
  const sanitized = basename.replace(/[^a-zA-Z0-9._-]/g, "_");
  
  // Remove leading dots and ensure it's not empty
  const cleaned = sanitized.replace(/^\.+/, "").trim();
  
  // If empty after cleaning, generate a default name
  if (!cleaned) {
    return "image";
  }
  
  // Limit length
  const maxLength = 255;
  if (cleaned.length > maxLength) {
    const ext = cleaned.substring(cleaned.lastIndexOf("."));
    const name = cleaned.substring(0, maxLength - ext.length);
    return name + ext;
  }
  
  return cleaned;
}

/**
 * Generate a unique filename with extension preserved
 */
export function generateUniqueFilename(originalFilename: string): string {
  const sanitized = sanitizeFilename(originalFilename);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8); // 6 random chars
  
  // Preserve extension if present
  const lastDot = sanitized.lastIndexOf(".");
  if (lastDot > 0) {
    const name = sanitized.substring(0, lastDot);
    const ext = sanitized.substring(lastDot);
    return `${timestamp}-${random}-${name}${ext}`;
  }
  
  return `${timestamp}-${random}-${sanitized}`;
}

