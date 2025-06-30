import { useState, useRef, useCallback, useEffect } from 'react';

interface Voice {
  name: string;
  lang: string;
  gender: 'male' | 'female';
  quality: 'high' | 'medium' | 'low';
}

interface TextToSpeechResult {
  speak: (text: string) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
  voices: Voice[];
  currentVoice: Voice | null;
  setVoice: (voice: Voice) => void;
}

export const useEnhancedTextToSpeech = (): TextToSpeechResult => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [currentVoice, setCurrentVoice] = useState<Voice | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      const processedVoices: Voice[] = availableVoices
        .filter(voice => voice.lang.includes('en'))
        .map(voice => {
          const isFemaleName = voice.name.toLowerCase().includes('female') || 
                              voice.name.toLowerCase().includes('woman') ||
                              voice.name.toLowerCase().includes('zira') ||
                              voice.name.toLowerCase().includes('hazel');
          
          const gender: 'male' | 'female' = isFemaleName ? 'female' : 'male';
          
          const quality: 'high' | 'medium' | 'low' = voice.name.includes('Premium') || voice.name.includes('Neural') ? 'high' : 
                   voice.name.includes('Google') || voice.name.includes('Microsoft') ? 'medium' : 'low';
          
          return {
            name: voice.name,
            lang: voice.lang,
            gender,
            quality
          };
        })
        .sort((a, b) => {
          // Prioritize high quality voices
          if (a.quality === 'high' && b.quality !== 'high') return -1;
          if (b.quality === 'high' && a.quality !== 'high') return 1;
          return 0;
        });

      setVoices(processedVoices);
      
      // Set default voice - prefer high quality male voices for JARVIS
      const preferredVoice = processedVoices.find(voice => 
        voice.gender === 'male' && voice.quality === 'high'
      ) || processedVoices.find(voice => 
        voice.gender === 'male'
      ) || processedVoices[0];
      
      setCurrentVoice(preferredVoice);
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        console.error('Text-to-speech not supported');
        resolve();
        return;
      }

      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Enhanced voice settings for more AI-like speech
      utterance.rate = 0.85;
      utterance.pitch = 0.75;
      utterance.volume = 0.9;

      // Use selected voice
      if (currentVoice) {
        const systemVoices = speechSynthesis.getVoices();
        const selectedVoice = systemVoices.find(voice => voice.name === currentVoice.name);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        resolve();
      };

      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);
    });
  }, [currentVoice]);

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const setVoice = useCallback((voice: Voice) => {
    setCurrentVoice(voice);
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    voices,
    currentVoice,
    setVoice,
  };
};
