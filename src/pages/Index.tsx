import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Power, Settings, MessageSquare, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import VoiceVisualizer from '@/components/VoiceVisualizer';
import ChatInterface from '@/components/ChatInterface';
import VoiceSettings from '@/components/VoiceSettings';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useEnhancedTextToSpeech } from '@/hooks/useEnhancedTextToSpeech';
import { useConversationContext } from '@/hooks/useConversationContext';
import { useBackgroundVoice } from '@/hooks/useBackgroundVoice';
import { fetchJoke } from '@/services/jokesService';
import { searchService } from '@/services/searchService';
import { appCreationService } from '@/services/appCreationService';

const Index = () => {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Array<{text: string, isUser: boolean, timestamp: Date}>>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [understandLevel, setUnderstandLevel] = useState('');
  const [currentResponse, setCurrentResponse] = useState('');
  const [systemStatus, setSystemStatus] = useState('START');
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const lastProcessedCommand = useRef<string>('');
  const apiCallTimeout = useRef<NodeJS.Timeout | null>(null);
  const isSpeakingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  
  const { 
    transcript, 
    isListening: speechListening, 
    startListening, 
    stopListening,
    resetTranscript 
  } = useSpeechRecognition();
  
  const { 
    speak, 
    stop: stopSpeaking, 
    isSpeaking: textToSpeechActive,
    voices,
    currentVoice,
    setVoice
  } = useEnhancedTextToSpeech();

  const {
    addJokeToMemory,
    hasRecentlyToldJoke,
    addToHistory,
    getRecentContext
  } = useConversationContext();

  const {
    isBackgroundListening,
    enableBackgroundListening,
    disableBackgroundListening
  } = useBackgroundVoice();

  // Add mobile detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setIsListening(speechListening);
    if (speechListening) {
      setSystemStatus('LISTENING');
    } else if (isSpeaking) {
      setSystemStatus('RESPONDING');
    } else if (isProcessing) {
      setSystemStatus('PROCESSING');
    } else {
      setSystemStatus('READY');
    }
  }, [speechListening, isSpeaking, isProcessing]);

  useEffect(() => {
    setIsSpeaking(textToSpeechActive);
    
    // When JARVIS starts speaking, temporarily pause listening to prevent self-listening
    if (textToSpeechActive) {
      console.log('JARVIS started speaking - pausing listening');
      stopListening();
      
      // Clear any existing timeout
      if (isSpeakingTimeoutRef.current) {
        clearTimeout(isSpeakingTimeoutRef.current);
      }
      
      // Resume listening after speaking ends with a small delay
      isSpeakingTimeoutRef.current = setTimeout(() => {
        if (isActive && !textToSpeechActive) {
          console.log('JARVIS finished speaking - resuming listening');
          startListening();
        }
      }, 2000);
    }
  }, [textToSpeechActive, isActive]);

  useEffect(() => {
    if (transcript && transcript.trim() !== '' && !isProcessing && !isSpeaking) {
      const lowerTranscript = transcript.toLowerCase().trim();
      
      // Enhanced duplicate prevention
      if (lowerTranscript === lastProcessedCommand.current) {
        console.log('Duplicate command ignored:', lowerTranscript);
        resetTranscript();
        return;
      }
      
      // Enhanced noise filtering
      const noisePatterns = [
        /^(ah|oh|um|uh|hmm|er|eh|mm)$/i,
        /^[a-z]{1,2}$/i, // Single or double letters
        /^(.)\1+$/i, // Repeated characters
      ];
      
      if (lowerTranscript.length < 3 || noisePatterns.some(pattern => pattern.test(lowerTranscript))) {
        console.log('Background noise or filler word ignored:', lowerTranscript);
        resetTranscript();
        return;
      }
      
      setCurrentCommand(transcript);
      lastProcessedCommand.current = lowerTranscript;
      
      // Enhanced wake word detection with better command parsing
      if (lowerTranscript === 'jarvis' || lowerTranscript === 'jarvis.') {
        setUnderstandLevel('Wake word detected');
        handleWakeWord();
      } else if (lowerTranscript.includes('jarvis') && lowerTranscript.length > 6) {
        // Extract command after "jarvis"
        const commandAfterJarvis = lowerTranscript.replace(/.*jarvis,?\s*/i, '').trim();
        if (commandAfterJarvis.length > 2) {
          setUnderstandLevel('Processing command...');
          handleUserMessage(commandAfterJarvis);
        } else {
          setUnderstandLevel('Wake word detected');
          handleWakeWord();
        }
      } else if (lowerTranscript.length >= 5) {
        // Direct command without wake word
        setUnderstandLevel('Processing command...');
        handleUserMessage(transcript);
      } else {
        console.log('Command too short or unclear, ignoring:', lowerTranscript);
      }
      resetTranscript();
    }
  }, [transcript, isProcessing, isSpeaking]);

  const handleSearchCommand = async (query: string): Promise<string> => {
    try {
      const results = await searchService.searchWeb(query);
      
      if (results.length > 0) {
        // Open the first result
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
      // Create a preview of the app concept
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

  const handleWakeWord = async () => {
    const wakeResponses = [
      "Yes sir, how may I assist you today?",
      "At your service, sir. I was created by Daniyal Bin Mushtaq.",
      "Standing by, sir. What can I do for you?",
      "Ready to assist, sir.",
      "Yes sir, I'm here and ready.",
      "How can I help you today, sir?"
    ];
    
    const response = wakeResponses[Math.floor(Math.random() * wakeResponses.length)];
    setCurrentResponse(response);
    const aiMessage = { text: response, isUser: false, timestamp: new Date() };
    setMessages(prev => [...prev, aiMessage]);
    
    // Pause listening before speaking
    stopListening();
    await speak(response);
  };

  const handleMobileCommands = async (message: string): Promise<string | null> => {
    const lowerMessage = message.toLowerCase();
    
    // Search commands
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
    
    // App creation commands
    if (lowerMessage.includes('make app') || lowerMessage.includes('create app') || lowerMessage.includes('build app')) {
      return await handleAppCreationCommand(message);
    }
    
    // App opening commands
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
    
    // Email writing commands
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
    
    // App creation commands
    if (lowerMessage.includes('make app') || lowerMessage.includes('create app') || lowerMessage.includes('build app')) {
      const appType = lowerMessage.match(/make.*app|create.*app|build.*app/i)?.[0] || 'app';
      return `I understand you want me to create an app, sir. While I can't directly create apps like Lovable does, I can help you plan the structure, suggest features, and guide you through the development process. What kind of app did you have in mind? A web app, mobile app, or something specific like a todo app, weather app, or social media app?`;
    }
    
    // System settings commands (simulated responses since we can't actually control device settings)
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
    
    // Creator information
    if (lowerMessage.includes('who made you') || lowerMessage.includes('who created you') || lowerMessage.includes('your creator')) {
      return "I am JARVIS, created by Daniyal Bin Mushtaq, sir. I am an advanced AI assistant designed to help you with various tasks.";
    }
    
    // Handle abuse with frank responses
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
      
      // Try to get a joke we haven't told recently
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

  const handleUserMessage = async (message: string) => {
    if (isProcessing || isSpeaking) {
      console.log('Already processing or speaking, ignoring:', message);
      return;
    }
    
    setIsProcessing(true);
    const userMessage = { text: message, isUser: true, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setSystemStatus('PROCESSING');
    
    // Clear any existing API timeout
    if (apiCallTimeout.current) {
      clearTimeout(apiCallTimeout.current);
    }
    
    try {
      let response: string;
      
      // Check if it's a joke request
      if (message.toLowerCase().includes('joke') || message.toLowerCase().includes('tell me something funny')) {
        response = await handleJokeRequest();
      } else {
        // Check for mobile commands first
        response = await handleMobileCommands(message) || 
                  handlePersonalityResponses(message) || 
                  await getAIResponse(message);
      }
      
      setUnderstandLevel('Command understood');
      setCurrentResponse(response);
      const aiMessage = { text: response, isUser: false, timestamp: new Date() };
      setMessages(prev => [...prev, aiMessage]);
      
      // Pause listening before speaking
      stopListening();
      await speak(response);
    } catch (error) {
      console.error('Error processing message:', error);
      setUnderstandLevel('Error processing');
      const errorResponse = 'System error occurred, sir. Please try again.';
      setCurrentResponse(errorResponse);
      toast({
        title: "Error",
        description: "Failed to process your request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getAIResponse = async (message: string): Promise<string> => {
    const API_KEY = "AIzaSyDz-Kn2L-hBa7Bi6mfIQXVI8Rjqgaq4igI";
    
    // Get recent conversation context
    const recentContext = getRecentContext('general');
    const contextString = recentContext.length > 0 
      ? `Previous context: ${recentContext.map(c => c.context).join(', ')}. ` 
      : '';
    
    try {
      // Add timeout to prevent rate limiting loops
      const controller = new AbortController();
      apiCallTimeout.current = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
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

      if (apiCallTimeout.current) {
        clearTimeout(apiCallTimeout.current);
      }

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

  const toggleListening = () => {
    if (isSpeaking) {
      console.log('Cannot toggle listening while speaking');
      return;
    }
    
    if (isListening) {
      stopListening();
      setSystemStatus('READY');
    } else {
      startListening();
      setSystemStatus('LISTENING');
    }
  };

  const toggleSpeaking = () => {
    if (isSpeaking) {
      stopSpeaking();
      // Resume listening after stopping speech
      setTimeout(() => {
        if (isActive && !isProcessing) {
          startListening();
        }
      }, 500);
    }
  };

  const activateJarvis = async () => {
    setIsActive(true);
    setSystemStatus('ONLINE');
    
    // Enable background listening for mobile
    if (isMobile) {
      await enableBackgroundListening();
    }
    
    const activationMessage = "Good day, sir. JARVIS is now online and ready to assist you. I was created by Daniyal Bin Mushtaq. Background listening is now active.";
    await speak(activationMessage);
    
    // Start listening after activation message
    setTimeout(() => {
      startListening();
    }, 3000);
    
    toast({
      title: "JARVIS Activated",
      description: "AI Assistant is now online with background listening enabled.",
    });
  };

  const deactivateJarvis = async () => {
    setIsActive(false);
    stopListening();
    stopSpeaking();
    setIsProcessing(false);
    lastProcessedCommand.current = '';
    
    if (apiCallTimeout.current) {
      clearTimeout(apiCallTimeout.current);
    }
    
    // Disable background listening
    if (isBackgroundListening) {
      await disableBackgroundListening();
    }
    
    setSystemStatus('OFFLINE');
    speak("Powering down background systems. Until next time, sir.");
    setTimeout(() => {
      setMessages([]);
      setCurrentCommand('');
      setUnderstandLevel('');
      setCurrentResponse('');
    }, 2000);
  };

  if (!isActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className={`font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent ${isMobile ? 'text-4xl' : 'text-6xl md:text-8xl'}`}>
              JARVIS
            </h1>
            <p className={`text-blue-200 opacity-80 ${isMobile ? 'text-lg' : 'text-xl md:text-2xl'}`}>
              Just A Rather Very Intelligent System
            </p>
            <p className="text-green-400 text-sm">
              Created by Daniyal Bin Mushtaq
            </p>
            {currentVoice && (
              <p className="text-cyan-400 text-sm">
                Voice: {currentVoice.name} ({currentVoice.quality})
              </p>
            )}
            {isMobile && (
              <p className="text-green-400 text-sm flex items-center justify-center gap-2">
                <Headphones className="h-4 w-4" />
                Background voice activation ready
              </p>
            )}
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
            <Button
              onClick={activateJarvis}
              className={`relative bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-full font-semibold shadow-2xl transform hover:scale-105 transition-all duration-300 ${
                isMobile ? 'px-8 py-4 text-lg' : 'px-12 py-6 text-xl'
              }`}
            >
              <Power className={`mr-3 ${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} />
              Activate JARVIS
            </Button>
          </div>
          
          <Button
            onClick={() => setShowVoiceSettings(true)}
            variant="outline"
            className="border-cyan-400 text-cyan-300 hover:bg-cyan-900/50"
          >
            <Settings className="mr-2 h-4 w-4" />
            Voice Settings
          </Button>
        </div>
        
        <VoiceSettings
          voices={voices}
          currentVoice={currentVoice}
          onVoiceChange={setVoice}
          isOpen={showVoiceSettings}
          onClose={() => setShowVoiceSettings(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 relative overflow-hidden">
      {/* Background pattern - simplified for mobile */}
      {!isMobile && (
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="grid grid-cols-20 gap-1">
              {[...Array(400)].map((_, i) => (
                <div key={i} className="w-2 h-2 bg-cyan-400 rounded-sm opacity-30"></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <h1 className={`font-bold text-cyan-300 ${isMobile ? 'text-xl' : 'text-2xl md:text-3xl'}`}>JARVIS</h1>
          <span className="text-sm text-cyan-400 opacity-80">Online</span>
          {currentVoice && (
            <span className="text-xs text-cyan-500 opacity-60">
              {currentVoice.name.split(' ')[0]}
            </span>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Button
            onClick={() => setShowVoiceSettings(true)}
            variant="ghost"
            size="icon"
            className="text-cyan-300 hover:text-cyan-100 hover:bg-cyan-900/50"
          >
            <Settings className="h-5 w-5" />
          </Button>
          <Button
            onClick={deactivateJarvis}
            variant="ghost"
            size="icon"
            className="text-red-400 hover:text-red-300 hover:bg-red-900/50"
          >
            <Power className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* System Information */}
      <div className="relative z-10 max-w-6xl mx-auto mb-8">
        <div className={`grid gap-4 text-cyan-300 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
          <div>
            <div className="text-sm opacity-70">command :</div>
            <div className={`${isMobile ? 'text-base' : 'text-lg'}`}>{currentCommand || 'Awaiting input...'}</div>
          </div>
          <div>
            <div className="text-sm opacity-70">understand level :</div>
            <div className={`${isMobile ? 'text-base' : 'text-lg'}`}>{understandLevel || 'Ready'}</div>
          </div>
          <div>
            <div className="text-sm opacity-70">response :</div>
            <div className={`${isMobile ? 'text-base' : 'text-lg'}`}>{currentResponse || 'Standby'}</div>
          </div>
        </div>
        
        {/* Background listening status */}
        {isBackgroundListening && (
          <div className="mt-4 flex items-center justify-center gap-2 text-green-400 text-sm">
            <Headphones className="h-4 w-4 animate-pulse" />
            Background voice detection active
          </div>
        )}
      </div>

      {/* Central Interface */}
      <div className="relative z-10 flex flex-col items-center justify-center mt-16">
        {/* Main circular interface */}
        <div className="relative">
          {/* Outer rings - smaller on mobile */}
          <div className={`absolute inset-0 border-4 border-cyan-400 rounded-full opacity-30 animate-spin ${isMobile ? 'w-64 h-64' : 'w-80 h-80'}`} style={{animationDuration: '20s'}}></div>
          <div className={`absolute inset-4 border-2 border-cyan-300 rounded-full opacity-40 animate-spin ${isMobile ? 'w-56 h-56' : 'w-72 h-72'}`} style={{animationDuration: '15s', animationDirection: 'reverse'}}></div>
          
          {/* Inner circle segments */}
          <div className={`absolute inset-8 rounded-full border-4 border-transparent ${isMobile ? 'w-48 h-48' : 'w-64 h-64'}`}>
            {[...Array(24)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-1 bg-cyan-400 rounded-full transform origin-bottom ${
                  isListening ? 'opacity-100' : 'opacity-30'
                } ${isMobile ? 'h-4' : 'h-6'}`}
                style={{
                  left: '50%',
                  bottom: '50%',
                  transform: `translateX(-50%) rotate(${i * 15}deg) translateY(${isMobile ? '-96px' : '-120px'})`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
          
          {/* Center button */}
          <div className={`relative flex items-center justify-center ${isMobile ? 'w-64 h-64' : 'w-80 h-80'}`}>
            <Button
              onClick={toggleListening}
              disabled={isSpeaking}
              className={`rounded-full font-bold transition-all duration-300 ${
                isMobile ? 'w-24 h-24 text-lg' : 'w-32 h-32 text-xl'
              } ${
                isSpeaking
                  ? 'bg-red-600 hover:bg-red-500 shadow-red-500/50 animate-pulse cursor-not-allowed'
                  : isListening 
                  ? 'bg-green-600 hover:bg-green-500 shadow-green-500/50 animate-pulse' 
                  : systemStatus === 'PROCESSING'
                  ? 'bg-yellow-600 hover:bg-yellow-500 shadow-yellow-500/50'
                  : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-500/50'
              } shadow-2xl border-4 border-cyan-300`}
            >
              {isSpeaking ? 'SPEAKING' :
               systemStatus === 'PROCESSING' ? 'PROCESSING' : 
               isListening ? 'LISTENING' : 
               systemStatus}
            </Button>
          </div>
          
          {/* Center dot indicator */}
          <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${
            isSpeaking ? 'bg-red-400' : isListening ? 'bg-green-400' : 'bg-cyan-400'
          } z-10`}></div>
        </div>
        
        {/* Voice prompt */}
        {!isListening && !isSpeaking && systemStatus === 'READY' && (
          <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3">
            <span className={`text-cyan-200 ${isMobile ? 'text-base' : 'text-lg'}`}>Say "Jarvis"</span>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="relative z-10 fixed bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="flex space-x-4">
          <Button
            onClick={toggleSpeaking}
            disabled={!isSpeaking}
            className="w-12 h-12 rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 border-2 border-cyan-400"
          >
            {isSpeaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
