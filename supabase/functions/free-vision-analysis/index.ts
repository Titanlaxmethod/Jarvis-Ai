import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, prompt } = await req.json();

    // Use Hugging Face's free inference API
    const hf = new HfInference();

    // Convert base64 image to blob
    const imageData = image.replace(/^data:image\/[a-z]+;base64,/, '');
    const imageBuffer = Uint8Array.from(atob(imageData), c => c.charCodeAt(0));
    const imageBlob = new Blob([imageBuffer]);

    // Use a free vision-to-text model from Hugging Face
    const result = await hf.imageToText({
      data: imageBlob,
      model: 'Salesforce/blip-image-captioning-large'
    });

    let description = result.generated_text || "I can see an image, but I'm having trouble describing the details.";
    
    // Add JARVIS personality to the response
    const jarvisResponse = `Sir, I can see ${description.toLowerCase()}. This appears to be what's captured in the image. Is there anything specific you'd like me to focus on or explain about what I'm observing?`;

    return new Response(
      JSON.stringify({ 
        success: true, 
        description: jarvisResponse 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Free vision analysis error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to analyze image with free vision service',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});