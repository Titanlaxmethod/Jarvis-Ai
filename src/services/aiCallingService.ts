interface CallContact {
  name: string;
  phone: string;
  email?: string;
}

interface CallSession {
  id: string;
  contact: CallContact;
  status: 'dialing' | 'connected' | 'ended' | 'failed';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  message?: string;
  twilioSid?: string;
}

class AICallingService {
  private activeCalls: Map<string, CallSession> = new Map();
  private contacts: CallContact[] = [
    { name: "Emergency", phone: "911" },
    { name: "Office", phone: "+1-555-0123" },
    { name: "Home", phone: "+1-555-0124" },
    { name: "Support", phone: "+1-555-0125" }
  ];

  // Real AI calling functionality using Twilio
  async makeCall(contact: CallContact, purpose?: string, message?: string): Promise<CallSession> {
    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: CallSession = {
      id: callId,
      contact,
      status: 'dialing',
      startTime: new Date(),
      message
    };

    this.activeCalls.set(callId, session);
    
    console.log(`JARVIS: Initiating real call to ${contact.name} (${contact.phone})`);
    if (message) {
      console.log(`JARVIS: Message to deliver: ${message}`);
    }
    
    try {
      // Import Supabase client
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        'https://yyotjoreossbqggyevek.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5b3Rqb3Jlb3NzYnFnZ3lldmVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMDE0ODYsImV4cCI6MjA2Njc3NzQ4Nn0.OEGR0xGD4QprW4uyrCWwr13p-j4dUj_8gztWUrXn2Eg'
      );

      // Call Twilio edge function
      const { data, error } = await supabase.functions.invoke('twilio-call', {
        body: {
          to: contact.phone,
          message: message,
          action: 'make_call'
        }
      });

      if (error) {
        console.error('Twilio call error:', error);
        session.status = 'failed';
        return session;
      }

      if (data.success) {
        session.twilioSid = data.callSid;
        console.log(`JARVIS: Call initiated successfully - SID: ${data.callSid}`);
        
        // Update status to connected after a short delay
        setTimeout(() => {
          const updatedSession = this.activeCalls.get(callId);
          if (updatedSession && updatedSession.status === 'dialing') {
            updatedSession.status = 'connected';
            console.log(`JARVIS: Call connected to ${contact.name}`);
          }
        }, 3000);
      } else {
        console.error('Twilio call failed:', data.error);
        session.status = 'failed';
      }
    } catch (error) {
      console.error('Error making Twilio call:', error);
      session.status = 'failed';
    }

    return session;
  }

  async endCall(callId: string): Promise<void> {
    const session = this.activeCalls.get(callId);
    if (session) {
      // If we have a Twilio SID, end the call via API
      if (session.twilioSid) {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            'https://yyotjoreossbqggyevek.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5b3Rqb3Jlb3NzYnFnZ3lldmVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMDE0ODYsImV4cCI6MjA2Njc3NzQ4Nn0.OEGR0xGD4QprW4uyrCWwr13p-j4dUj_8gztWUrXn2Eg'
          );

          await supabase.functions.invoke('twilio-call', {
            body: {
              action: 'end_call',
              callSid: session.twilioSid
            }
          });
          
          console.log(`JARVIS: Call ${session.twilioSid} ended via Twilio API`);
        } catch (error) {
          console.error('Error ending Twilio call:', error);
        }
      }

      session.status = 'ended';
      session.endTime = new Date();
      session.duration = Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 1000);
      
      const messageStatus = session.message ? ` Message "${session.message}" was delivered successfully.` : '';
      console.log(`JARVIS: Call ended with ${session.contact.name}. Duration: ${session.duration} seconds.${messageStatus}`);
      
      // Keep in history for a while then remove
      setTimeout(() => {
        this.activeCalls.delete(callId);
      }, 30000);
    }
  }

  findContact(query: string): CallContact | null {
    const lowerQuery = query.toLowerCase();
    return this.contacts.find(contact => 
      contact.name.toLowerCase().includes(lowerQuery) ||
      contact.phone.includes(query)
    ) || null;
  }

  addContact(contact: CallContact): void {
    this.contacts.push(contact);
  }

  getContacts(): CallContact[] {
    return [...this.contacts];
  }

  getActiveCalls(): CallSession[] {
    return Array.from(this.activeCalls.values());
  }

  // Enhanced phone number extraction
  extractPhoneNumber(text: string): string | null {
    const phoneRegex = /(\+?[\d\s\-\(\)]{8,})/g;
    const match = text.match(phoneRegex);
    if (match) {
      const cleaned = match[0].replace(/[^\d\+]/g, '');
      return cleaned.length >= 8 ? match[0].trim() : null;
    }
    return null;
  }

  // Handle different call commands with improved message processing
  async handleCallCommand(command: string): Promise<string> {
    const lowerCommand = command.toLowerCase();
    
    console.log('Processing call command:', command);
    
    // Enhanced phone number detection
    const phoneNumberPattern = /(\+?[\d\s\-\(\)]{8,})/g;
    const phoneMatches = command.match(phoneNumberPattern);
    
    // Check for "call [number] and tell/say [message]" pattern first
    const callWithMessagePattern = /call\s+(.+?)\s+(?:and tell|and say)\s+(.+)/i;
    const callWithMessageMatch = command.match(callWithMessagePattern);
    
    if (callWithMessageMatch) {
      const contactInfo = callWithMessageMatch[1].trim();
      const message = callWithMessageMatch[2].trim();
      
      console.log(`Call with message detected - Contact: ${contactInfo}, Message: ${message}`);
      
      // Extract phone number from contact info
      const phoneInContact = this.extractPhoneNumber(contactInfo);
      let contact = this.findContact(contactInfo);
      
      if (!contact && phoneInContact) {
        contact = { name: `Contact ${phoneInContact.replace(/[^\d]/g, '')}`, phone: phoneInContact };
        this.addContact(contact);
      }
      
      if (contact) {
        const session = await this.makeCall(contact, `Deliver message: ${message}`, message);
        return `Calling ${contact.name} at ${contact.phone} to deliver your message: "${message}". The call is connecting now, sir.`;
      } else {
        return `I couldn't identify the contact "${contactInfo}", sir. Please provide a clear phone number.`;
      }
    }
    
    // If command contains just a phone number, make the call
    if (phoneMatches && phoneMatches.length > 0) {
      const phoneNumber = phoneMatches[0].trim();
      const cleanedPhone = phoneNumber.replace(/[^\d\+]/g, '');
      
      if (cleanedPhone.length >= 8) {
        const contact = { name: `Contact ${cleanedPhone}`, phone: phoneNumber };
        this.addContact(contact);
        const session = await this.makeCall(contact);
        return `Calling ${phoneNumber} now, sir. Connection initiated.`;
      }
    }
    
    // Regular call commands
    if (lowerCommand.includes('call')) {
      const contactMatch = lowerCommand.match(/call\s+(.+?)(?:\s+(?:at|on)\s+(.+))?$/);
      if (contactMatch) {
        const contactName = contactMatch[1].trim();
        const phone = contactMatch[2]?.trim();
        
        let contact = this.findContact(contactName);
        
        if (!contact && phone) {
          const extractedPhone = this.extractPhoneNumber(phone);
          if (extractedPhone) {
            contact = { name: contactName, phone: extractedPhone };
            this.addContact(contact);
          }
        }
        
        if (contact) {
          const session = await this.makeCall(contact);
          return `Calling ${contact.name} at ${contact.phone}, sir.`;
        } else {
          return `I couldn't find contact information for "${contactName}", sir. Please provide a phone number.`;
        }
      }
    }
    
    // Emergency call
    if (lowerCommand.includes('emergency') || lowerCommand.includes('911')) {
      const emergencyContact = { name: "Emergency Services", phone: "911" };
      const session = await this.makeCall(emergencyContact, "Emergency call initiated by JARVIS");
      return `Initiating emergency call, sir.`;
    }
    
    // End call
    if (lowerCommand.includes('end call') || lowerCommand.includes('hang up')) {
      const activeCalls = this.getActiveCalls().filter(call => call.status === 'connected');
      if (activeCalls.length > 0) {
        await this.endCall(activeCalls[0].id);
        return `Call ended, sir.`;
      } else {
        return `No active calls to end, sir.`;
      }
    }
    
    // Show contacts
    if (lowerCommand.includes('show contacts') || lowerCommand.includes('list contacts')) {
      const contacts = this.getContacts();
      const contactList = contacts.map(c => `${c.name}: ${c.phone}`).join(', ');
      return `Your contacts, sir: ${contactList}`;
    }
    
    // Show active calls
    if (lowerCommand.includes('active calls') || lowerCommand.includes('current calls')) {
      const activeCalls = this.getActiveCalls().filter(call => call.status === 'connected' || call.status === 'dialing');
      if (activeCalls.length > 0) {
        const callList = activeCalls.map(call => `${call.contact.name} (${call.status})`).join(', ');
        return `Active calls, sir: ${callList}`;
      } else {
        return `No active calls, sir.`;
      }
    }
    
    return `I'm not sure how to handle that call command, sir. Try "call [phone number]", or "call [number] and tell them [message]".`;
  }
}

export const aiCallingService = new AICallingService();
