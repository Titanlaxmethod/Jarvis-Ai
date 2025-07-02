import { supabase } from '@/integrations/supabase/client';

interface TTSResponse {
  success: boolean;
  audio?: string;
  error?: string;
}

class ElevenLabsTTSService {
  private audioContext: AudioContext | null = null;

  private async getAudioContext(): Promise<AudioContext> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  async speak(text: string, voiceId: string = "TX3LPaxmHKxFdv7VOQHJ"): Promise<boolean> {
    try {
      console.log(`JARVIS TTS: Speaking text - "${text.substring(0, 50)}..."`);

      // Call our edge function for TTS
      const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
        body: {
          text: text,
          voice_id: voiceId,
          model_id: "eleven_turbo_v2"
        }
      });

      if (error) {
        console.error('TTS Error:', error);
        return false;
      }

      if (!data.success) {
        console.error('TTS Failed:', data.error);
        return false;
      }

      // Play the audio
      await this.playAudio(data.audio);
      return true;

    } catch (error) {
      console.error('Error in TTS service:', error);
      return false;
    }
  }

  private async playAudio(base64Audio: string): Promise<void> {
    try {
      const audioContext = await this.getAudioContext();
      
      // Convert base64 to array buffer
      const binaryString = atob(base64Audio);
      const audioArray = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        audioArray[i] = binaryString.charCodeAt(i);
      }

      // Decode and play audio
      const audioBuffer = await audioContext.decodeAudioData(audioArray.buffer);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      console.log('JARVIS: Playing TTS audio');
      source.start(0);
      
      // Return promise that resolves when audio finishes
      return new Promise((resolve) => {
        source.onended = () => {
          console.log('JARVIS: TTS audio finished');
          resolve();
        };
      });

    } catch (error) {
      console.error('Error playing TTS audio:', error);
      throw error;
    }
  }

  // Stop current audio and clean up
  stop(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const elevenLabsTTSService = new ElevenLabsTTSService();