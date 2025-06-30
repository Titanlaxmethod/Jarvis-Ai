
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
  const lastTranscriptRef = useRef<string>('');
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processingRef = useRef<boolean>(false);

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
      processingRef.current = false;
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (processingRef.current) {
        console.log('Already processing, ignoring result');
        return;
      }

      console.log('Speech recognition result received');
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;

        // Filter out low confidence results and short meaningless sounds
        if (confidence < 0.7 && transcript.trim().length < 3) {
          console.log('Low confidence or short transcript, ignoring:', transcript, 'confidence:', confidence);
          continue;
        }

        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Process final transcript
      if (finalTranscript && finalTranscript.trim().length > 2) {
        const cleanTranscript = finalTranscript.trim();
        
        // Check if this is the same as the last transcript to avoid duplicates
        if (cleanTranscript !== lastTranscriptRef.current) {
          console.log('Final transcript:', cleanTranscript);
          lastTranscriptRef.current = cleanTranscript;
          
          // Clear any existing debounce
          if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
          }
          
          // Set processing flag and debounce
          processingRef.current = true;
          debounceTimeoutRef.current = setTimeout(() => {
            setTranscript(cleanTranscript);
            processingRef.current = false;
          }, 500); // 500ms debounce
        } else {
          console.log('Duplicate transcript ignored:', cleanTranscript);
        }
      } else if (interimTranscript && interimTranscript.trim().length > 2) {
        console.log('Interim transcript:', interimTranscript.trim());
        // Show interim results for better UX, but don't process them
        if (!processingRef.current) {
          setTranscript(interimTranscript.trim());
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      processingRef.current = false;
      
      // Handle specific errors
      switch (event.error) {
        case 'no-speech':
          console.log('No speech detected. Continuing to listen...');
          // Don't restart immediately for no-speech to avoid loops
          break;
        case 'audio-capture':
          alert('Microphone access denied. Please allow microphone access and try again.');
          break;
        case 'not-allowed':
          alert('Microphone access not allowed. Please check your browser settings.');
          break;
        case 'network':
          console.log('Network error occurred. Retrying...');
          setTimeout(() => startListening(), 3000);
          break;
        default:
          console.log('Recognition error:', event.error);
          setTimeout(() => startListening(), 2000);
      }
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
      
      // Only auto-restart if we're not processing and the recognition wasn't manually stopped
      if (!processingRef.current && recognitionRef.current === recognition) {
        console.log('Auto-restarting recognition...');
        setTimeout(() => {
          if (recognitionRef.current === recognition) {
            startListening();
          }
        }, 1000);
      }
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
      console.log('Recognition start requested');
    } catch (error) {
      console.error('Failed to start recognition:', error);
      setIsListening(false);
      processingRef.current = false;
    }
  }, []);

  const stopListening = useCallback(() => {
    console.log('Stopping listening...');
    processingRef.current = false;
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    console.log('Resetting transcript');
    setTranscript('');
    lastTranscriptRef.current = '';
    processingRef.current = false;
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
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
