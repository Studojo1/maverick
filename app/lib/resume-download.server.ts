/**
 * Shared resume-download helpers (server-only).
 *
 * `renderApplicationResume` is the single source of truth for turning an
 * application row into downloadable bytes. It mirrors the 3-tier strategy the
 * single-file download endpoint has always used:
 *   1. Direct-upload applicants: stream the original file from blob storage.
 *   2. Studojo-builder resumes: render a PDF via the resume service.
 *   3. Fallback: the raw JSON snapshot.
 *
 * It is used by both the single download endpoint and the bulk zip endpoint so
 * the two never drift apart.
 */

import db from "./db.server";
import { sql } from "drizzle-orm";
import { downloadApplicationResume } from "./blob-storage.server";

export interface RenderedResume {
  bytes: Uint8Array;
  contentType: string;
  /** File extension without the dot, e.g. "pdf", "docx", "json". */
  ext: string;
}

function extFromContentType(
  contentType: string | null | undefined,
  fileName?: string | null
): string {
  const ct = (contentType || "").toLowerCase();
  if (ct.includes("application/pdf")) return "pdf";
  if (ct.includes("application/json")) return "json";
  if (ct.includes("wordprocessingml")) return "docx";
  if (ct.includes("msword")) return "doc";
  // Fall back to the original file name's extension if it has one.
  const m = fileName?.match(/\.([a-zA-Z0-9]{1,6})$/);
  if (m) return m[1].toLowerCase();
  return "pdf";
}

/**
 * Resolve an application row (must include resume_snapshot, resume_id,
 * resume_file_url, resume_file_content_type, resume_file_name) into bytes.
 * Always resolves to *something* downloadable (JSON snapshot in the worst case).
 */
export async function renderApplicationResume(row: any): Promise<RenderedResume> {
  const resumeSnapshot = row.resume_snapshot;

  // 1. Direct-upload applicants: stream the exact submitted file.
  if (row.resume_file_url) {
    const original = await downloadApplicationResume(row.resume_file_url as string);
    if (original) {
      const contentType =
        (row.resume_file_content_type as string | null) ||
        original.contentType ||
        "application/octet-stream";
      return {
        bytes: new Uint8Array(original.bytes),
        contentType,
        ext: extFromContentType(contentType, row.resume_file_name),
      };
    }
    console.warn(
      "[resume-download] blob fetch failed, falling back to snapshot render"
    );
  }

  // 2. Render a PDF via the resume service.
  const resumeServiceUrl =
    process.env.RESUME_SERVICE_URL || "http://resume-service:8086";
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    const pdfResponse = await fetch(`${resumeServiceUrl}/make-resume`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resumeSnapshot),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (pdfResponse.ok) {
      const contentType = pdfResponse.headers.get("content-type");
      if (contentType?.includes("application/pdf")) {
        const buf = await pdfResponse.arrayBuffer();
        return { bytes: new Uint8Array(buf), contentType: "application/pdf", ext: "pdf" };
      }
      const errorText = await pdfResponse.text();
      console.error(
        `[resume-download] resume service returned non-PDF (${contentType}): ${errorText.substring(0, 200)}`
      );
    } else {
      const errorText = await pdfResponse.text();
      console.error(
        `[resume-download] resume service returned ${pdfResponse.status}: ${errorText.substring(0, 200)}`
      );
    }
  } catch (error: any) {
    if (error?.name === "AbortError") {
      console.error("[resume-download] resume service timed out after 30s");
    } else {
      console.error(
        "[resume-download] failed to render PDF:",
        error?.message || error
      );
    }
  }

  // 3. Fallback: raw JSON snapshot.
  const json = JSON.stringify(resumeSnapshot ?? null, null, 2);
  return {
    bytes: new TextEncoder().encode(json),
    contentType: "application/json",
    ext: "json",
  };
}

// --- Downloaded tracking -------------------------------------------------

// Resolve the column once per process; never throws (see pipeline_status).
let ensureDownloadedPromise: Promise<boolean> | null = null;

/**
 * Ensure internship_applications.resume_downloaded_at exists, creating it if
 * possible. Returns false (and degrades gracefully) if it can't be created.
 */
export function ensureResumeDownloadedColumn(): Promise<boolean> {
  if (!ensureDownloadedPromise) {
    ensureDownloadedPromise = (async () => {
      try {
        const existing = await db.execute(
          sql`SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public'
                AND table_name = 'internship_applications'
                AND column_name = 'resume_downloaded_at'
              LIMIT 1`
        );
        if (existing.rows.length > 0) return true;
        await db.execute(
          sql`ALTER TABLE public.internship_applications ADD COLUMN IF NOT EXISTS resume_downloaded_at TIMESTAMPTZ`
        );
        return true;
      } catch (e: any) {
        console.warn(
          "[resume-download] resume_downloaded_at column unavailable, degrading gracefully:",
          e?.message
        );
        ensureDownloadedPromise = null;
        return false;
      }
    })();
  }
  return ensureDownloadedPromise;
}
