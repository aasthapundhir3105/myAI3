"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Loader2, Play, Pause, Sparkles } from "lucide-react";

interface MessageReadAloudProps {
  text: string;
  messageId: string;
}

export function MessageReadAloud({ text, messageId }: MessageReadAloudProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [currentVoice, setCurrentVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    // Check if speech synthesis is supported
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setIsSupported(false);
      return;
    }

    // Load voices when available
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const bestVoice = getBestFairyVoice(voices);
      setCurrentVoice(bestVoice);
      
      if (voices.length === 0) {
        console.log('No voices available - may need user interaction');
      } else if (bestVoice) {
        console.log('✨ Using fairy voice:', bestVoice.name);
      }
    };

    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    
    // Try to load immediately
    loadVoices();

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  // Find the sweetest available voice
  const getBestFairyVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
    if (voices.length === 0) return null;

    // Voice quality ranking (sweetest to least sweet)
    const voicePriority = [
      'Samantha',           // macOS - very natural and sweet
      'Karen',              // macOS Australian - gentle and melodic
      'Victoria',           // macOS - soft and clear
      'Fiona',              // macOS Scottish - musical tone
      'Tessa',              // Safari - very clear and pleasant
      'Google UK English Female', // Chrome - elegant British
      'Microsoft Zira',     // Windows - friendly American
      'Google US English',  // Chrome - good fallback
      'Female',             // Any female voice
      'Compact'             // Last resort
    ];

    for (const voiceName of voicePriority) {
      const voice = voices.find(v => 
        v.name.includes(voiceName) && 
        !v.name.includes('Robotic') &&
        !v.name.includes('Bad')
      );
      if (voice) return voice;
    }

    return voices[0]; // Fallback to first available voice
  };

  const cleanTextForSpeech = (text: string) => {
    return text
      .replace(/```json[\s\S]*?```/g, '') // Remove JSON blocks
      .replace(/[#*\[\]()|`~>_-]/g, '') // Remove markdown symbols
      .replace(/\n/g, '. ') // Convert newlines to pauses
      .replace(/\s+/g, ' ') // Clean extra spaces
      .replace(/\.\.+/g, '.') // Fix multiple dots
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
    if (!cleanText || cleanText.length < 10) return;

    const speech = new SpeechSynthesisUtterance(cleanText);
    
    // SWEETER FAIRY VOICE SETTINGS:
    speech.rate = 0.82;      // Slower for gentle, magical tone
    speech.pitch = 1.4;      // Higher for fairy-like quality (1.0-2.0)
    speech.volume = 0.85;    // Clear but gentle (0.0-1.0)
    speech.lang = 'en-US';   // Force US English for better voice selection

    // Use the best available voice
    if (currentVoice) {
      speech.voice = currentVoice;
    } else {
      // Fallback: try to get a voice now
      const voices = window.speechSynthesis.getVoices();
      const voice = getBestFairyVoice(voices);
      if (voice) {
        speech.voice = voice;
        setCurrentVoice(voice);
      }
    }

    // Add event listeners for better UX
    speech.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    speech.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    speech.onerror = (event) => {
      console.error('Fairy voice error:', event);
      setIsSpeaking(false);
      setIsPaused(false);
    };

    speech.onpause = () => {
      setIsPaused(true);
    };

    speech.onresume = () => {
      setIsPaused(false);
    };

    // Small delay for natural feel
    setTimeout(() => {
      window.speechSynthesis.speak(speech);
    }, 100);
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
    return (
      <div className="flex items-center gap-2 mt-3">
        <span className="text-xs text-amber-600">
          Voice not supported in this browser
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-3">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
          onClick={speakAsFairy}
        >
          {isSpeaking ? (
            <Loader2 className="size-3 animate-spin mr-1" />
          ) : (
            <Sparkles className="size-3 mr-1" />
          )}
          {isSpeaking ? "Stop" : "Fairy Read"}
        </Button>

        {isSpeaking && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
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
      
      {/* Voice quality indicator */}
      {currentVoice && (
        <span className="text-xs text-green-600 opacity-70 max-w-[120px] truncate">
          {currentVoice.name.includes('Samantha') && '✨ Magical Voice'}
          {currentVoice.name.includes('Karen') && '🧚♀️ Sweet Voice'}
          {currentVoice.name.includes('Victoria') && '🌟 Gentle Voice'}
          {currentVoice.name.includes('Google') && '🎵 Clear Voice'}
          {!currentVoice.name.includes('Samantha') && 
           !currentVoice.name.includes('Karen') && 
           !currentVoice.name.includes('Victoria') && 
           !currentVoice.name.includes('Google') && '🔊 Fairy Voice'}
        </span>
      )}
    </div>
  );
}
