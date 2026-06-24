/**
 * Minimal Azure OpenAI client (server-only).
 *
 * Calls the Azure OpenAI Chat Completions REST API directly via fetch so we
 * don't pull in a heavy SDK. Used by the internship "Generate Opening" and
 * "Generate WhatsApp message" features.
 *
 * Required env vars (wired from the shared `app-secrets` secret in the
 * `studojo` namespace, same as the other services):
 *   AZURE_OPENAI_ENDPOINT          e.g. https://my-resource.openai.azure.com
 *   AZURE_OPENAI_API_KEY           the resource key
 *   AZURE_OPENAI_CHAT_DEPLOYMENT   the chat model deployment name
 *     (AZURE_OPENAI_DEPLOYMENT is also accepted as an alias)
 *   AZURE_OPENAI_API_VERSION       optional, defaults to 2024-10-21
 */

function getDeployment(): string | undefined {
  return process.env.AZURE_OPENAI_DEPLOYMENT || process.env.AZURE_OPENAI_CHAT_DEPLOYMENT;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatOptions {
  /** When true, asks the model to return a JSON object (response_format). */
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export function isAzureOpenAIConfigured(): boolean {
  return Boolean(
    process.env.AZURE_OPENAI_ENDPOINT &&
      process.env.AZURE_OPENAI_API_KEY &&
      getDeployment()
  );
}

export async function chatCompletion(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<string> {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = getDeployment();
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-10-21";

  if (!endpoint || !apiKey || !deployment) {
    throw new Error(
      "Azure OpenAI is not configured. Set AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY and AZURE_OPENAI_CHAT_DEPLOYMENT."
    );
  }

  const url = `${endpoint.replace(/\/$/, "")}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      messages,
      temperature: options.temperature ?? 0.5,
      max_tokens: options.maxTokens ?? 2000,
      ...(options.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error(`[azure-openai] ${response.status} ${response.statusText}: ${text.substring(0, 300)}`);
    throw new Error(`Azure OpenAI request failed (${response.status})`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.trim() === "") {
    throw new Error("Azure OpenAI returned an empty response");
  }
  return content;
}
