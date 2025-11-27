import { UIMessage } from "ai";
import { Response } from "@/components/ai-elements/response";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function UserMessage({ message }: { message: UIMessage }) {
  return (
    <div className="w-full flex justify-end">
      <div className="flex max-w-3xl items-end gap-2 flex-row-reverse">
        {/* User avatar on the right */}
        <Avatar className="h-8 w-8 rounded-full border border-blue-300 shadow-sm bg-white">
          <AvatarFallback className="h-8 w-8 aspect-square rounded-full bg-blue-600 text-white text-[10px] font-semibold flex items-center justify-center">
            You
          </AvatarFallback>
        </Avatar>

        {/* User message bubble */}
        <div className="max-w-lg w-fit px-4 py-3 rounded-2xl bg-blue-50 border border-blue-100 shadow-sm whitespace-pre-wrap">
          <div className="flex flex-col gap-2 text-sm">
            {message.parts.map((part, i) => {
              const anyPart = part as any;

              if (part.type === "text") {
                return (
                  <Response key={`${message.id}-text-${i}`}>
                    {part.text}
                  </Response>
                );
              }

              // 🔮 Future-proof: if messages ever include image parts, show them nicely
              if (
                anyPart.type === "image" &&
                (anyPart.url || anyPart.imageUrl || anyPart.data)
              ) {
                const src =
                  anyPart.url || anyPart.imageUrl || anyPart.data || "";

                if (!src) return null;

                return (
                  <div
                    key={`${message.id}-image-${i}`}
                    className="mt-1 rounded-xl overflow-hidden border border-blue-100 bg-white"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt="User uploaded"
                      className="max-h-64 rounded-xl object-contain"
                    />
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
