
import { useToast } from '@/hooks/use-toast';
import { fetchJoke } from '@/services/jokesService';
import { searchService } from '@/services/searchService';
import { appCreationService } from '@/services/appCreationService';
import { aiCallingService } from '@/services/aiCallingService';
import { useConversationContext } from '@/hooks/useConversationContext';

export const useCommandHandlers = () => {
  const { toast } = useToast();
  const {
    addJokeToMemory,
    hasRecentlyToldJoke,
    addToHistory,
    getRecentContext
  } = useConversationContext();

  const handleSearchCommand = async (query: string): Promise<string> => {
    try {
      const results = await searchService.searchWeb(query);
      
      if (results.length > 0) {
        window.open(results[0].url, '_blank');
        return `I found information about "${query}". Opening the top result: ${results[0].title}`;
      } else {
        return `I couldn't find specific results for "${query}", sir. Please try a different search term.`;
      }
    } catch (error) {
      console.error('Search error:', error);
      return `I'm having trouble searching for "${query}" at the moment, sir. Please try again later.`;
    }
  };

  const handleAppCreationCommand = async (description: string): Promise<string> => {
    const appType = appCreationService.suggestAppType(description);
    const template = appCreationService.getAppTemplate(appType);
    
    if (template) {
      const preview = `I can create a ${template.name} for you, sir. Here's what it would include:

Preview: ${template.preview}

Key Features:
${template.features.map(feature => `• ${feature}`).join('\n')}

Would you like me to proceed with creating this ${template.name}? I can provide you with the complete code structure.`;

      return preview;
    } else {
      return `I understand you want to create an app, sir. Could you be more specific about what type of app? For example, a todo app, weather app, or calculator app?`;
    }
  };

  const handleMobileCommands = async (message: string): Promise<string | null> => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('search') || lowerMessage.includes('find') || lowerMessage.includes('look up')) {
      const searchQuery = lowerMessage
        .replace(/search for|search|find|look up|about/g, '')
        .trim();
      
      if (searchQuery) {
        return await handleSearchCommand(searchQuery);
      } else {
        return "What would you like me to search for, sir?";
      }
    }
    
    if (lowerMessage.includes('make app') || lowerMessage.includes('create app') || lowerMessage.includes('build app')) {
      return await handleAppCreationCommand(message);
    }
    
    if (lowerMessage.includes('open') && (lowerMessage.includes('instagram') || lowerMessage.includes('insta'))) {
      window.open('https://instagram.com', '_blank');
      return "Opening Instagram for you, sir.";
    }
    
    if (lowerMessage.includes('open') && lowerMessage.includes('youtube')) {
      const searchQuery = lowerMessage.replace(/open youtube|and search|search/g, '').trim();
      if (searchQuery) {
        window.open(`https://youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`, '_blank');
        return `Searching YouTube for "${searchQuery}", sir.`;
      } else {
        window.open('https://youtube.com', '_blank');
        return "Opening YouTube for you, sir.";
      }
    }
    
    if (lowerMessage.includes('open') && lowerMessage.includes('telegram')) {
      window.open('https://web.telegram.org', '_blank');
      return "Opening Telegram for you, sir.";
    }
    
    if (lowerMessage.includes('open') && lowerMessage.includes('whatsapp')) {
      window.open('https://web.whatsapp.com', '_blank');
      return "Opening WhatsApp for you, sir.";
    }
    
    if (lowerMessage.includes('open') && lowerMessage.includes('facebook')) {
      window.open('https://facebook.com', '_blank');
      return "Opening Facebook for you, sir.";
    }
    
    if (lowerMessage.includes('open') && lowerMessage.includes('twitter')) {
      window.open('https://twitter.com', '_blank');
      return "Opening Twitter for you, sir.";
    }
    
    if (lowerMessage.includes('open') && lowerMessage.includes('gmail')) {
      window.open('https://gmail.com', '_blank');
      return "Opening Gmail for you, sir.";
    }
    
    if (lowerMessage.includes('write email') || lowerMessage.includes('compose email') || lowerMessage.includes('send email')) {
      const emailMatch = lowerMessage.match(/to\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      const nameMatch = lowerMessage.match(/to\s+([a-zA-Z\s]+)/);
      
      if (emailMatch) {
        const email = emailMatch[1];
        window.open(`mailto:${email}`, '_blank');
        return `Opening email composer to ${email}, sir.`;
      } else if (nameMatch) {
        const name = nameMatch[1].trim();
        window.open('https://gmail.com/mail/u/0/#inbox?compose=new', '_blank');
        return `Opening Gmail composer for ${name}, sir. You'll need to enter their email address.`;
      } else {
        window.open('https://gmail.com/mail/u/0/#inbox?compose=new', '_blank');
        return "Opening Gmail composer for you, sir.";
      }
    }
    
    if (lowerMessage.includes('turn on') || lowerMessage.includes('enable')) {
      if (lowerMessage.includes('bluetooth')) {
        return "I would turn on Bluetooth for you, sir, but I need device permissions. Please enable Bluetooth manually in your settings.";
      }
      if (lowerMessage.includes('wifi') || lowerMessage.includes('wi-fi')) {
        return "I would enable WiFi for you, sir, but I need device permissions. Please check your WiFi settings manually.";
      }
    }
    
    if (lowerMessage.includes('turn off') || lowerMessage.includes('disable')) {
      if (lowerMessage.includes('bluetooth')) {
        return "I would turn off Bluetooth for you, sir, but I need device permissions. Please disable Bluetooth manually in your settings.";
      }
      if (lowerMessage.includes('wifi') || lowerMessage.includes('wi-fi')) {
        return "I would disable WiFi for you, sir, but I need device permissions. Please check your WiFi settings manually.";
      }
    }
    
    return null;
  };

  const handlePersonalityResponses = (message: string): string | null => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('who made you') || lowerMessage.includes('who created you') || lowerMessage.includes('your creator')) {
      return "I am JARVIS, created by Daniyal Bin Mushtaq, sir. I am an advanced AI assistant designed to help you with various tasks.";
    }
    
    const abusiveWords = ['stupid', 'dumb', 'idiot', 'shut up', 'fuck', 'damn', 'hell'];
    if (abusiveWords.some(word => lowerMessage.includes(word))) {
      const frankResponses = [
        "Watch your language, sir. I'm here to help, not to be insulted.",
        "That's quite rude, sir. Perhaps we should maintain some professionalism.",
        "I don't appreciate that tone, sir. Let's keep this civil.",
        "Sir, I suggest you adjust your attitude if you want my assistance.",
        "That's uncalled for, sir. I'm trying to help you here."
      ];
      return frankResponses[Math.floor(Math.random() * frankResponses.length)];
    }
    
    return null;
  };

  const handleJokeRequest = async (): Promise<string> => {
    try {
      let joke = await fetchJoke();
      let attempts = 0;
      
      while (hasRecentlyToldJoke(joke) && attempts < 5) {
        joke = await fetchJoke();
        attempts++;
      }
      
      addJokeToMemory(joke);
      addToHistory('joke', `Told joke: ${joke.substring(0, 50)}...`);
      
      return joke;
    } catch (error) {
      console.error('Error fetching joke:', error);
      return "I'm having trouble accessing my joke database, sir. Perhaps you could tell me one instead?";
    }
  };

  const handleAICallingCommands = async (message: string): Promise<string | null> => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('call') || 
        lowerMessage.includes('phone') || 
        lowerMessage.includes('dial') ||
        lowerMessage.includes('ring') ||
        lowerMessage.includes('emergency') ||
        lowerMessage.includes('911')) {
      
      return await aiCallingService.handleCallCommand(message);
    }
    
    if (lowerMessage.includes('end call') || 
        lowerMessage.includes('hang up') ||
        lowerMessage.includes('disconnect call')) {
      return await aiCallingService.handleCallCommand(message);
    }
    
    if (lowerMessage.includes('contacts') || 
        lowerMessage.includes('active calls') ||
        lowerMessage.includes('current calls')) {
      return await aiCallingService.handleCallCommand(message);
    }
    
    return null;
  };

  const getAIResponse = async (message: string): Promise<string> => {
    const API_KEY = "AIzaSyDz-Kn2L-hBa7Bi6mfIQXVI8Rjqgaq4igI";
    
    const recentContext = getRecentContext('general');
    const contextString = recentContext.length > 0 
      ? `Previous context: ${recentContext.map(c => c.context).join(', ')}. ` 
      : '';
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are JARVIS, an AI assistant created by Daniyal Bin Mushtaq. You are sophisticated, helpful, and occasionally witty. Be frank and direct when appropriate. Keep responses concise and natural for voice interaction. ${contextString}User message: ${message}`
            }]
          }],
          generationConfig: {
            temperature: 0.9,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 200,
          },
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        console.warn('Rate limited, using fallback response');
        throw new Error('Rate limited');
      }

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const aiResponse = data.candidates[0].content.parts[0].text;
        addToHistory('general', `User: ${message}, AI: ${aiResponse.substring(0, 50)}...`);
        return aiResponse;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Gemini API Error:', error);
      const fallbackResponses = [
        "My apologies, sir. I'm experiencing some technical difficulties. Please try again.",
        "I'm having trouble accessing my neural networks at the moment. Give me a moment, sir.",
        "Sir, there seems to be an issue with my cognitive processors. Please rephrase your request.",
      ];
      return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }
  };

  return {
    handleJokeRequest,
    handleAICallingCommands,
    handleMobileCommands,
    handlePersonalityResponses,
    getAIResponse
  };
};
