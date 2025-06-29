
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Power, Settings, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import VoiceVisualizer from '@/components/VoiceVisualizer';
import ChatInterface from '@/components/ChatInterface';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

const Index = () => {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Array<{text: string, isUser: boolean, timestamp: Date}>>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [understandLevel, setUnderstandLevel] = useState('');
  const [currentResponse, setCurrentResponse] = useState('');
  const [systemStatus, setSystemStatus] = useState('START');
  const [showChat, setShowChat] = useState(false);
  const { toast } = useToast();
  
  const { 
    transcript, 
    isListening: speechListening, 
    startListening, 
    stopListening,
    resetTranscript 
  } = useSpeechRecognition();
  
  const { speak, stop: stopSpeaking, isSpeaking: textToSpeechActive } = useTextToSpeech();

  useEffect(() => {
    setIsListening(speechListening);
    if (speechListening) {
      setSystemStatus('LISTENING');
    } else if (isSpeaking) {
      setSystemStatus('RESPONDING');
    } else {
      setSystemStatus('READY');
    }
  }, [speechListening, isSpeaking]);

  useEffect(() => {
    setIsSpeaking(textToSpeechActive);
  }, [textToSpeechActive]);

  useEffect(() => {
    if (transcript && transcript.trim() !== '') {
      const lowerTranscript = transcript.toLowerCase().trim();
      setCurrentCommand(transcript);
      
      // Enhanced wake word detection
      if (lowerTranscript.includes('jarvis') && lowerTranscript.split(' ').length <= 3) {
        setUnderstandLevel('Wake word detected');
        handleWakeWord();
      } else {
        setUnderstandLevel('Processing command...');
        handleUserMessage(transcript);
      }
      resetTranscript();
    }
  }, [transcript]);

  const handleWakeWord = async () => {
    const wakeResponses = [
      "Yes sir, how may I assist you?",
      "At your service, sir.",
      "Standing by, sir. What can I do for you?",
      "Ready to assist, sir.",
      "Yes sir, I'm here.",
      "How can I help you today, sir?"
    ];
    
    const response = wakeResponses[Math.floor(Math.random() * wakeResponses.length)];
    setCurrentResponse(response);
    const aiMessage = { text: response, isUser: false, timestamp: new Date() };
    setMessages(prev => [...prev, aiMessage]);
    
    await speak(response);
  };

  const handleMobileCommands = async (message: string): Promise<string | null> => {
    const lowerMessage = message.toLowerCase();
    
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
      return "I am an AI Assistant created by Daniyal Bin Mushtaq, sir.";
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

  const handleUserMessage = async (message: string) => {
    const userMessage = { text: message, isUser: true, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setSystemStatus('PROCESSING');
    
    try {
      // Check for mobile commands first
      let response = await handleMobileCommands(message);
      
      // Check for personality responses
      if (!response) {
        response = handlePersonalityResponses(message);
      }
      
      // Get AI response if no special command matched
      if (!response) {
        response = await getAIResponse(message);
      }
      
      setUnderstandLevel('Command understood');
      setCurrentResponse(response);
      const aiMessage = { text: response, isUser: false, timestamp: new Date() };
      setMessages(prev => [...prev, aiMessage]);
      
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
    }
  };

  const getAIResponse = async (message: string): Promise<string> => {
    const API_KEY = "AIzaSyDz-Kn2L-hBa7Bi6mfIQXVI8Rjqgaq4igI";
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are JARVIS, an AI assistant created by Daniyal Bin Mushtaq. You are sophisticated, helpful, and occasionally witty like Grok AI. Be frank and direct when appropriate. Keep responses concise and natural for voice interaction. User message: ${message}`
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 200,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
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
    }
  };

  const toggleChat = () => {
    setShowChat(!showChat);
  };

  const activateJarvis = () => {
    setIsActive(true);
    setSystemStatus('ONLINE');
    speak("Good day, sir. JARVIS is now online and ready to assist you.");
    toast({
      title: "JARVIS Activated",
      description: "AI Assistant is now online and ready to help.",
    });
  };

  const deactivateJarvis = () => {
    setIsActive(false);
    stopListening();
    stopSpeaking();
    setSystemStatus('OFFLINE');
    speak("Powering down. Until next time, sir.");
    setTimeout(() => {
      setMessages([]);
      setCurrentCommand('');
      setUnderstandLevel('');
      setCurrentResponse('');
      setShowChat(false);
    }, 2000);
  };

  if (!isActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              JARVIS
            </h1>
            <p className="text-xl md:text-2xl text-blue-200 opacity-80">
              Just A Rather Very Intelligent System
            </p>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
            <Button
              onClick={activateJarvis}
              className="relative bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-12 py-6 rounded-full text-xl font-semibold shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              <Power className="mr-3 h-6 w-6" />
              Activate JARVIS
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="grid grid-cols-20 gap-1">
            {[...Array(400)].map((_, i) => (
              <div key={i} className="w-2 h-2 bg-cyan-400 rounded-sm opacity-30"></div>
            ))}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <h1 className="text-2xl md:text-3xl font-bold text-cyan-300">JARVIS</h1>
          <span className="text-sm text-cyan-400 opacity-80">Online</span>
        </div>
        
        <div className="flex space-x-2">
          <Button
            onClick={toggleChat}
            variant="ghost"
            size="icon"
            className="text-cyan-300 hover:text-cyan-100 hover:bg-cyan-900/50"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
          <Button
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-cyan-300">
          <div>
            <div className="text-sm opacity-70">command :</div>
            <div className="text-lg">{currentCommand || 'Awaiting input...'}</div>
          </div>
          <div>
            <div className="text-sm opacity-70">understand level :</div>
            <div className="text-lg">{understandLevel || 'Ready'}</div>
          </div>
          <div>
            <div className="text-sm opacity-70">response :</div>
            <div className="text-lg">{currentResponse || 'Standby'}</div>
          </div>
        </div>
      </div>

      {/* Central Interface */}
      <div className="relative z-10 flex flex-col items-center justify-center mt-16">
        {/* Main circular interface */}
        <div className="relative">
          {/* Outer rings */}
          <div className="absolute inset-0 w-80 h-80 border-4 border-cyan-400 rounded-full opacity-30 animate-spin" style={{animationDuration: '20s'}}></div>
          <div className="absolute inset-4 w-72 h-72 border-2 border-cyan-300 rounded-full opacity-40 animate-spin" style={{animationDuration: '15s', animationDirection: 'reverse'}}></div>
          
          {/* Inner circle segments */}
          <div className="absolute inset-8 w-64 h-64 rounded-full border-4 border-transparent">
            {[...Array(24)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-1 h-6 bg-cyan-400 rounded-full transform origin-bottom ${
                  isListening ? 'opacity-100' : 'opacity-30'
                }`}
                style={{
                  left: '50%',
                  bottom: '50%',
                  transform: `translateX(-50%) rotate(${i * 15}deg) translateY(-120px)`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
          
          {/* Center button */}
          <div className="relative w-80 h-80 flex items-center justify-center">
            <Button
              onClick={toggleListening}
              className={`w-32 h-32 rounded-full text-xl font-bold transition-all duration-300 ${
                isListening 
                  ? 'bg-green-600 hover:bg-green-500 shadow-green-500/50 animate-pulse' 
                  : systemStatus === 'PROCESSING'
                  ? 'bg-yellow-600 hover:bg-yellow-500 shadow-yellow-500/50'
                  : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-500/50'
              } shadow-2xl border-4 border-cyan-300`}
            >
              {systemStatus === 'PROCESSING' ? 'LOADING' : 
               isListening ? 'LISTENING' : 
               systemStatus}
            </Button>
          </div>
          
          {/* Center dot indicator */}
          <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${
            isListening ? 'bg-green-400' : 'bg-red-400'
          } z-10`}></div>
        </div>
        
        {/* Voice prompt */}
        {!isListening && systemStatus === 'READY' && (
          <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3">
            <span className="text-cyan-200 text-lg">Say "Jarvis"</span>
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

      {/* Chat Interface - Only shown when toggled */}
      {showChat && (
        <div className="absolute top-4 right-4 w-80 max-h-96 z-20">
          <Card className="bg-slate-800/80 backdrop-blur-sm border-cyan-800/50 p-4">
            <ChatInterface 
              messages={messages} 
              onSendMessage={handleUserMessage}
            />
          </Card>
        </div>
      )}
    </div>
  );
};

export default Index;
