"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useChat } from "@ai-sdk/react";
import { ArrowUp, Loader2, Plus, Square, Sparkles, Shield, Wand2 } from "lucide-react";
import { MessageWall } from "@/components/messages/message-wall";
import { ChatHeader } from "@/app/parts/chat-header";
import { ChatHeaderBlock } from "@/app/parts/chat-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UIMessage } from "ai";
import { useEffect, useState, useRef } from "react";
import { AI_NAME, CLEAR_CHAT_TEXT, WELCOME_MESSAGE } from "@/config";
import Image from "next/image";
import Link from "next/link";
import { IngredientSafetyChart } from '@/components/ui/safetychart';

const formSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty.")
    .max(2000, "Message must be at most 2000 characters."),
});

const STORAGE_KEY = 'chat-messages';

type StorageData = {
  messages: UIMessage[];
  durations: Record<string, number>;
};

const loadMessagesFromStorage = (): { messages: UIMessage[]; durations: Record<string, number> } => {
  if (typeof window === 'undefined') return { messages: [], durations: {} };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { messages: [], durations: {} };

    const parsed = JSON.parse(stored);
    return {
      messages: parsed.messages || [],
      durations: parsed.durations || {},
    };
  } catch (error) {
    console.error('Failed to load messages from localStorage:', error);
    return { messages: [], durations: {} };
  }
};

const saveMessagesToStorage = (messages: UIMessage[], durations: Record<string, number>) => {
  if (typeof window === 'undefined') return;
  try {
    const data: StorageData = { messages, durations };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save messages to localStorage:', error);
  }
};

export default function Chat() {
  const [isClient, setIsClient] = useState(false);
  const [durations, setDurations] = useState<Record<string, number>>({});
  const welcomeMessageShownRef = useRef<boolean>(false);

  const stored = typeof window !== 'undefined' ? loadMessagesFromStorage() : { messages: [], durations: {} };
  const [initialMessages] = useState<UIMessage[]>(stored.messages);

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    messages: initialMessages,
  });

  // Helper function to extract JSON from AI response
  const extractSafetyData = (message: UIMessage) => {
    if (message.role !== 'assistant') return null;
    
    // Look for JSON in text parts
    const textParts = message.parts
      .filter(part => part.type === 'text')
      .map(part => 'text' in part ? part.text : '')
      .join('');

    // Try to find JSON pattern
    const jsonMatch = textParts.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        const jsonData = JSON.parse(jsonMatch[1]);
        // Validate the expected structure
        if (jsonData.overall_score !== undefined && jsonData.ingredient_scores) {
          return jsonData;
        }
      } catch (error) {
        console.error('Failed to parse JSON from AI response:', error);
      }
    }
    
    return null;
  };

  useEffect(() => {
    setIsClient(true);
    setDurations(stored.durations);
    setMessages(stored.messages);
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
    if (isClient && initialMessages.length === 0 && !welcomeMessageShownRef.current) {
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
    toast.success("Magic cleared! ✨");
  }

  // Realistic Magical example ingredient lists
const exampleIngredients = [
  {
    name: "🍿 Breakfast Cereal",
    ingredients: "Whole Grain Oats, Sugar, Corn Starch, Honey, Brown Sugar Syrup, Salt, Tripotassium Phosphate, Canola Oil, Natural Flavor, Annatto Extract (color)",
    color: "from-amber-100 to-orange-100 border-amber-200 text-amber-700"
  },
  {
    name: "🧃 Fruit Juice Drink", 
    ingredients: "Water, Sugar, Concentrated Apple Juice (10%), Citric Acid, Ascorbic Acid (Vitamin C), Natural Flavors, Sodium Citrate, Maltodextrin, Acesulfame K, Sucralose, E102 (Tartrazine), E110 (Sunset Yellow)",
    color: "from-orange-100 to-red-100 border-orange-200 text-orange-700"
  },
  {
    name: "🍜 Instant Noodles",
    ingredients: "Wheat Flour, Palm Oil, Salt, Sugar, Monosodium Glutamate (E621), Guar Gum, Sodium Carbonate, Potassium Carbonate, Sodium Tripolyphosphate, Turmeric Extract, Soy Lecithin",
    color: "from-yellow-100 to-amber-100 border-yellow-200 text-yellow-700"
  }
];

  const handleExampleClick = (ingredients: string) => {
    form.setValue("message", ingredients);
  };

  return (
    <div className="flex h-screen items-center justify-center font-sans bg-gradient-to-br from-green-50 via-blue-50 to-cyan-50">
      <main className="w-full bg-transparent h-screen relative">
        {/* Magical Header with Fairy Gradient */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-white/90 via-white/70 to-transparent backdrop-blur-sm border-b border-green-100 overflow-visible pb-16">
          <div className="relative overflow-visible">
            <ChatHeader>
              <ChatHeaderBlock />
              <ChatHeaderBlock className="justify-center items-center">
                <Avatar className="size-10 ring-2 ring-white shadow-lg bg-gradient-to-br from-green-400 to-blue-400">
                  <AvatarImage src="/logo.png" />
                  <AvatarFallback className="bg-gradient-to-br from-green-400 to-blue-400 text-white">
                    <Wand2 className="size-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-3 ml-3">
                  <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-2xl shadow-sm border border-green-100">
                    <Wand2 className="size-5 text-green-600" />
                    <p className="tracking-tight text-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                      {AI_NAME}
                    </p>
                    <Sparkles className="size-4 text-yellow-400" />
                  </div>
                </div>
              </ChatHeaderBlock>
              <ChatHeaderBlock className="justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer border-pink-200 text-pink-600 hover:bg-pink-50 hover:border-pink-300 shadow-sm font-medium"
                  onClick={clearChat}
                >
                  <Plus className="size-4" />
                  {CLEAR_CHAT_TEXT}
                </Button>
              </ChatHeaderBlock>
            </ChatHeader>
          </div>
        </div>
        
        {/* Main Chat Area with Magical Background */}
        <div className="h-screen overflow-y-auto px-5 py-4 w-full pt-[100px] pb-[180px]">
          <div className="flex flex-col items-center justify-end min-h-full">
            {/* Magical Example Cards */}
            {isClient && messages.length <= 1 && (
              <div className="w-full max-w-4xl mb-8 animate-in fade-in duration-700">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                    Wave My Wand Over Your Ingredients! 🧚♂️
                  </h2>
                  <p className="text-green-600/70 text-sm font-medium">
                    Try a magical example or share your own ingredient list
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {exampleIngredients.map((example, index) => (
                    <button
                      key={index}
                      className={`p-4 rounded-2xl border-2 bg-gradient-to-br ${example.color} shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 text-left group`}
                      onClick={() => handleExampleClick(example.ingredients)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-semibold text-sm">{example.name}</span>
                        <ArrowUp className="size-4 opacity-0 group-hover:opacity-100 transition-opacity rotate-45" />
                      </div>
                      <p className="text-xs opacity-70 leading-relaxed">{example.ingredients}</p>
                    </button>
                  ))}
                </div>
                
                {/* Magical Divider */}
                <div className="flex items-center my-8">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-green-200 to-transparent"></div>
                  <span className="px-4 text-green-400 text-sm font-medium">or share your own magic</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-green-200 to-transparent"></div>
                </div>
              </div>
            )}
            
            {/* Messages Area with Safety Charts */}
            {isClient ? (
              <>
                <MessageWall 
                  messages={messages} 
                  status={status} 
                  durations={durations} 
                  onDurationChange={handleDurationChange} 
                />
                
                {/* Render safety charts for messages that have JSON data */}
                {messages.map((message) => {
                  const safetyData = extractSafetyData(message);
                  if (safetyData) {
                    return (
                      <div key={`chart-${message.id}`} className="w-full max-w-3xl mt-6">
                        <IngredientSafetyChart data={safetyData} />
                      </div>
                    );
                  }
                  return null;
                }).filter(Boolean)}
                
                {status === "submitted" && (
                  <div className="flex justify-start max-w-3xl w-full mt-4">
                    <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full border border-green-100 shadow-sm">
                      <Loader2 className="size-4 animate-spin text-green-600" />
                      <span className="text-sm text-green-700 font-medium">Waving my magic wand...</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex justify-center max-w-2xl w-full">
                <Loader2 className="size-4 animate-spin text-green-600" />
              </div>
            )}
          </div>
        </div>

        {/* Magical Input Area */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-white/90 via-white/70 to-transparent backdrop-blur-sm border-t border-green-100 overflow-visible pt-8">
          <div className="w-full px-5 pb-1 items-center flex justify-center relative overflow-visible">
            <div className="max-w-3xl w-full">
              <form id="chat-form" onSubmit={form.handleSubmit(onSubmit)}>
                <FieldGroup>
                  <Controller
                    name="message"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="chat-form-message" className="sr-only">
                          Message
                        </FieldLabel>
                        <div className="relative h-13 group">
                          <Input
                            {...field}
                            id="chat-form-message"
                            className="h-16 pr-16 pl-6 bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-green-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 shadow-lg transition-all duration-300 text-base placeholder-green-400/60"
                            placeholder="✨ Share your ingredient list here... (e.g., E102, Maltodextrin, Sodium Benzoate)"
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
                          {(status == "ready" || status == "error") && (
                            <Button
                              className="absolute right-2 top-2 rounded-full bg-gradient-to-br from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                              type="submit"
                              disabled={!field.value.trim()}
                              size="icon"
                            >
                              <ArrowUp className="size-5" />
                            </Button>
                          )}
                          {(status == "streaming" || status == "submitted") && (
                            <Button
                              className="absolute right-2 top-2 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                              size="icon"
                              onClick={() => {
                                stop();
                              }}
                            >
                              <Square className="size-4" />
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
          
          {/* Magical Footer */}
          <div className="w-full px-5 py-4 items-center flex justify-center">
            <div className="max-w-3xl w-full">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-4 text-green-500/70">
                  <span>© {new Date().getFullYear()} Ingrid - The Ingredient Fairy</span>
                  <Link href="/terms" className="hover:text-green-600 transition-colors font-medium">Terms</Link>
                </div>
                <div className="flex items-center gap-2 text-blue-500/70">
                  <Wand2 className="size-3" />
                  <span>Magical Food Safety Help</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
