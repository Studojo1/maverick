/**
 * Internal pipeline status for internships (server-only).
 *
 * This is a SEPARATE field from the public `status` column. `status` controls
 * what shows on the public studojo.com board and must not be touched by the
 * pipeline tracker. `pipeline_status` is an ops-only label used to colour the
 * rows in the Maverick internships table; changing it never affects public
 * visibility.
 *
 * This repo has no migration tooling and the DB schema is managed externally,
 * so the column is provisioned lazily with an idempotent ADD COLUMN IF NOT
 * EXISTS the first time it is needed in a given server process.
 */

import db from "./db.server";
import { sql } from "drizzle-orm";

export const PIPELINE_STATUSES = [
  "published",
  "applications_sent",
  "interviews",
  "closed",
] as const;

export type PipelineStatus = (typeof PIPELINE_STATUSES)[number];

export const DEFAULT_PIPELINE_STATUS: PipelineStatus = "published";

export function isPipelineStatus(value: unknown): value is PipelineStatus {
  return (
    typeof value === "string" &&
    (PIPELINE_STATUSES as readonly string[]).includes(value)
  );
}

// Resolve the column once per process; subsequent calls await the same promise.
let ensurePromise: Promise<boolean> | null = null;

/**
 * Make sure the pipeline_status column exists, creating it if possible.
 *
 * Never throws. Returns true if the column is present (or was just created),
 * false if it is missing and could not be created (e.g. the app role lacks DDL
 * permission). Callers must degrade gracefully when this returns false so a
 * missing column never breaks the internships list or normal edits.
 */
export function ensurePipelineStatusColumn(): Promise<boolean> {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      try {
        const existing = await db.execute(
          sql`SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public'
                AND table_name = 'internships'
                AND column_name = 'pipeline_status'
              LIMIT 1`
        );
        if (existing.rows.length > 0) return true;

        await db.execute(
          sql`ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS pipeline_status TEXT NOT NULL DEFAULT 'published'`
        );
        return true;
      } catch (e: any) {
        console.warn(
          "[maverick] pipeline_status column unavailable, degrading gracefully:",
          e?.message
        );
        // Allow a later request to retry (e.g. after a transient DB error).
        ensurePromise = null;
        return false;
      }
    })();
  }
  return ensurePromise;
}
