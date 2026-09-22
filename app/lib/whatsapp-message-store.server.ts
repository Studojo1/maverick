/**
 * Persistence for per internship WhatsApp messages (server-only).
 *
 * A generated message is stored on the internship row and reused from then on,
 * so viewing an opening a second time costs nothing. Only an explicit
 * regenerate, or an edit to the opening, produces a new one.
 *
 * This repo has no migration tooling and the DB schema is managed externally,
 * so the column is provisioned lazily with an idempotent ADD COLUMN IF NOT
 * EXISTS the first time it is needed in a given server process, exactly like
 * pipeline_status does in internship-status.server.ts.
 */

import db from "./db.server";
import { sql } from "drizzle-orm";

// Resolve the column once per process; subsequent calls await the same promise.
let ensurePromise: Promise<boolean> | null = null;

/**
 * Make sure the whatsapp_message column exists, creating it if possible.
 *
 * Never throws. Returns true if the column is present (or was just created),
 * false if it is missing and could not be created (e.g. the app role lacks DDL
 * permission). Callers must degrade gracefully when this returns false: the
 * feature then simply generates a fresh message every time, as it did before.
 */
export function ensureWhatsAppMessageColumn(): Promise<boolean> {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      try {
        const existing = await db.execute(
          sql`SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public'
                AND table_name = 'internships'
                AND column_name = 'whatsapp_message'
              LIMIT 1`
        );
        if (existing.rows.length > 0) return true;

        await db.execute(
          sql`ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS whatsapp_message TEXT`
        );
        return true;
      } catch (e: any) {
        console.warn(
          "[maverick] whatsapp_message column unavailable, messages will not be reused:",
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

/** The stored message for an opening, or null if there is not one yet. */
export async function getStoredMessage(id: string): Promise<string | null> {
  if (!(await ensureWhatsAppMessageColumn())) return null;

  try {
    const result = await db.execute(
      sql`SELECT whatsapp_message FROM public.internships WHERE id = ${id} LIMIT 1`
    );
    const stored = (result.rows[0] as any)?.whatsapp_message;
    return typeof stored === "string" && stored.trim() ? stored : null;
  } catch (e: any) {
    console.warn("[maverick] could not read stored WhatsApp message:", e?.message);
    return null;
  }
}

/**
 * Remember a generated message. Never throws: failing to store it only means
 * the next view regenerates, which is the old behaviour.
 */
export async function storeMessage(id: string, message: string): Promise<void> {
  if (!(await ensureWhatsAppMessageColumn())) return;

  try {
    await db.execute(
      sql`UPDATE public.internships SET whatsapp_message = ${message} WHERE id = ${id}`
    );
  } catch (e: any) {
    console.warn("[maverick] could not store WhatsApp message:", e?.message);
  }
}

/**
 * Drop the stored message so the next view regenerates it. Called when an
 * opening is edited, since a remembered message would otherwise keep quoting
 * the old title, stipend or location.
 */
export async function clearStoredMessage(id: string): Promise<void> {
  if (!(await ensureWhatsAppMessageColumn())) return;

  try {
    await db.execute(
      sql`UPDATE public.internships SET whatsapp_message = NULL WHERE id = ${id}`
    );
  } catch (e: any) {
    console.warn("[maverick] could not clear stored WhatsApp message:", e?.message);
  }
}
