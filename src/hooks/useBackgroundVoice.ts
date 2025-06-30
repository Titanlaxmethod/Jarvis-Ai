
import { useEffect, useState } from 'react';
import { backgroundVoiceService } from '@/services/backgroundVoiceService';

export const useBackgroundVoice = () => {
  const [isBackgroundListening, setIsBackgroundListening] = useState(false);

  useEffect(() => {
    const handleWakeWord = () => {
      // Handle wake word detected in background
      console.log('Wake word detected in background');
    };

    window.addEventListener('jarvis-wake-word', handleWakeWord);
    
    return () => {
      window.removeEventListener('jarvis-wake-word', handleWakeWord);
    };
  }, []);

  const enableBackgroundListening = async () => {
    try {
      await backgroundVoiceService.initialize();
      setIsBackgroundListening(true);
    } catch (error) {
      console.error('Failed to enable background listening:', error);
    }
  };

  const disableBackgroundListening = async () => {
    try {
      await backgroundVoiceService.disable();
      setIsBackgroundListening(false);
    } catch (error) {
      console.error('Failed to disable background listening:', error);
    }
  };

  return {
    isBackgroundListening,
    enableBackgroundListening,
    disableBackgroundListening
  };
};
