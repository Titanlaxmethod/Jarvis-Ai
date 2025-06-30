
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
  const lastProcessedTranscript = useRef<string>('');
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastResultTime = useRef<number>(0);

  // Enhanced noise filtering
  const isNoiseOrFiller = (text: string): boolean => {
    const cleanText = text.toLowerCase().trim();
    
    // Filter out very short sounds
    if (cleanText.length < 2) return true;
    
    // Filter out common filler words and sounds
    const fillerWords = ['ah', 'oh', 'um', 'uh', 'hmm', 'er', 'eh', 'mm'];
    if (fillerWords.includes(cleanText)) return true;
    
    // Filter out repeated characters (like "aaa" or "mmm")
    if (/^(.)\1+$/.test(cleanText)) return true;
    
    // Filter out random short sounds
    if (cleanText.length <= 3 && !/jarvis|hi|hey|ok/.test(cleanText)) return true;
    
    return false;
  };

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

    // Clear any existing timeouts
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
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
      isProcessingRef.current = false;
      lastResultTime.current = Date.now();
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const currentTime = Date.now();
      
      // Prevent processing if we just processed something recently (debounce)
      if (currentTime - lastResultTime.current < 300) {
        console.log('Debouncing - too soon after last result');
        return;
      }

      if (isProcessingRef.current) {
        console.log('Already processing, ignoring result');
        return;
      }

      console.log('Speech recognition result received');
      let finalTranscript = '';
      let interimTranscript = '';

      // Process all results from the event
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript.trim();
        const confidence = result[0].confidence;

        console.log(`Result ${i}: "${transcript}" (confidence: ${confidence}, final: ${result.isFinal})`);

        // Enhanced confidence and noise filtering
        if (confidence < 0.6 || isNoiseOrFiller(transcript)) {
          console.log('Low confidence or noise/filler, ignoring:', transcript, 'confidence:', confidence);
          continue;
        }

        if (result.isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript + ' ';
        }
      }

      // Process final transcript
      if (finalTranscript && finalTranscript.trim().length > 1) {
        const cleanTranscript = finalTranscript.trim();
        
        // Prevent duplicate processing
        if (cleanTranscript === lastProcessedTranscript.current) {
          console.log('Duplicate transcript ignored:', cleanTranscript);
          return;
        }

        // Check if this is a meaningful command (not just noise)
        if (cleanTranscript.length >= 3 && !isNoiseOrFiller(cleanTranscript)) {
          console.log('Final transcript accepted:', cleanTranscript);
          lastProcessedTranscript.current = cleanTranscript;
          lastResultTime.current = currentTime;
          
          // Set processing flag to prevent duplicates
          isProcessingRef.current = true;
          
          // Clear any existing timeout and set new one
          if (processingTimeoutRef.current) {
            clearTimeout(processingTimeoutRef.current);
          }
          
          processingTimeoutRef.current = setTimeout(() => {
            setTranscript(cleanTranscript);
            // Reset processing flag after a delay to allow new commands
            setTimeout(() => {
              isProcessingRef.current = false;
            }, 2000);
          }, 100);
        } else {
          console.log('Final transcript rejected as noise:', cleanTranscript);
        }
      }

      // Handle interim results for better UX (but don't process them)
      if (interimTranscript && interimTranscript.trim().length > 2 && !isProcessingRef.current) {
        const cleanInterim = interimTranscript.trim();
        if (!isNoiseOrFiller(cleanInterim)) {
          console.log('Showing interim result:', cleanInterim);
          // Only show interim, don't process
          setTranscript(cleanInterim);
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      isProcessingRef.current = false;
      
      // Handle specific errors
      switch (event.error) {
        case 'no-speech':
          console.log('No speech detected. Continuing to listen...');
          // Don't restart immediately for no-speech to avoid loops
          setTimeout(() => {
            if (recognitionRef.current === recognition) {
              startListening();
            }
          }, 2000);
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
      if (!isProcessingRef.current && recognitionRef.current === recognition) {
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
      isProcessingRef.current = false;
    }
  }, []);

  const stopListening = useCallback(() => {
    console.log('Stopping listening...');
    isProcessingRef.current = false;
    
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
    
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
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
    lastProcessedTranscript.current = '';
    isProcessingRef.current = false;
    
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
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
