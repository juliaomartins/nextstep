import { z } from "zod";
import { AnalysisResultSchema, type AnalysisResult } from "./schemas";

/**
 * How the browser extension hands a finished analysis to the website's /results page.
 * The data travels in the URL fragment (#data=…), which browsers never send to any server,
 * and the page validates it with the same schema the API uses, then has the server confirm its seal,
 * before showing anything.
 */
const HandoffSchema = z.object({
  version: z.literal(1),
  textHash: z.string().regex(/^[0-9a-f]{64}$/),
  result: AnalysisResultSchema,
  // The server's seal over the result (lib/seal.ts); /results asks the server to confirm it before showing anything.
  seal: z.string().regex(/^[0-9a-f]{64}$/),
  source: z.object({ title: z.string(), url: z.string() }).nullable(),
});

export type Handoff = {
  version: 1;
  textHash: string;
  result: AnalysisResult;
  seal: string;
  source: { title: string; url: string } | null;
};

const FRAGMENT_KEY = "data";

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array {
  const base64 = text.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
}

export function encodeHandoff(handoff: Handoff): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(handoff)));
}

/** Reads `#data=…`; returns null for anything missing, garbled, or not shaped like a real result. */
export function decodeHandoff(fragment: string): Handoff | null {
  const params = new URLSearchParams(fragment.replace(/^#/, ""));
  const data = params.get(FRAGMENT_KEY);
  if (!data || !/^[A-Za-z0-9_-]+$/.test(data)) return null;
  try {
    const json: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(fromBase64Url(data)));
    const parsed = HandoffSchema.safeParse(json);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function resultsUrl(base: string, handoff: Handoff): string {
  const url = new URL("/results", base);
  url.hash = `${FRAGMENT_KEY}=${encodeHandoff(handoff)}`;
  return url.toString();
}
