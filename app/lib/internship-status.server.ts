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

// Run the ALTER once per process; subsequent calls await the same promise.
let ensurePromise: Promise<void> | null = null;

export function ensurePipelineStatusColumn(): Promise<void> {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      await db.execute(
        sql`ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS pipeline_status TEXT NOT NULL DEFAULT 'published'`
      );
    })().catch((e) => {
      // Allow a later request to retry if this failed transiently.
      ensurePromise = null;
      throw e;
    });
  }
  return ensurePromise;
}
