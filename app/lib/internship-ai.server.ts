/**
 * AI helpers for internship openings (server-only).
 *
 * Two capabilities, both backed by Azure OpenAI (see azure-openai.server.ts):
 *  1. extractOpening()  - turn a raw pasted JD into structured form fields
 *  2. generateWhatsAppMessage() - turn a published opening into a WhatsApp blast
 *
 * Both follow the house style from the listing system prompt: sharp, modern,
 * slightly aspirational; no fluff; no em dashes.
 */

import { chatCompletion } from "./azure-openai.server";

export interface ExtractedOpening {
  title: string;
  company_name: string;
  /** HTML for the rich-text Description editor */
  description: string;
  /** HTML for the rich-text Requirements editor */
  requirements: string;
  location: string;
  duration: string;
  stipend: string;
}

const EXTRACTION_SYSTEM_PROMPT = `You convert a raw internship/job description into a clean, structured opening for a job board.

Your tone is sharp, modern, and slightly aspirational, similar to high-quality startup job boards. Avoid fluff but make the opportunity sound compelling. Do not oversell an average role; keep it honest but appealing.

Return ONLY a JSON object with exactly these keys:
{
  "title": string,          // clean, corrected role title
  "company_name": string,   // company name ("" if truly unknown)
  "description": string,    // HTML, see rules below
  "requirements": string,   // HTML, see rules below
  "location": string,       // extracted or sensibly inferred, "" if unknown
  "duration": string,       // e.g. "3 months", "" if not specified
  "stipend": string         // "Paid", "Unpaid", or the exact stipend if given, "" if unknown
}

Rules for "description" (HTML only, NO <h1>/<h2>/<h3> tags):
- Open with 1-2 short lines on what the company does and what the role is about, wrapped in <p>.
- Add a <p><strong>What you'll do</strong></p> followed by a <ul> of concise <li> bullets for the responsibilities.
- Optionally close with one short <p> on why it's a good opportunity, only if justified.

Rules for "requirements" (HTML only, NO heading tags):
- <p><strong>Core</strong></p> then a <ul> of must-have skills as <li>.
- <p><strong>Nice to have</strong></p> then a <ul> of optional skills as <li>. Omit this block if there are none.

General rules:
- Rewrite and refine; never copy raw text verbatim.
- If information is missing, infer logically but do not hallucinate specific facts (numbers, names, dates).
- Never use em dashes anywhere.
- Keep sentences tight and readable.`;

const WHATSAPP_SYSTEM_PROMPT = `You write a WhatsApp message to promote an internship or job opening, in the exact style and length of the example below.

Follow this structure closely:
- Line 1: an emoji, the role title, and the company as a short punchy headline.
- A one line hook about why this role is worth attention.
- One or two lines on what the company does and what the role is about.
- A line "✨ What you'll do:" followed by 3 to 5 bullets, each starting with "• ".
- One punchy line (with an emoji like 🔥) on the impact or what makes it special.
- "📍 " followed by the location.
- "💰 " followed by the stipend (Paid, Unpaid, or the amount).
- A short "Perfect for someone..." line describing who should apply.
- A final call to action line starting with "👉 " that includes the exact application link provided by the user.

FORMATTING (very important):
- Separate each section with a BLANK LINE (an empty line, i.e. two line breaks) so the message is easy to read when pasted into WhatsApp. Do not run sections together.
- Inside the "✨ What you'll do:" block, keep each "• " bullet on its own line with no blank line between bullets.
- Use real line breaks, never the literal characters "\\n".

Example of the desired style, spacing, and length:

🧠 QA Intern, AI Healthcare Startup (Iro Health)

If you're interested in healthcare + AI + real-world impact, this is a rare one.

Iro Health is building an AI-powered clinical platform, and is hiring a QA Intern to help ensure the system is accurate, reliable, and safe for real patients.

✨ What you'll do:
• Test real clinical workflows (intake → diagnosis → care)
• Validate AI-generated outputs
• Find bugs, edge cases & system gaps
• Work closely with founders + engineers

🔥 This isn't basic QA, your work directly impacts patient care.

📍 Bangalore

💰 Paid (based on experience)

Perfect for someone curious, detail-oriented, and interested in healthtech + product

👉 DM / Apply: https://studojo.com/internships/qa-intern

Rules:
- Match that structure, tone, spacing, and length. Do NOT make it shorter than the example.
- Keep the blank lines between sections exactly as shown in the example.
- Use emojis like the example, but do not overdo it.
- NEVER use em dashes or en dashes ( — or – ). Use commas, periods, colons, or parentheses instead. (Arrows like → and bullets like • are fine.)
- Keep it honest; do not oversell an average role.
- The final 👉 line must contain the application link provided by the user, exactly as given.

Return ONLY the WhatsApp message text (with emojis and blank lines between sections). No preamble, no markdown headings, no surrounding quotes.`;

/**
 * Strip code fences / stray prose the model may wrap around JSON.
 */
function parseJsonObject(raw: string): any {
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
  }
  return JSON.parse(text);
}

export async function extractOpening(rawText: string): Promise<ExtractedOpening> {
  const content = await chatCompletion(
    [
      { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
      { role: "user", content: rawText },
    ],
    { json: true, temperature: 0.4 }
  );

  const parsed = parseJsonObject(content);

  return {
    title: String(parsed.title || "").trim(),
    company_name: String(parsed.company_name || "").trim(),
    description: String(parsed.description || "").trim(),
    requirements: String(parsed.requirements || "").trim(),
    location: String(parsed.location || "").trim(),
    duration: String(parsed.duration || "").trim(),
    stipend: String(parsed.stipend || "").trim(),
  };
}

export interface WhatsAppOpeningInput {
  title: string;
  company_name: string;
  /** May contain HTML; the model handles it fine as context. */
  description?: string;
  requirements?: string;
  location?: string;
  duration?: string;
  stipend?: string;
  applicationUrl: string;
}

export async function generateWhatsAppMessage(
  opening: WhatsAppOpeningInput
): Promise<string> {
  const details = [
    `Role: ${opening.title}`,
    `Company: ${opening.company_name}`,
    opening.location ? `Location: ${opening.location}` : null,
    opening.duration ? `Duration: ${opening.duration}` : null,
    opening.stipend ? `Stipend: ${opening.stipend}` : null,
    opening.description ? `Description: ${opening.description}` : null,
    opening.requirements ? `Requirements: ${opening.requirements}` : null,
    `Application link (use exactly this in the CTA): ${opening.applicationUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  const message = await chatCompletion(
    [
      { role: "system", content: WHATSAPP_SYSTEM_PROMPT },
      { role: "user", content: details },
    ],
    { temperature: 0.7, maxTokens: 800 }
  );

  return message.trim();
}
