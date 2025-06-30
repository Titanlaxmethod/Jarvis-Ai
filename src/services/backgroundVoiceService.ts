
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

class BackgroundVoiceService {
  private recognition: any;
  private isListening = false;
  private isInitialized = false;
  private restartTimeout: NodeJS.Timeout | null = null;

  async initialize() {
    try {
      console.log('Initializing background voice service...');
      
      // Check if we can use speech recognition
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        throw new Error('Speech recognition not supported');
      }
      
      // Request microphone permissions
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('Microphone access granted');
        // Close the stream immediately as we just needed permission
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.warn('Microphone permission denied:', error);
        throw new Error('Microphone access required for background listening');
      }
      
      // Start background listening
      this.startBackgroundListening();
      this.isInitialized = true;
      
      console.log('Background voice service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize background voice service:', error);
      throw error;
    }
  }

  private startBackgroundListening() {
    console.log('Starting background listening...');
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = true;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
      console.log('Background voice detected:', transcript);
      
      if (transcript.includes('jarvis') || transcript.includes('jarvis')) {
        console.log('Wake word detected!');
        this.handleWakeWord();
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Background speech recognition error:', event.error);
      
      // Handle different error types
      switch (event.error) {
        case 'no-speech':
          // This is normal, just restart
          this.restartListening();
          break;
        case 'audio-capture':
        case 'not-allowed':
          console.error('Microphone access denied');
          this.isInitialized = false;
          break;
        case 'network':
          // Restart after network error
          setTimeout(() => this.restartListening(), 2000);
          break;
        default:
          // Restart after any other error
          this.restartListening();
      }
    };

    this.recognition.onend = () => {
      console.log('Background recognition ended, restarting...');
      // Restart recognition when it ends (for continuous listening)
      if (this.isListening && this.isInitialized) {
        this.restartListening();
      }
    };

    this.startListening();
  }

  private restartListening() {
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
    }
    
    this.restartTimeout = setTimeout(() => {
      if (this.isInitialized) {
        this.startListening();
      }
    }, 1000);
  }

  private startListening() {
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
        this.isListening = true;
        console.log('Background listening started');
      } catch (error) {
        console.error('Failed to start background listening:', error);
        this.restartListening();
      }
    }
  }

  private async handleWakeWord() {
    try {
      console.log('Handling wake word...');
      
      // Haptic feedback (mobile only)
      try {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } catch (error) {
        console.log('Haptic feedback not available');
      }
      
      // Speak response
      const utterance = new SpeechSynthesisUtterance("Yes sir, JARVIS is here");
      utterance.rate = 0.85;
      utterance.pitch = 0.75;
      utterance.volume = 1.0;
      speechSynthesis.speak(utterance);
      
      // Check if app is in background and bring to foreground
      try {
        const appState = await App.getState();
        if (!appState.isActive) {
          console.log('App is in background, attempting to bring to foreground');
          // On mobile web, try to focus the window
          if (window.focus) {
            window.focus();
          }
          // Also try to bring the document to focus
          if (document.visibilityState === 'hidden') {
            document.addEventListener('visibilitychange', () => {
              if (document.visibilityState === 'visible') {
                window.focus();
              }
            }, { once: true });
          }
        }
      } catch (error) {
        console.log('App state check not available:', error);
      }
      
      // Notify the main app that wake word was detected
      window.dispatchEvent(new CustomEvent('jarvis-wake-word'));
      
    } catch (error) {
      console.error('Error handling wake word:', error);
    }
  }

  stopListening() {
    console.log('Stopping background listening...');
    this.isListening = false;
    
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  async disable() {
    console.log('Disabling background voice service...');
    this.stopListening();
    this.isInitialized = false;
  }

  get isActive() {
    return this.isInitialized && this.isListening;
  }
}

export const backgroundVoiceService = new BackgroundVoiceService();
