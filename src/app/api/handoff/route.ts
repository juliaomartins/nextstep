import { z } from "zod";
import { AnalysisResultSchema } from "@/lib/schemas";
import { isSealed } from "@/lib/seal";

const RequestSchema = z.object({ result: AnalysisResultSchema, seal: z.string() });

/** Confirms that a checklist opened from a /results link was made, unchanged, by this NextStep server. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ valid: false }, { status: 400 });
  }
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ valid: false }, { status: 400 });
  return Response.json({ valid: isSealed(parsed.data.result, parsed.data.seal) });
}
