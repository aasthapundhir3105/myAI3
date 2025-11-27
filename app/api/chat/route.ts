import {
  streamText,
  UIMessage,
  convertToModelMessages,
  stepCountIs,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai";
import { MODEL } from "@/config";
import { SYSTEM_PROMPT } from "@/prompts";
import { isContentFlagged } from "@/lib/moderation";
import { webSearch } from "./tools/web-search";
import { vectorDatabaseSearch } from "./tools/search-vector-database";
import {
  checkUserSafetyIntent,
  buildDynamicSystemPrompt,
  SafetyCheckResult,
} from "@/lib/safety";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const latestUserMessage = messages.filter((msg) => msg.role === "user").pop();

  let safetyResult: SafetyCheckResult | null = null;

  if (latestUserMessage) {
    const textParts = latestUserMessage.parts
      .filter((part) => part.type === "text")
      .map((part) => ("text" in part ? part.text : ""))
      .join("");

    if (textParts) {
      // 1️⃣ Existing global moderation (keep this!)
      const moderationResult = await isContentFlagged(textParts);

      if (moderationResult.flagged) {
        const stream = createUIMessageStream({
          execute({ writer }) {
            const textId = "moderation-denial-text";

            writer.write({
              type: "start",
            });

            writer.write({
              type: "text-start",
              id: textId,
            });

            writer.write({
              type: "text-delta",
              id: textId,
              delta:
                moderationResult.denialMessage ||
                "Your message violates our guidelines. I can't answer that.",
            });

            writer.write({
              type: "text-end",
              id: textId,
            });

            writer.write({
              type: "finish",
            });
          },
        });

        return createUIMessageStreamResponse({ stream });
      }

      // 2️⃣ Domain-specific safety / guardrails (Ingrid-specific)
      safetyResult = checkUserSafetyIntent(textParts);

      // Hard block for very risky things like dosage/anaphylaxis
      if (safetyResult.shouldBlock && safetyResult.messageForUser) {
        const stream = createUIMessageStream({
          execute({ writer }) {
            const textId = "safety-denial-text";

            writer.write({ type: "start" });

            writer.write({
              type: "text-start",
              id: textId,
            });

            writer.write({
              type: "text-delta",
              id: textId,
              delta: safetyResult!.messageForUser!,
            });

            writer.write({
              type: "text-end",
              id: textId,
            });

            writer.write({ type: "finish" });
          },
        });

        return createUIMessageStreamResponse({ stream });
      }
    }
  }

  // 3️⃣ Build system prompt with safety instructions baked in
  const dynamicSystemPrompt = buildDynamicSystemPrompt(
    SYSTEM_PROMPT,
    safetyResult
  );

  const result = streamText({
    model: MODEL,
    system: dynamicSystemPrompt,
    messages: convertToModelMessages(messages),
    tools: {
      webSearch,
      vectorDatabaseSearch,
    },
    stopWhen: stepCountIs(10),
    providerOptions: {
      openai: {
        reasoningSummary: "auto",
        reasoningEffort: "low",
        parallelToolCalls: false,
      },
    },
  });

  return result.toUIMessageStreamResponse({
    sendReasoning: true,
  });
}
