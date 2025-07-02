import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TTSRequest {
  text: string;
  voice_id?: string;
  model_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voice_id = "TX3LPaxmHKxFdv7VOQHJ", model_id = "eleven_turbo_v2" }: TTSRequest = await req.json();
    
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    
    if (!elevenLabsApiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text is required for TTS');
    }

    console.log(`JARVIS TTS: Converting text to speech - "${text.substring(0, 50)}..."`);

    // Call ElevenLabs TTS API
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${elevenLabsApiKey}`,
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsApiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: model_id,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.2,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API Error:', errorText);
      throw new Error(`ElevenLabs API Error: ${response.status} - ${errorText}`);
    }

    // Get audio data as array buffer
    const audioBuffer = await response.arrayBuffer();
    
    // Convert to base64 for transport
    const audioArray = new Uint8Array(audioBuffer);
    const base64Audio = btoa(String.fromCharCode(...audioArray));
    
    console.log(`JARVIS TTS: Successfully generated audio for text (${audioArray.length} bytes)`);

    return new Response(JSON.stringify({
      success: true,
      audio: base64Audio,
      format: 'mp3',
      text: text
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in elevenlabs-tts function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});