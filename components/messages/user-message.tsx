import { UIMessage } from "ai";
import { Response } from "@/components/ai-elements/response";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function UserMessage({ message }: { message: UIMessage }) {
  return (
    <div className="w-full flex justify-end">
      <div className="flex max-w-3xl items-start gap-3 flex-row-reverse">
        {/* User avatar on the right */}
        <Avatar className="h-8 w-8 shadow-sm">
          <AvatarFallback className="bg-blue-600 text-white text-[10px] font-semibold">
            You
          </AvatarFallback>
        </Avatar>

        {/* User message bubble */}
        <div className="max-w-lg w-fit px-4 py-3 rounded-2xl bg-blue-50 border border-blue-100 shadow-sm whitespace-pre-wrap">
          <div className="text-sm">
            {message.parts.map((part, i) => {
              switch (part.type) {
                case "text":
                  return (
                    <Response key={`${message.id}-${i}`}>{part.text}</Response>
                  );
                default:
                  return null;
              }
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
