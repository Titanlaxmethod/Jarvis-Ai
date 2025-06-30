
import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useEnhancedTextToSpeech } from '@/hooks/useEnhancedTextToSpeech';
import { useBackgroundVoice } from '@/hooks/useBackgroundVoice';

export const useJarvisState = () => {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Array<{text: string, isUser: boolean, timestamp: Date}>>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [understandLevel, setUnderstandLevel] = useState('');
  const [currentResponse, setCurrentResponse] = useState('');
  const [systemStatus, setSystemStatus] = useState('START');
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCallInterface, setShowCallInterface] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const lastProcessedCommand = useRef<string>('');
  const apiCallTimeout = useRef<NodeJS.Timeout | null>(null);
  const isSpeakingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();
  
  const { 
    transcript, 
    isListening: speechListening, 
    startListening, 
    stopListening,
    resetTranscript 
  } = useSpeechRecognition();
  
  const { 
    speak, 
    stop: stopSpeaking, 
    isSpeaking: textToSpeechActive,
    voices,
    currentVoice,
    setVoice
  } = useEnhancedTextToSpeech();

  const {
    isBackgroundListening,
    enableBackgroundListening,
    disableBackgroundListening
  } = useBackgroundVoice();

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Status management
  useEffect(() => {
    setIsListening(speechListening);
    if (speechListening) {
      setSystemStatus('LISTENING');
    } else if (isSpeaking) {
      setSystemStatus('RESPONDING');
    } else if (isProcessing) {
      setSystemStatus('PROCESSING');
    } else {
      setSystemStatus('READY');
    }
  }, [speechListening, isSpeaking, isProcessing]);

  // Speech management
  useEffect(() => {
    setIsSpeaking(textToSpeechActive);
    
    if (textToSpeechActive) {
      console.log('JARVIS started speaking - pausing listening');
      stopListening();
      
      if (isSpeakingTimeoutRef.current) {
        clearTimeout(isSpeakingTimeoutRef.current);
      }
      
      isSpeakingTimeoutRef.current = setTimeout(() => {
        if (isActive && !textToSpeechActive) {
          console.log('JARVIS finished speaking - resuming listening');
          startListening();
        }
      }, 2000);
    }
  }, [textToSpeechActive, isActive]);

  const toggleListening = () => {
    if (isSpeaking) {
      console.log('Cannot toggle listening while speaking');
      return;
    }
    
    if (isListening) {
      stopListening();
      setSystemStatus('READY');
    } else {
      startListening();
      setSystemStatus('LISTENING');
    }
  };

  const toggleSpeaking = () => {
    if (isSpeaking) {
      stopSpeaking();
      setTimeout(() => {
        if (isActive && !isProcessing) {
          startListening();
        }
      }, 500);
    }
  };

  const activateJarvis = async () => {
    setIsActive(true);
    setSystemStatus('ONLINE');
    
    if (isMobile) {
      await enableBackgroundListening();
    }
    
    const activationMessage = "Good day, sir. JARVIS is now online and ready to assist you. I was created by Daniyal Bin Mushtaq. Background listening is now active.";
    await speak(activationMessage);
    
    setTimeout(() => {
      startListening();
    }, 3000);
    
    toast({
      title: "JARVIS Activated",
      description: "AI Assistant is now online with background listening enabled.",
    });
  };

  const deactivateJarvis = async () => {
    setIsActive(false);
    stopListening();
    stopSpeaking();
    setIsProcessing(false);
    lastProcessedCommand.current = '';
    
    if (apiCallTimeout.current) {
      clearTimeout(apiCallTimeout.current);
    }
    
    if (isBackgroundListening) {
      await disableBackgroundListening();
    }
    
    setSystemStatus('OFFLINE');
    speak("Powering down background systems. Until next time, sir.");
    setTimeout(() => {
      setMessages([]);
      setCurrentCommand('');
      setUnderstandLevel('');
      setCurrentResponse('');
      setShowCallInterface(false);
    }, 2000);
  };

  return {
    // State
    isActive,
    isListening,
    isSpeaking,
    messages,
    currentCommand,
    understandLevel,
    currentResponse,
    systemStatus,
    showVoiceSettings,
    isProcessing,
    showCallInterface,
    isMobile,
    transcript,
    voices,
    currentVoice,
    isBackgroundListening,
    
    // Refs
    lastProcessedCommand,
    apiCallTimeout,
    
    // Setters
    setMessages,
    setCurrentCommand,
    setUnderstandLevel,
    setCurrentResponse,
    setSystemStatus,
    setShowVoiceSettings,
    setIsProcessing,
    setShowCallInterface,
    
    // Functions
    speak,
    stopSpeaking,
    startListening,
    stopListening,
    resetTranscript,
    setVoice,
    toggleListening,
    toggleSpeaking,
    activateJarvis,
    deactivateJarvis,
    toast
  };
};
