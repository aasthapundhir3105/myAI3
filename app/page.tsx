"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useChat } from "@ai-sdk/react";
import {
  ArrowUp,
  Baby,
  Image as ImageIcon,
  Loader2,
  Plus,
  ShieldAlert,
  Sparkles,
  Square,
  Users,
  Wand2,
  X,
  Activity,
  Flame,
  HeartPulse,
} from "lucide-react";
import { MessageWall } from "@/components/messages/message-wall";
import { ChatHeader } from "@/app/parts/chat-header";
import { ChatHeaderBlock } from "@/app/parts/chat-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UIMessage } from "ai";
import {
  useEffect,
  useState,
  useRef,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { AI_NAME, CLEAR_CHAT_TEXT, WELCOME_MESSAGE } from "@/config";
import Link from "next/link";
import { IngredientSafetyChart } from "@/components/ui/safetychart";

const formSchema = z.object({
  // ✅ Allow empty string (we validate against image in onSubmit)
  message: z.string().max(2000, "Message must be at most 2000 characters."),
});

const STORAGE_KEY = "chat-messages";

type StorageData = {
  messages: UIMessage[];
  durations: Record<string, number>;
};

type ModeKey = "general" | "diabetes" | "keto" | "kids" | "pcos" | "pregnancy";

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

// Helper: strip JSON blocks (```json ... ```) from assistant text so they don't show in UI
const stripJsonBlocks = (text: string): string => {
  if (!text) return text;
  return text.replace(/```json[\s\S]*?```/g, "").trim();
};

// Mode-context blocks to prepend to every outgoing message
const getModeContextBlock = (mode: ModeKey): string => {
  switch (mode) {
    case "diabetes":
      return `User mode: DIABETES_FRIENDLY
Focus heavily on sugars, refined carbohydrates, sweeteners and glycemic impact. Clearly highlight when something is unsuitable for blood-sugar control.`;
    case "keto":
      return `User mode: KETO_FRIENDLY
Focus on net carbs, added sugars, starches and keto suitability. Clearly state if the product does NOT fit a low-carb diet.`;
    case "kids":
      return `User mode: KIDS_AND_FAMILY
Give extra caution for children (>1 year). Prioritise colours, sweeteners, preservatives, caffeine, emulsifiers, and overall ultra-processing.`;
    case "pcos":
      return `User mode: PCOS_PCOD
Focus on insulin response, inflammatory additives, processed carbs, trans fats and hormonal balance. Highlight high-sugar ingredients clearly.`;
    case "pregnancy":
      return `User mode: PREGNANCY
Consider common pregnancy cautions: artificial sweeteners, caffeine, colours, emulsifiers, preservatives, microbial risks, and heavy additives. Never claim “100% safe”.`;
    case "general":
    default:
      return `User mode: GENERAL
Give a balanced ingredient-safety view for an average Indian household.`;
  }
};

export default function Chat() {
  const [isClient, setIsClient] = useState(false);
  const [durations, setDurations] = useState<Record<string, number>>({});
  const welcomeMessageShownRef = useRef<boolean>(false);

  // 🌟 Health mode selection
  const [selectedMode, setSelectedMode] = useState<ModeKey>("general");

  // 🌟 Image attachment state (store as FileList to match useChat types)
  const [attachedFiles, setAttachedFiles] = useState<FileList | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stored =
    typeof window !== "undefined"
      ? loadMessagesFromStorage()
      : { messages: [], durations: {} };
  const [initialMessages] = useState<UIMessage[]>(stored.messages);

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    messages: initialMessages,
  });

  // Helper function to extract JSON from AI response for chart
  const extractSafetyData = (message: UIMessage) => {
    if (message.role !== "assistant") return null;

    const textParts = message.parts
      .filter((part) => part.type === "text")
      .map((part) => ("text" in part ? part.text : ""))
      .join("");

    const jsonMatch = textParts.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        const jsonData = JSON.parse(jsonMatch[1]);
        if (
          jsonData.overall_score !== undefined &&
          jsonData.ingredient_scores
        ) {
          return jsonData;
        }
      } catch (error) {
        console.error("Failed to parse JSON from AI response:", error);
      }
    }

    return null;
  };

  // Initialize speech synthesis (kept for future read-aloud use)
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const loadVoices = () => {
        console.log("Fairy voices ready!");
      };

      window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

      if (window.speechSynthesis.getVoices().length > 0) {
        loadVoices();
      }

      return () => {
        window.speechSynthesis.removeEventListener(
          "voiceschanged",
          loadVoices
        );
        window.speechSynthesis.cancel();
      };
    }
  }, []);

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

  // 🌟 Image handlers
  const handleImageButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (photo of the label).");
      return;
    }

    const maxSizeMb = 5;
    if (file.size > maxSizeMb * 1024 * 1024) {
      toast.error(
        `Image is too large. Please upload a file under ${maxSizeMb}MB.`
      );
      return;
    }

    // Clean previous preview
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    const url = URL.createObjectURL(file);
    setAttachedFiles(files); // <-- store FileList
    setImagePreviewUrl(url);
    setImageName(file.name);
  };

  const clearAttachedImage = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setAttachedFiles(null);
    setImagePreviewUrl(null);
    setImageName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  function onSubmit(data: z.infer<typeof formSchema>) {
    const trimmed = data.message.trim();

    // If no text and no image → block
    if (!trimmed && !attachedFiles) {
      toast.error("Please enter a message or upload a label photo.");
      return;
    }

    let finalText = trimmed;

    if (!trimmed && attachedFiles) {
      finalText =
        "I've uploaded a photo of a product label / ingredient list. Please help me understand the ingredient safety based on that image.";
    } else if (trimmed && attachedFiles) {
      finalText = `${trimmed}\n\n(Also, I've uploaded a photo of the product label / ingredient list for context.)`;
    }

    const modeBlock = getModeContextBlock(selectedMode);
    const textWithMode = `${modeBlock}\n\n${finalText}`;

    // ✅ Pass FileList directly; matches `files` type
    sendMessage({
      text: textWithMode,
      files: attachedFiles ?? undefined,
    });

    form.reset();
    clearAttachedImage();
  }

  function clearChat() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const newMessages: UIMessage[] = [];
    const newDurations = {};
    setMessages(newMessages);
    setDurations(newDurations as Record<string, number>);
    saveMessagesToStorage(newMessages, newDurations as Record<string, number>);
    toast.success("Magic cleared! ✨");
  }

  // Realistic Magical example ingredient lists
  const exampleIngredients = [
    {
      name: "🥣 Breakfast Cereal",
      ingredients:
        "Whole Grain Oats, Sugar, Corn Starch, Honey, Brown Sugar Syrup, Salt, Tripotassium Phosphate, Canola Oil, Natural Flavor, Annatto Extract (color)",
      color: "from-amber-100 to-orange-100 border-amber-200 text-amber-700",
    },
    {
      name: "🧃 Fruit Juice Drink",
      ingredients:
        "Water, Sugar, Concentrated Apple Juice (10%), Citric Acid, Ascorbic Acid (Vitamin C), Natural Flavors, Sodium Citrate, Maltodextrin, Acesulfame K, Sucralose, E102 (Tartrazine), E110 (Sunset Yellow)",
      color: "from-orange-100 to-red-100 border-orange-200 text-orange-700",
    },
    {
      name: "🍜 Instant Noodles",
      ingredients:
        "Wheat Flour, Palm Oil, Salt, Sugar, Monosodium Glutamate (E621), Guar Gum, Sodium Carbonate, Potassium Carbonate, Sodium Tripolyphosphate, Turmeric Extract, Soy Lecithin",
      color: "from-yellow-100 to-amber-100 border-yellow-200 text-yellow-700",
    },
  ];

  const handleExampleClick = (ingredients: string) => {
    form.setValue("message", ingredients);
  };

  // Create a cleaned version of messages for display (JSON removed from assistant text)
  const displayMessages: UIMessage[] = messages.map((message) => {
    if (message.role !== "assistant") return message;

    const cleanedParts = message.parts.map((part) => {
      if (part.type === "text" && "text" in part) {
        return {
          ...part,
          text: stripJsonBlocks(part.text ?? ""),
        };
      }
      return part;
    });

    return {
      ...message,
      parts: cleanedParts,
    };
  });

  // Health modes config
  const healthModes: {
    key: ModeKey;
    label: string;
    description: string;
    icon: ReactNode;
  }[] = [
    {
      key: "general",
      label: "General",
      description: "Balanced for the average Indian household.",
      icon: <Sparkles className="w-4 h-4 text-green-600" />,
    },
    {
      key: "diabetes",
      label: "Diabetes-friendly",
      description: "Focus on sugars, refined carbs, and blood-sugar impact.",
      icon: <Activity className="w-4 h-4 text-rose-600" />,
    },
    {
      key: "keto",
      label: "Keto / Low-carb",
      description: "Focus on carbs, sugars, starches, and keto compliance.",
      icon: <Flame className="w-4 h-4 text-amber-600" />,
    },
    {
      key: "kids",
      label: "Kids & Family",
      description:
        "Focus on colours, sweeteners, preservatives, caffeine, gut impact.",
      icon: <Users className="w-4 h-4 text-sky-600" />,
    },
    {
      key: "pcos",
      label: "PCOS / PCOD",
      description:
        "Focus on insulin response, inflammation, hormonal balance, processed carbs.",
      icon: <HeartPulse className="w-4 h-4 text-purple-600" />,
    },
    {
      key: "pregnancy",
      label: "Pregnancy",
      description:
        "Extra caution for additives, caffeine, colours, contaminants; avoid absolutes.",
      icon: <ShieldAlert className="w-4 h-4 text-pink-600" />,
    },
  ];

  return (
    <div className="flex h-screen items-center justify-center font-sans bg-gradient-to-br from-green-50 via-blue-50 to-cyan-50">
      <main className="w-full bg-transparent h-screen relative">
        {/* Magical Header with Fairy Gradient */}
       <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-green-100 overflow-visible py-2">
          <div className="relative overflow-visible">
    <        ChatHeader>
              <ChatHeaderBlock />
              <ChatHeaderBlock className="justify-center items-center">
                {/* Ingrid Icon Avatar */}
                <Avatar className="size-20 ring-2 ring-white shadow-lg bg-white rounded-full overflow-hidden">
                  <AvatarImage src="/icon.png" alt="Ingrid Icon" />
                  <AvatarFallback className="bg-white text-green-600 font-bold">
                    I
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

        {/* Safety disclaimer banner */}
        <div className="fixed top-[72px] left-0 right-0 z-40 flex justify-center px-4">
          <div className="max-w-6xl w-full">
            <div className="mt-1 text-[11px] md:text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-4 py-1 shadow-sm flex items-center gap-2">
              <span className="text-sm">⚠️</span>
              <p className="leading-snug">
                Ingrid shares general ingredient information and is{" "}
                <span className="font-semibold">not</span> a substitute for
                medical or dietary advice. For allergies, pregnancy, children or
                medical conditions, please consult a doctor or qualified
                professional.
              </p>
            </div>
          </div>
        </div>

        {/* Main Chat Area with Magical Background + Health Modes Panel */}
        <div className="h-screen overflow-y-auto px-5 py-4 w-full pt-[100px] pb-[190px]">
          {/* Mobile health modes bar */}
          <div className="md:hidden mb-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-semibold text-green-700 tracking-wide">
                  HEALTH MODES
                </span>
                <span className="text-[10px] text-green-600/80">
                  Tap to change focus
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {healthModes.map((mode) => {
                  const isActive = selectedMode === mode.key;
                  return (
                    <button
                      key={mode.key}
                      type="button"
                      onClick={() => setSelectedMode(mode.key)}
                      className={`flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-[11px] whitespace-nowrap transition-all ${
                        isActive
                          ? "bg-gradient-to-br from-green-50 to-blue-50 border-green-400 shadow-sm"
                          : "bg-white/90 border-green-100 hover:border-green-300"
                      }`}
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-50 border border-green-100">
                        {mode.icon}
                      </span>
                      <span className="font-semibold text-green-900">
                        {mode.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-center min-h-full">
            <div className="flex w-full max-w-6xl gap-6">
              {/* Left: Health Modes (desktop only) */}
              <aside className="hidden md:flex md:w-64 flex-col gap-4 pt-4">
                <div className="rounded-2xl bg-white/80 border border-green-100 shadow-sm px-4 py-3">
                  <h3 className="text-xs font-semibold text-green-700 tracking-wide mb-2">
                    HEALTH MODES
                  </h3>
                  <p className="text-[11px] text-green-600/80 mb-3">
                    Tailor Ingrid&apos;s magic to your needs.
                  </p>
                  <div className="flex flex-col gap-2">
                    {healthModes.map((mode) => {
                      const isActive = selectedMode === mode.key;
                      return (
                        <button
                          key={mode.key}
                          type="button"
                          onClick={() => setSelectedMode(mode.key)}
                          className={`w-full text-left rounded-2xl border px-3 py-2.5 flex items-start gap-2 transition-all text-xs ${
                            isActive
                              ? "bg-gradient-to-br from-green-50 to-blue-50 border-green-400 shadow-md"
                              : "bg-white/80 border-green-100 hover:border-green-300 hover:bg-green-50"
                          }`}
                        >
                          <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-green-50 border border-green-100">
                            {mode.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-[11px] text-green-900">
                                {mode.label}
                              </span>
                              {isActive && (
                                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                              )}
                            </div>
                            <p className="text-[10px] text-green-700/80 leading-snug">
                              {mode.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </aside>

              {/* Right: Chat column */}
              <div className="flex-1 flex flex-col items-center justify-end">
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
                          onClick={() =>
                            handleExampleClick(example.ingredients)
                          }
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className="font-semibold text-sm">
                              <span className="text-xl mr-1">
                                {example.name.split(" ")[0]}
                              </span>
                              {example.name.split(" ").slice(1).join(" ")}
                            </span>
                            <ArrowUp className="size-4 opacity-0 group-hover:opacity-100 transition-opacity rotate-45" />
                          </div>
                          <p className="text-xs opacity-70 leading-relaxed">
                            {example.ingredients}
                          </p>
                        </button>
                      ))}
                    </div>

                    {/* Magical Divider */}
                    <div className="flex items-center my-8">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-green-200 to-transparent"></div>
                      <span className="px-4 text-green-400 text-sm font-medium">
                        or share your own magic
                      </span>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-green-200 to-transparent"></div>
                    </div>
                  </div>
                )}

                {/* Messages Area with Safety Charts */}
                {isClient ? (
                  <>
                    <MessageWall
                      messages={displayMessages}
                      status={status}
                      durations={durations}
                      onDurationChange={handleDurationChange}
                    />

                    {/* Render safety charts for messages that have JSON data */}
                    {messages
                      .map((message) => {
                        const safetyData = extractSafetyData(message);
                        if (safetyData) {
                          return (
                            <div
                              key={`chart-${message.id}`}
                              className="w-full max-w-3xl mt-6"
                            >
                              <IngredientSafetyChart data={safetyData} />
                            </div>
                          );
                        }
                        return null;
                      })
                      .filter(Boolean)}

                    {status === "submitted" && (
                      <div className="flex justify-start max-w-3xl w-full mt-4">
                        <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full border border-green-100 shadow-sm">
                          <Loader2 className="size-4 animate-spin text-green-600" />
                          <span className="text-sm text-green-700 font-medium">
                            Waving my magic wand...
                          </span>
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
                        <FieldLabel
                          htmlFor="chat-form-message"
                          className="sr-only"
                        >
                          Message
                        </FieldLabel>
                        <div className="relative group">
                          {/* Input + send/stop buttons */}
                          <Input
                            {...field}
                            id="chat-form-message"
                            className="h-16 pr-16 pl-12 bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-green-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 shadow-lg transition-all duration-300 text-base placeholder-green-400/60"
                            placeholder="✨ Share your ingredient list here... (or use the label photo button)"
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

                          {/* 📸 Image upload button inside input (left) */}
                          <button
                            type="button"
                            onClick={handleImageButtonClick}
                            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 border border-green-200 bg-white hover:bg-green-50 hover:border-green-300 shadow-sm transition-all duration-200 flex items-center justify-center"
                          >
                            <ImageIcon className="size-4 text-green-500" />
                          </button>

                          {/* Send / Stop buttons (right) */}
                          {(status === "ready" || status === "error") && (
                            <Button
                              className="absolute right-2 top-2 rounded-full bg-gradient-to-br from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                              type="submit"
                              disabled={!field.value.trim() && !attachedFiles}
                              size="icon"
                            >
                              <ArrowUp className="size-5" />
                            </Button>
                          )}
                          {(status === "streaming" ||
                            status === "submitted") && (
                            <Button
                              className="absolute right-2 top-2 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                              size="icon"
                              type="button"
                              onClick={() => {
                                stop();
                              }}
                            >
                              <Square className="size-4" />
                            </Button>
                          )}
                        </div>

                        {/* Attached image preview pill */}
                        {imagePreviewUrl && imageName && (
                          <div className="mt-2 flex items-center justify-between rounded-xl border border-green-100 bg-green-50/70 px-3 py-2 text-xs shadow-sm">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-lg overflow-hidden border border-green-200 bg-white">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={imagePreviewUrl}
                                  alt="Attached label"
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-green-700">
                                  Label photo attached
                                </span>
                                <span className="text-[10px] text-green-700/70 truncate max-w-[180px]">
                                  {imageName}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={clearAttachedImage}
                              className="ml-3 rounded-full p-1 hover:bg-green-100 text-green-700/80"
                              aria-label="Remove attached image"
                            >
                              <X className="size-3" />
                            </button>
                          </div>
                        )}
                      </Field>
                    )}
                  />
                </FieldGroup>
              </form>

              {/* Hidden file input for image upload */}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
          </div>

          {/* Magical Footer */}
          <div className="w-full px-5 py-4 items-center flex justify-center">
            <div className="max-w-6xl w-full">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-4 text-green-500/70">
                  <span>
                    © {new Date().getFullYear()} Ingrid - The Ingredient Fairy
                  </span>
                  <Link
                    href="/terms"
                    className="hover:text-green-600 transition-colors font-medium"
                  >
                    Safety &amp; Terms
                  </Link>
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
