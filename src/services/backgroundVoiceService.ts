
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

class BackgroundVoiceService {
  private recognition: any;
  private isListening = false;
  private isInitialized = false;

  async initialize() {
    try {
      // Check if we can use speech recognition
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        throw new Error('Speech recognition not supported');
      }
      
      // Request persistent permissions for microphone
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (error) {
        console.warn('Microphone permission denied:', error);
      }
      
      // Start background listening
      this.startBackgroundListening();
      this.isInitialized = true;
      
      console.log('Background voice service initialized');
    } catch (error) {
      console.error('Failed to initialize background voice service:', error);
      throw error;
    }
  }

  private startBackgroundListening() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = true;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
      
      if (transcript.includes('jarvis')) {
        this.handleWakeWord();
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Background speech recognition error:', event.error);
      // Restart recognition after error
      setTimeout(() => this.startListening(), 1000);
    };

    this.recognition.onend = () => {
      // Restart recognition when it ends (for continuous listening)
      if (this.isListening) {
        setTimeout(() => this.startListening(), 100);
      }
    };

    this.startListening();
  }

  private startListening() {
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
        this.isListening = true;
      } catch (error) {
        console.error('Failed to start background listening:', error);
      }
    }
  }

  private async handleWakeWord() {
    try {
      // Haptic feedback
      await Haptics.impact({ style: ImpactStyle.Medium });
      
      // Speak response
      const utterance = new SpeechSynthesisUtterance("Yes sir, JARVIS is here");
      utterance.rate = 0.85;
      utterance.pitch = 0.75;
      speechSynthesis.speak(utterance);
      
      // Check if app is in background and bring to foreground
      const appState = await App.getState();
      if (!appState.isActive) {
        // App is in background, try to bring to foreground
        // On mobile web, we can try to focus the window
        if (window.focus) {
          window.focus();
        }
      }
      
      // Notify the main app that wake word was detected
      window.dispatchEvent(new CustomEvent('jarvis-wake-word'));
      
    } catch (error) {
      console.error('Error handling wake word:', error);
    }
  }

  stopListening() {
    this.isListening = false;
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  async disable() {
    this.stopListening();
    this.isInitialized = false;
  }

  get isActive() {
    return this.isInitialized && this.isListening;
  }
}

export const backgroundVoiceService = new BackgroundVoiceService();
