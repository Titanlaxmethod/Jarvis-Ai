import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CallRequest {
  to: string;
  message?: string;
  action: 'make_call' | 'end_call';
  callSid?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, message, action, callSid }: CallRequest = await req.json();
    
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !twilioPhone) {
      throw new Error('Twilio credentials not configured');
    }

    console.log(`Twilio Call ${action}:`, { to, message: message?.substring(0, 50) });

    if (action === 'make_call') {
      // Create TwiML for automatic message delivery without user interaction
      let twimlMessage: string;
      
      if (message && message.trim()) {
        // Escape special characters for TwiML safety
        const safeMessage = message.replace(/[<>&'"]/g, ' ').replace(/\s+/g, ' ').trim();
        
        twimlMessage = `<Response>
          <Say voice="alice">Listen carefully, I am JARVIS and this is the message: ${safeMessage}</Say>
          <Pause length="2"/>
          <Say voice="alice">This message was delivered by JARVIS AI assistant. Thank you.</Say>
        </Response>`;
      } else {
        twimlMessage = `<Response>
          <Say voice="alice">Listen carefully, I am JARVIS calling for a test connection. This call confirms your phone number is working correctly.</Say>
          <Pause length="1"/>
          <Say voice="alice">Test completed. Thank you.</Say>
        </Response>`;
      }

      console.log('TwiML Direct Message:', twimlMessage);

      // Make the call
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          From: twilioPhone,
          Twiml: twimlMessage
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Twilio API Error:', error);
        throw new Error(`Twilio API Error: ${response.status}`);
      }

      const callData = await response.json();
      console.log('Call initiated successfully:', callData.sid);
      
      return new Response(JSON.stringify({
        success: true,
        callSid: callData.sid,
        status: callData.status,
        to: callData.to,
        from: callData.from
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'end_call' && callSid) {
      // End the call
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${callSid}.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          Status: 'completed'
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Twilio End Call Error:', error);
        throw new Error(`Failed to end call: ${response.status}`);
      }

      const callData = await response.json();
      console.log('Call ended successfully:', callSid);
      
      return new Response(JSON.stringify({
        success: true,
        callSid: callData.sid,
        status: callData.status
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action or missing parameters');

  } catch (error) {
    console.error('Error in twilio-call function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});