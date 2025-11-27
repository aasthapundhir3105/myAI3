"use client";

import { cn } from "@/lib/utils";
import { type ComponentProps, memo } from "react";
import { Streamdown, defaultRehypePlugins } from "streamdown";
import { rehypeSingleCharLink } from "@/lib/rehype-single-char-link";

type ResponseProps = ComponentProps<typeof Streamdown>;

// Remove any fenced ```json ... ``` blocks from the text
const stripJsonBlocks = (text: string): string => {
  if (!text) return text;
  // gi = global + case-insensitive
  return text.replace(/```json[\s\S]*?```/gi, "").trim();
};

export const Response = memo(
  ({ className, children, ...props }: ResponseProps) => {
    // Normalise children into a single string
    let rawText = "";

    if (typeof children === "string") {
      rawText = children;
    } else if (Array.isArray(children)) {
      rawText = children.join("");
    } else if (children != null) {
      rawText = String(children);
    }

    const cleanedText = stripJsonBlocks(rawText);

    // If everything was just JSON and got stripped, render nothing gracefully
    if (!cleanedText) {
      return null;
    }

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
