import { analyzeDocument } from "@/lib/analyze";
import { validateAnalyzeInput, type ApiError, type ApiErrorCode } from "@/lib/schemas";
import { verifyEvidence } from "@/lib/verify-evidence";

const MESSAGES: Record<ApiErrorCode, string> = {
  too_short: "This looks too short to analyze. Paste the full document.",
  too_long: "This document is too long. Paste the section with the requirements and deadlines.",
  invalid_request: "Something went wrong sending your document. Please try again.",
  analysis_failed: "We couldn't analyze this document right now. Please try again.",
};

function errorResponse(code: ApiErrorCode, status: number) {
  return Response.json({ error: { code, message: MESSAGES[code] } } satisfies ApiError, { status });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("invalid_request", 400);
  }

  const input = validateAnalyzeInput(body);
  if (!input.ok) return errorResponse(input.code, 400);

  try {
    const output = await analyzeDocument(input.text, input.language);
    return Response.json({ ...verifyEvidence(input.text, output), language: input.language });
  } catch (error) {
    // Log the reason, never the document.
    console.error("[analyze] failed:", error instanceof Error ? `${error.name}: ${error.message}` : error);
    return errorResponse("analysis_failed", 502);
  }
}
