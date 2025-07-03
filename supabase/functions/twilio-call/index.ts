import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, to, message } = await req.json();
    
    // Get Twilio credentials from environment variables
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
    
    if (!accountSid || !authToken || !fromPhoneNumber) {
      throw new Error('Missing Twilio credentials');
    }
    
    console.log(`Twilio Call ${action}:`, { to, message: message?.substring(0, 50) });

    if (action === 'make_call') {
      // Create simple TwiML for direct message delivery
      let twimlMessage: string;
      
      if (message && message.trim()) {
        // Sanitize the message for TwiML
        const safeMessage = message.replace(/[<>&'"]/g, ' ').replace(/\s+/g, ' ').trim();
        
        twimlMessage = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Listen carefully, I am JARVIS and this is the message: ${safeMessage}</Say>
  <Pause length="2"/>
  <Say voice="alice">This message was delivered by JARVIS AI assistant. Thank you.</Say>
</Response>`;
      } else {
        twimlMessage = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Listen carefully, I am JARVIS calling for a test connection.</Say>
  <Pause length="1"/>
  <Say voice="alice">Test completed. Thank you.</Say>
</Response>`;
      }

      console.log('TwiML Direct Message:', twimlMessage);

      // Make the call with TwiML
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'To': to,
          'From': fromPhoneNumber,
          'Twiml': twimlMessage
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Twilio API error:', errorText);
        throw new Error(`Twilio API error: ${response.status} ${errorText}`);
      }

      const callData = await response.json();
      console.log('Call initiated:', callData.sid);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Call initiated to ${to}`,
          callSid: callData.sid 
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: 'Invalid action' }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in twilio-call function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});