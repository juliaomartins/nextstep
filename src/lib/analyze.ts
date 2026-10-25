import "server-only";

import type { AIMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { AnalysisSchema, type AnalysisOutput } from "./schemas";
import { languageName, type LanguageCode } from "./languages";
import { languageRule, SYSTEM_PROMPT } from "./prompt";

// The model every recorded run used (see devpost/checklist.md > Revisions).
const DEFAULT_MODEL = "gpt-4o-mini";

const prompt = ChatPromptTemplate.fromMessages([
  ["system", SYSTEM_PROMPT],
  // The language is repeated after the document: a long English document otherwise pulls titles back to English.
  ["human", "<document>\n{document}\n</document>\n\nWrite the summary, titles, and whyItMatters in {language_name}; copy quotes exactly."],
]);

/** One LangChain chain: prompt → OpenAI with a strict structured-output schema. */
export async function analyzeDocument(text: string, language: LanguageCode): Promise<AnalysisOutput> {
  const modelName = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  // temperature 0: the most literal, repeatable output, which keeps quotes verbatim (spec.md > Analysis Chain).
  // Note: reasoning models that reject a temperature setting are not supported by this configuration.
  const model = new ChatOpenAI({ model: modelName, temperature: 0, timeout: 45_000, maxRetries: 1 });

  const chain = prompt.pipe(
    model.withStructuredOutput(AnalysisSchema, { name: "document_analysis", strict: true, includeRaw: true }),
  );
  const { raw, parsed } = await chain.invoke({
    document: text,
    language_rule: languageRule(language),
    language_name: languageName(language),
  });

  // Proof of each real OpenAI call: the model OpenAI says it served (not just our setting), its response id,
  // and the tokens it billed. Counts and ids only, never the document.
  const message = raw as AIMessage;
  const usage = message.usage_metadata;
  const served = (message.response_metadata?.model_name as string | undefined) ?? "unknown";
  console.info(
    `[analyze] requested ${modelName} (${language}) · OpenAI served ${served} · response ${message.id ?? "unknown"} · tokens ` +
      (usage ? `${usage.input_tokens} in + ${usage.output_tokens} out = ${usage.total_tokens}` : "not reported"),
  );

  // Belt and braces: the structured-output parser already validates, but the UI must never see a malformed shape.
  return AnalysisSchema.parse(parsed);
}
