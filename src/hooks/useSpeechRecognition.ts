import { useState, useRef, useCallback } from 'react';

// Define the SpeechRecognition interface and related types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;
  grammars: any;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

interface UseSpeechRecognitionResult {
  transcript: string;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export const useSpeechRecognition = (): UseSpeechRecognitionResult => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = useCallback(() => {
    console.log('Attempting to start listening...');
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported in this browser');
      alert('Speech recognition is not supported in this browser. Please use Chrome or Safari.');
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionConstructor() as SpeechRecognition;
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('Speech recognition started');
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      console.log('Speech recognition result received');
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        console.log('Final transcript:', finalTranscript);
        setTranscript(finalTranscript.trim());
      } else if (interimTranscript) {
        console.log('Interim transcript:', interimTranscript);
        // Show interim results for better UX
        setTranscript(interimTranscript.trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      // Handle specific errors
      switch (event.error) {
        case 'no-speech':
          console.log('No speech was detected. Restarting...');
          // Automatically restart after no speech
          setTimeout(() => {
            if (!isListening) {
              startListening();
            }
          }, 1000);
          break;
        case 'audio-capture':
          alert('Microphone access denied. Please allow microphone access and try again.');
          break;
        case 'not-allowed':
          alert('Microphone access not allowed. Please check your browser settings.');
          break;
        case 'network':
          console.log('Network error occurred. Retrying...');
          setTimeout(() => startListening(), 2000);
          break;
        default:
          console.log('Recognition error:', event.error);
      }
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
      
      // Auto-restart recognition to keep listening continuously
      setTimeout(() => {
        if (recognitionRef.current === recognition) {
          console.log('Restarting recognition...');
          startListening();
        }
      }, 500);
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
      console.log('Recognition start requested');
    } catch (error) {
      console.error('Failed to start recognition:', error);
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    console.log('Stopping listening...');
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    console.log('Resetting transcript');
    setTranscript('');
  }, []);

  return {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
  };
};

// Extend the Window interface to include speech recognition
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}
