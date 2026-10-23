import "server-only";

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { AnalysisSchema, type AnalysisOutput } from "./schemas";
import { SYSTEM_PROMPT } from "./prompt";

const DEFAULT_MODEL = "gpt-4.1-mini";

const prompt = ChatPromptTemplate.fromMessages([
  ["system", SYSTEM_PROMPT],
  ["human", "<document>\n{document}\n</document>"],
]);

/** One LangChain chain: prompt → OpenAI with a strict structured-output schema. */
export async function analyzeDocument(text: string): Promise<AnalysisOutput> {
  const model = new ChatOpenAI({
    model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
    timeout: 45_000,
    maxRetries: 1,
  });

  const chain = prompt.pipe(model.withStructuredOutput(AnalysisSchema, { name: "document_analysis", strict: true }));
  const output = await chain.invoke({ document: text });

  // Belt and braces: the structured-output parser already validates, but the UI must never see a malformed shape.
  return AnalysisSchema.parse(output);
}
