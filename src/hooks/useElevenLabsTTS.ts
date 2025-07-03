import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ElevenLabsTTSResult {
  speak: (text: string, voiceId?: string) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
}

export const useElevenLabsTTS = (): ElevenLabsTTSResult => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string, voiceId: string = '9BWtsMINqrJLrRacOk9x'): Promise<void> => {
    try {
      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      setIsSpeaking(true);

      // Call the ElevenLabs edge function
      const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
        body: { text, voice_id: voiceId }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate speech');
      }

      // Create audio from base64 data
      const audioBlob = new Blob([
        Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))
      ], { type: 'audio/mpeg' });

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onloadeddata = () => {
        console.log('Audio loaded, duration:', audio.duration);
      };

      audio.onplay = () => {
        console.log('Audio started playing');
        setIsSpeaking(true);
      };

      audio.onended = () => {
        console.log('Audio finished playing');
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        setCurrentAudio(null);
      };

      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        setCurrentAudio(null);
      };

      setCurrentAudio(audio);
      await audio.play();

    } catch (error) {
      console.error('ElevenLabs TTS Error:', error);
      setIsSpeaking(false);
      
      // Fallback to browser speech synthesis
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        speechSynthesis.speak(utterance);
      }
    }
  }, [currentAudio]);

  const stop = useCallback(() => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
    setIsSpeaking(false);
    
    // Also stop browser speech synthesis
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  }, [currentAudio]);

  return {
    speak,
    stop,
    isSpeaking,
  };
};