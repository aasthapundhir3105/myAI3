"use client";

import { cn } from "@/lib/utils";
import { type ComponentProps, memo, ReactNode } from "react";
import { Streamdown, defaultRehypePlugins } from "streamdown";
import { rehypeSingleCharLink } from "@/lib/rehype-single-char-link";

type ResponseProps = ComponentProps<typeof Streamdown>;

/** Convert any ReactNode into a plain string */
function reactNodeToString(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") {
    return "";
  }
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) {
    return node.map(reactNodeToString).join("");
  }
  // For other React elements, fall back to string conversion
  try {
    return String(node);
  } catch {
    return "";
  }
}

/** Remove any ```json ... ``` fenced blocks */
const stripJsonBlocks = (text: string): string => {
  return text.replace(/```json[\s\S]*?```/gi, "").trim();
};

export const Response = memo(
  ({ className, children, ...props }: ResponseProps) => {
    // Convert entire children tree into one string
    const rawText = reactNodeToString(children);

    const cleanedText = stripJsonBlocks(rawText);

    if (!cleanedText) return null;

    return (
      <Streamdown
        className={cn(
          "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
          className
        )}
        rehypePlugins={[
          defaultRehypePlugins.raw,
          defaultRehypePlugins.katex,
          rehypeSingleCharLink,
        ]}
        {...props}
      >
        {cleanedText}
      </Streamdown>
    );
  },
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = "Response";
