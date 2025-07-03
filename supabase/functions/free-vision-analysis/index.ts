import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    console.log('Received vision analysis request');

    // Use OpenAI's gpt-4o-mini for vision analysis (very cost effective)
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are JARVIS, an AI assistant. Analyze images with detailed descriptions of objects, people, scenes, text, and any other relevant details. Always start responses with "Sir," and be helpful and specific about what you observe.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt || 'Analyze this image and describe what you see in detail, including objects, people, scenes, text, colors, and any other relevant information.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        max_tokens: 300
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;
    
    console.log('Vision analysis completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        description: analysis
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Vision analysis error:', error);
    
    // Provide a graceful fallback 
    const fallbackResponse = "Sir, I'm experiencing technical difficulties with my vision analysis system. Please ensure the OpenAI API key is configured properly. For now, I can confirm an image was received but cannot provide detailed analysis.";
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        description: fallbackResponse
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});