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
import { ArrowUp, Loader2, Plus, Square, Sparkles, Wand2 } from "lucide-react";
import { MessageWall } from "@/components/messages/message-wall";
import { ChatHeader } from "@/app/parts/chat-header";
import { ChatHeaderBlock } from "@/app/parts/chat-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UIMessage } from "ai";
import { useEffect, useState, useRef } from "react";
import { AI_NAME, CLEAR_CHAT_TEXT, WELCOME_MESSAGE } from "@/config";
import Link from "next/link";
import { IngredientSafetyChart } from "@/components/ui/safetychart";
import { MessageReadAloud } from "@/components/messages/message-read-aloud";

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

// Helper: strip JSON blocks (```json ... ```) from assistant text so they don't show in UI
const stripJsonBlocks = (text: string): string => {
  if (!text) return text;
  return text.replace(/```json[\s\S]*?```/g, "").trim();
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

  // Helper function to extract JSON from AI response for chart
  const extractSafetyData = (message: UIMessage) => {
    if (message.role !== "assistant") return null;

    // Look for JSON in text parts
    const textParts = message.parts
      .filter((part) => part.type === "text")
      .map((part) => ("text" in part ? part.text : ""))
      .join("");

    // Try to find JSON pattern
    const jsonMatch = textParts.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        const jsonData = JSON.parse(jsonMatch[1]);
        // Validate the expected structure
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

  // Helper to extract text from a message
  const getMessageText = (message: UIMessage): string => {
    return message.parts
      .filter((part) => part.type === "text")
      .map((part) => ("text" in part ? part.text : ""))
      .join(" ");
  };

  // Initialize speech synthesis
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
        window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
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

  function onSubmit(data: z.infer<typeof formSchema>) {
    sendMessage({ text: data.message });
    form.reset();
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
      color:
        "from-amber-100 to-orange-100 border-amber-200 text-amber-700",
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
      color:
        "from-yellow-100 to-amber-100 border-yellow-200 text-yellow-700",
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

  return (
    <div className="fle
