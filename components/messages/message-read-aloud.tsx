"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Loader2, Play, Pause } from "lucide-react";

interface MessageReadAloudProps {
  text: string;
  messageId: string;
}

export function MessageReadAloud({ text, messageId }: MessageReadAloudProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    // Check if speech synthesis is supported
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setIsSupported(false);
    }
  }, []);

  const cleanTextForSpeech = (text: string) => {
    return text
      .replace(/```json[\s\S]*?```/g, '') // Remove JSON blocks
      .replace(/[#*\[\]()|`~>]/g, '') // Remove markdown symbols
      .replace(/\n/g, '. ') // Convert newlines to pauses
      .replace(/\s+/g, ' ') // Clean extra spaces
      .trim();
  };

  const speakAsFairy = () => {
    if (!isSupported) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      return;
    }

    const cleanText = cleanTextForSpeech(text);
    if (!cleanText) return;

    const speech = new SpeechSynthesisUtterance(cleanText);
    speech.rate = 0.9; // Fairy-like slower pace
    speech.pitch = 1.1; // Slightly higher pitch
    speech.volume = 0.8;

    // Try to find a pleasant female voice
    const voices = window.speechSynthesis.getVoices();
    const fairyVoice = voices.find(voice => 
      voice.name.includes('Female') || 
      voice.name.includes('Samantha') ||
      voice.name.includes('Karen') ||
      voice.name.includes('Google UK English Female') ||
      voice.name.includes('Microsoft Zira')
    );

    if (fairyVoice) {
      speech.voice = fairyVoice;
    }

    speech.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    speech.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    speech.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(speech);
  };

  const pauseResumeSpeech = () => {
    if (!isSupported) return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  if (!isSupported) {
    return null; // Don't show button if not supported
  }

  return (
    <div className="flex items-center gap-2 mt-3">
      <Button
        variant="outline"
        size="sm"
        className="h-8 px-3 text-xs border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
        onClick={speakAsFairy}
      >
        {isSpeaking ? (
          <Loader2 className="size-3 animate-spin mr-1" />
        ) : (
          <Volume2 className="size-3 mr-1" />
        )}
        {isSpeaking ? "Stop" : "Read Aloud"}
      </Button>

      {isSpeaking && (
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
          onClick={pauseResumeSpeech}
        >
          {isPaused ? (
            <Play className="size-3 mr-1" />
          ) : (
            <Pause className="size-3 mr-1" />
          )}
          {isPaused ? "Resume" : "Pause"}
        </Button>
      )}
    </div>
  );
}
