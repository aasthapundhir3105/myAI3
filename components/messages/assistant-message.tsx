import { UIMessage, ToolCallPart, ToolResultPart } from "ai";
import { Response } from "@/components/ai-elements/response";
import { ReasoningPart } from "./reasoning-part";
import { ToolCall, ToolResult } from "./tool-call";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AssistantMessage({
  message,
  status,
  isLastMessage,
  durations,
  onDurationChange,
}: {
  message: UIMessage;
  status?: string;
  isLastMessage?: boolean;
  durations?: Record<string, number>;
  onDurationChange?: (key: string, duration: number) => void;
}) {
  return (
    <div className="w-full flex justify-start">
      <div className="flex max-w-3xl items-start gap-3">
        {/* Ingrid avatar on the left */}
        <Avatar className="h-8 w-8 border border-green-200 shadow-sm bg-white">
          <AvatarImage src="/icon.png" alt="Ingrid – The Ingredient Fairy" />
          <AvatarFallback className="bg-green-100 text-green-700 text-xs font-bold">
            I
          </AvatarFallback>
        </Avatar>

        {/* Assistant message bubble */}
        <div className="text-sm flex flex-col gap-4 rounded-2xl bg-white/90 border border-green-100 px-4 py-3 shadow-sm">
          {message.parts.map((part, i) => {
            const isStreaming =
              status === "streaming" &&
              isLastMessage &&
              i === message.parts.length - 1;
            const durationKey = `${message.id}-${i}`;
            const duration = durations?.[durationKey];

            if (part.type === "text") {
              return (
                <Response key={`${message.id}-${i}`}>{part.text}</Response>
              );
            } else if (part.type === "reasoning") {
              return (
                <ReasoningPart
                  key={`${message.id}-${i}`}
                  part={part}
                  isStreaming={isStreaming}
                  duration={duration}
                  onDurationChange={
                    onDurationChange
                      ? (d) => onDurationChange(durationKey, d)
                      : undefined
                  }
                />
              );
            } else if (
              part.type.startsWith("tool-") ||
              part.type === "dynamic-tool"
            ) {
              if ("state" in part && part.state === "output-available") {
                return (
                  <ToolResult
                    key={`${message.id}-${i}`}
                    part={part as unknown as ToolResultPart}
                  />
                );
              } else {
                return (
                  <ToolCall
                    key={`${message.id}-${i}`}
                    part={part as unknown as ToolCallPart}
                  />
                );
              }
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
}
