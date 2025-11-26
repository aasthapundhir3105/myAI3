"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useChat } from "@ai-sdk/react";
import { ArrowUp, Loader2, Plus, Square } from "lucide-react";
import { MessageWall } from "@/components/messages/message-wall";
import { ChatHeader } from "@/app/parts/chat-header";
import { ChatHeaderBlock } from "@/app/parts/chat-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UIMessage } from "ai";
import { useEffect, useState, useRef } from "react";
import {
  AI_NAME,
  CLEAR_CHAT_TEXT,
  OWNER_NAME,
  WELCOME_MESSAGE,
} from "@/config";
import Image from "next/image";
import Link from "next/link";

const formSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty.")
    .max(2000, "Message must be at most 2000 characters."),
});

const STORAGE_KEY = "chat-messages";

type StorageData = {
  messages: UIMessage[];
  durations: Record<string, number>;
};

const loadMessagesFromStorage = (): {
  messages: UIMessage[];
  durations: Record<string, number>;
} => {
  if (typeof window === "undefined") return { messages: [], durations: {} };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { messages: [], durations: {} };

    const parsed = JSON.parse(stored);
    return {
      messages: parsed.messages || [],
      durations: parsed.durations || {},
    };
  } catch (error) {
    console.error("Failed to load messages from localStorage:", error);
    return { messages: [], durations: {} };
  }
};

const saveMessagesToStorage = (
  messages: UIMessage[],
  durations: Record<string, number>
) => {
  if (typeof window === "undefined") return;
  try {
    const data: StorageData = { messages, durations };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save messages to localStorage:", error);
  }
};

export default function Chat() {
  const [isClient, setIsClient] = useState(false);
  const [durations, setDurations] = useState<Record<string, number>>({});
  const welcomeMessageShownRef = useRef<boolean>(false);

  const stored =
    typeof window !== "undefined"
      ? loadMessagesFromStorage()
      : { messages: [], durations: {} };
  const [initialMessages] = useState<UIMessage[]>(stored.messages);

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    messages: initialMessages,
  });

  useEffect(() => {
    setIsClient(true);
    setDurations(stored.durations);
    setMessages(stored.messages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isClient) {
      saveMessagesToStorage(messages, durations);
    }
  }, [durations, messages, isClient]);

  const handleDurationChange = (key: string, duration: number) => {
    setDurations((prevDurations) => {
      const newDurations = { ...prevDurations };
      newDurations[key] = duration;
      return newDurations;
    });
  };

  useEffect(() => {
    if (
      isClient &&
      initialMessages.length === 0 &&
      !welcomeMessageShownRef.current
    ) {
      const welcomeMessage: UIMessage = {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        parts: [
          {
            type: "text",
            text: WELCOME_MESSAGE,
          },
        ],
      };
      setMessages([welcomeMessage]);
      saveMessagesToStorage([welcomeMessage], {});
      welcomeMessageShownRef.current = true;
    }
  }, [isClient, initialMessages.length, setMessages]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    sendMessage({ text: data.message });
    form.reset();
  }

  function clearChat() {
    const newMessages: UIMessage[] = [];
    const newDurations = {};
    setMessages(newMessages);
    setDurations(newDurations);
    saveMessagesToStorage(newMessages, newDurations);
    toast.success("Chat cleared");
  }

  return (
    <div className="flex h-screen flex-col bg-[#CFF3BF]">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <ChatHeader>
          {/* left empty */}
          <ChatHeaderBlock />
          {/* center: avatar + title */}
          <ChatHeaderBlock className="justify-center items-center gap-2">
            <Avatar className="size-10 ring-2 ring-[#46A66333]">
              <AvatarImage src="/logo.png" />
              <AvatarFallback>
                <Image src="/logo.png" alt="Logo" width={40} height={40} />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start">
              <p className="text-sm font-semibold text-slate-900">
                Nutrition Assistant
              </p>
              <span className="h-2 w-2 rounded-full bg-[#2ECC40] mt-1" />
            </div>
          </ChatHeaderBlock>
          {/* right: new chat button */}
          <ChatHeaderBlock className="justify-end">
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer rounded-full border-[#46A66366] bg-[#E7F8E1] hover:bg-[#D9F2D3]"
              onClick={clearChat}
            >
              <Plus className="size-4 mr-1" />
              New Chat
            </Button>
          </ChatHeaderBlock>
        </ChatHeader>
      </header>

      {/* MAIN CHAT AREA */}
      <main className="flex-1 pt-[80px] pb-[120px] overflow-y-auto">
        <div className="flex flex-col items-center mt-6">
          <div className="w-full max-w-4xl px-6">
            {isClient ? (
              <>
                <MessageWall
                  messages={messages}
                  status={status}
                  durations={durations}
                  onDurationChange={handleDurationChange}
                />
                {status === "submitted" && (
                  <div className="flex justify-start w-full mt-2">
                    <Loader2 className="size-4 animate-spin text-slate-500" />
                  </div>
                )}
              </>
            ) : (
              <div className="flex justify-center w-full">
                <Loader2 className="size-4 animate-spin text-slate-500" />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* INPUT + FOOTER */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white">
        <div className="w-full py-3">
          <div className="max-w-4xl mx-auto px-4">
            {/* IMAGE UPLOAD STRIP */}
            <div className="flex justify-start mb-2">
              <label className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-full bg-[#E8F7F0] border border-dashed border-[#9ED7B8] cursor-pointer hover:border-[#46A663] hover:bg-[#DCF2E6] transition">
                <span>📸 Upload / click ingredient label</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const formData = new FormData();
                    formData.append("image", file);

                    setMessages((prev) => [
                      ...prev,
                      {
                        id: `temp-${Date.now()}`,
                        role: "assistant",
                        parts: [
                          {
                            type: "text",
                            text: "📸 Analyzing image…",
                          },
                        ],
                      },
                    ]);

                    try {
                      const res = await fetch("/api/chat", {
                        method: "POST",
                        body: formData,
                      });

                      const data = await res.json();

                      setMessages((prev) => [
                        ...prev,
                        {
                          id: `ans-${Date.now()}`,
                          role: "assistant",
                          parts: [
                            {
                              type: "text",
                              text:
                                data.response ??
                                "I could not analyze this image properly.",
                            },
                          ],
                        },
                      ]);
                    } catch (err) {
                      console.error(err);
                      setMessages((prev) => [
                        ...prev,
                        {
                          id: `err-${Date.now()}`,
                          role: "assistant",
                          parts: [
                            {
                              type: "text",
                              text:
                                "❗Something went wrong while analyzing the image. Please try again.",
                            },
                          ],
                        },
                      ]);
                    }
                  }}
                />
              </label>
            </div>

            {/* TEXT INPUT PILL */}
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup>
                <Controller
                  name="message"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel
                        htmlFor="chat-form-message"
                        className="sr-only"
                      >
                        Message
                      </FieldLabel>
                      <div className="relative">
                        <Input
                          {...field}
                          id="chat-form-message"
                          className="h-12 w-full rounded-full bg-[#F7FBF6] border border-[#D4EBD3] shadow-sm pl-5 pr-14 text-sm"
                          placeholder="Type your message here..."
                          disabled={status === "streaming"}
                          aria-invalid={fieldState.invalid}
                          autoComplete="off"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              form.handleSubmit(onSubmit)();
                            }
                          }}
                        />
                        {(status === "ready" || status === "error") && (
                          <Button
                            className="absolute right-2 top-1.5 rounded-full h-9 w-9 bg-[#46A663] hover:bg-[#37834E]"
                            type="submit"
                            disabled={!field.value.trim()}
                            size="icon"
                          >
                            <ArrowUp className="size-4 text-white" />
                          </Button>
                        )}
                        {(status === "streaming" || status === "submitted") &&
                          (
                            <Button
                              className="absolute right-2 top-1.5 rounded-full h-9 w-9 bg-slate-200 hover:bg-slate-300"
                              size="icon"
                              type="button"
                              onClick={() => stop()}
                            >
                              <Square className="size-4 text-slate-700" />
                            </Button>
                          )}
                      </div>
                    </Field>
                  )}
                />
              </FieldGroup>
            </form>
          </div>
        </div>

        {/* tiny footer line */}
        <div className="border-t border-[#E5EAE4] text-[11px] text-slate-500 py-2 px-4 flex items-center justify-between">
          <span>Terms of Service</span>
          <span>
            Nutrition AI Assistant. Experimental tool, not medical advice.
          </span>
          <span>powered by ringel.AI</span>
        </div>
      </footer>
    </div>
  );
}
