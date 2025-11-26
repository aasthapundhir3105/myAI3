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
import { AI_NAME, CLEAR_CHAT_TEXT, OWNER_NAME, WELCOME_MESSAGE } from "@/config";
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

const loadMessagesFromStorage = (): StorageData => {
  if (typeof window === "undefined") return { messages: [], durations: {} };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { messages: [], durations: {} };
    return JSON.parse(stored) as StorageData;
  } catch (err) {
    console.error("Failed to load messages from localStorage:", err);
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
  } catch (err) {
    console.error("Failed to save messages to localStorage:", err);
  }
};

export default function Chat() {
  const [isClient, setIsClient] = useState(false);
  const [durations, setDurations] = useState<Record<string, number>>({});
  const welcomeMessageShownRef = useRef(false);

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
  }, [messages, durations, isClient]);

  // welcome message
  useEffect(() => {
    if (!isClient) return;
    if (initialMessages.length !== 0) return;
    if (welcomeMessageShownRef.current) return;

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
    const newDurations: Record<string, number> = {};
    setMessages(newMessages);
    setDurations(newDurations);
    saveMessagesToStorage(newMessages, newDurations);
    toast.success("Chat cleared");
  }

  const handleDurationChange = (key: string, duration: number) => {
    setDurations((prev: Record<string, number>) => ({
      ...prev,
      [key]: duration,
    }));
  };

  return (
    <div className="flex h-screen items-center justify-center font-sans bg-[#F5FAF7]">
      <main className="w-full h-screen relative">
        {/* HEADER */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-[#E0F2EA] pb-3">
          <div className="relative">
            <ChatHeader>
              <ChatHeaderBlock />
              <ChatHeaderBlock className="justify-center items-center gap-2">
                <Avatar className="size-9 ring-2 ring-[#CDEFE0] bg-[#E8F7F0]">
                  <AvatarImage src="/logo.png" />
                  <AvatarFallback className="text-[#1E88E5] font-semibold">
                    AI
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="text-sm font-semibold text-slate-900">
                    Chat with {AI_NAME}
                  </p>
                  <p className="text-xs text-slate-500">
                    FSSAI-powered ingredient & additive safety assistant
                  </p>
                </div>
              </ChatHeaderBlock>
              <ChatHeaderBlock className="justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer border-[#CDEFE0] text-slate-700 hover:bg-[#E8F7F0]"
                  onClick={clearChat}
                >
                  <Plus className="size-4" />
                  {CLEAR_CHAT_TEXT}
                </Button>
              </ChatHeaderBlock>
            </ChatHeader>
          </div>
        </div>

        {/* MESSAGES AREA */}
        <div className="h-screen overflow-y-auto px-5 py-4 w-full pt-[88px] pb-[150px] bg-[#F5FAF7]">
          <div className="flex flex-col items-center justify-end min-h-full">
            <div className="w-full max-w-3xl mx-auto">
              {/* optional top accent bar */}
              <div className="h-2 w-full rounded-t-2xl bg-gradient-to-r from-[#CDEFE0] via-[#1E88E5] to-[#CDEFE0] mb-2" />

              <div className="bg-white rounded-2xl shadow-sm border border-[#E0F2EA] px-4 py-4">
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
                        <Loader2 className="size-4 animate-spin text-slate-400" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex justify-center w-full py-10">
                    <Loader2 className="size-4 animate-spin text-slate-400" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* INPUT AREA */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-[#E0F2EA] pt-3">
          <div className="w-full px-5 pb-2 flex justify-center relative">
            <div className="message-fade-overlay" />
            <div className="max-w-3xl w-full">
              <form id="chat-form" onSubmit={form.handleSubmit(onSubmit)}>
                {/* IMAGE UPLOAD (CAMERA) */}
                <div className="mb-3">
                  <label className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-[#CDEFE0] bg-[#E8F7F0] px-4 py-3 cursor-pointer hover:border-[#1E88E5] hover:bg-[#DBF0E8] transition">
                    <div className="flex flex-col text-xs text-slate-500">
                      <span className="text-[13px] font-medium text-slate-800">
                        📸 Scan ingredient label
                      </span>
                      <span>
                        Upload or click a photo to analyze FSSAI-based safety.
                      </span>
                    </div>
                    <span className="text-[11px] px-3 py-1 rounded-full bg-[#1E88E5] text-white">
                      Choose image
                    </span>
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

                        // Temporary "analyzing" message
                        setMessages((prev) => [
                          ...prev,
                          {
                            id: `temp-${Date.now()}`,
                            role: "assistant",
                            parts: [
                              {
                                type: "text",
                                text: "📸 Analyzing the label image for ingredients and FSSAI safety…",
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
                                  text: data.response ?? "I could not analyze this image properly.",
                                },
                              ],
                            },
                          ]);
                        } catch (error) {
                          console.error("Image analysis error:", error);
                          setMessages((prev) => [
                            ...prev,
                            {
                              id: `err-${Date.now()}`,
                              role: "assistant",
                              parts: [
                                {
                                  type: "text",
                                  text:
                                    "❗Something went wrong while analyzing the image. Please try again with a clearer label photo.",
                                },
                              ],
                            },
                          ]);
                        }
                      }}
                    />
                  </label>
                </div>

                {/* TEXT INPUT */}
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

                        <div className="relative h-13">
                          <Input
                            {...field}
                            id="chat-form-message"
                            className="h-15 pr-15 pl-5 bg-white rounded-full border border-[#D0E8DA] focus-visible:ring-[#1E88E5] focus-visible:border-[#1E88E5]"
                            placeholder="Ask about ingredients, additives, kids’ safety..."
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
                              className="absolute right-3 top-3 rounded-full bg-[#1E88E5] hover:bg-[#1669B5]"
                              type="submit"
                              disabled={!field.value.trim()}
                              size="icon"
                            >
                              <ArrowUp className="size-4 text-white" />
                            </Button>
                          )}

                          {(status === "streaming" ||
                            status === "submitted") && (
                            <Button
                              className="absolute right-2 top-2 rounded-full bg-slate-200 hover:bg-slate-300"
                              size="icon"
                              type="button"
                              onClick={() => {
                                stop();
                              }}
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

          <div className="w-full px-5 py-2 items-center flex justify-center text-[11px] text-slate-400">
            © {new Date().getFullYear()} {OWNER_NAME}&nbsp;
            <Link href="/terms" className="underline">
              Terms of Use
            </Link>
            &nbsp;· Powered by&nbsp;
            <Link href="https://ringel.ai/" className="underline">
              Ringel.AI
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
