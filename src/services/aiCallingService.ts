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
}

class AICallingService {
  private activeCalls: Map<string, CallSession> = new Map();
  private contacts: CallContact[] = [
    { name: "Emergency", phone: "911" },
    { name: "Office", phone: "+1-555-0123" },
    { name: "Home", phone: "+1-555-0124" },
    { name: "Support", phone: "+1-555-0125" }
  ];

  // Simulate AI calling functionality
  async makeCall(contact: CallContact, purpose?: string): Promise<CallSession> {
    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: CallSession = {
      id: callId,
      contact,
      status: 'dialing',
      startTime: new Date()
    };

    this.activeCalls.set(callId, session);
    
    console.log(`AI Calling: Initiating call to ${contact.name} (${contact.phone})`);
    
    // Simulate dialing process
    setTimeout(() => {
      const updatedSession = this.activeCalls.get(callId);
      if (updatedSession) {
        updatedSession.status = 'connected';
        console.log(`AI Call connected to ${contact.name}`);
        
        // Simulate call conversation
        this.simulateCallConversation(callId, purpose);
      }
    }, 2000);

    return session;
  }

  private simulateCallConversation(callId: string, purpose?: string) {
    const session = this.activeCalls.get(callId);
    if (!session) return;

    console.log(`AI Call in progress with ${session.contact.name}`);
    
    // Simulate conversation based on purpose
    if (purpose) {
      console.log(`AI Call purpose: ${purpose}`);
    }

    // Auto-end call after simulation
    setTimeout(() => {
      this.endCall(callId);
    }, 10000); // 10 second simulated call
  }

  async endCall(callId: string): Promise<void> {
    const session = this.activeCalls.get(callId);
    if (session) {
      session.status = 'ended';
      session.endTime = new Date();
      session.duration = Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 1000);
      
      console.log(`AI Call ended with ${session.contact.name}. Duration: ${session.duration} seconds`);
      
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

  // Parse phone numbers from text
  extractPhoneNumber(text: string): string | null {
    const phoneRegex = /(\+?[\d\s\-\(\)]{10,})/g;
    const match = text.match(phoneRegex);
    return match ? match[0].trim() : null;
  }

  // Handle different call commands
  async handleCallCommand(command: string): Promise<string> {
    const lowerCommand = command.toLowerCase();
    
    // Call specific contact
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
          return `Calling ${contact.name} at ${contact.phone}, sir. Call ID: ${session.id}`;
        } else {
          return `I couldn't find contact information for "${contactName}", sir. Please provide a phone number.`;
        }
      }
    }
    
    // Emergency call
    if (lowerCommand.includes('emergency') || lowerCommand.includes('911')) {
      const emergencyContact = { name: "Emergency Services", phone: "911" };
      const session = await this.makeCall(emergencyContact, "Emergency call initiated by JARVIS");
      return `Initiating emergency call, sir. Call ID: ${session.id}`;
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
    
    return `I'm not sure how to handle that call command, sir. Try "call [name]" or "call [name] at [phone number]".`;
  }
}

export const aiCallingService = new AICallingService();
