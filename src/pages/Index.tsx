
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Power, Settings } from 'lucide-react';
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
  }, [speechListening]);

  useEffect(() => {
    setIsSpeaking(textToSpeechActive);
  }, [textToSpeechActive]);

  useEffect(() => {
    if (transcript && transcript.trim() !== '') {
      const lowerTranscript = transcript.toLowerCase().trim();
      
      // Check if it's just the wake word "Jarvis"
      if (lowerTranscript === 'jarvis' || lowerTranscript === 'hey jarvis') {
        handleWakeWord();
      } else {
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
      "Yes sir, I'm here."
    ];
    
    const response = wakeResponses[Math.floor(Math.random() * wakeResponses.length)];
    const aiMessage = { text: response, isUser: false, timestamp: new Date() };
    setMessages(prev => [...prev, aiMessage]);
    
    // Speak the wake response
    await speak(response);
  };

  const handleUserMessage = async (message: string) => {
    const userMessage = { text: message, isUser: true, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    
    try {
      const response = await getAIResponse(message);
      const aiMessage = { text: response, isUser: false, timestamp: new Date() };
      setMessages(prev => [...prev, aiMessage]);
      
      // Speak the response
      await speak(response);
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
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
              text: `You are JARVIS, Tony Stark's AI assistant. Respond in character as JARVIS - be helpful, sophisticated, and occasionally witty. Keep responses concise and natural for voice interaction. User message: ${message}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
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
      // Fallback to JARVIS-style responses
      const fallbackResponses = [
        "My apologies, sir. I'm experiencing some technical difficulties. Please try again.",
        "I'm having trouble accessing my neural networks at the moment. Give me a moment.",
        "Sir, there seems to be an issue with my cognitive processors. Please rephrase your request.",
      ];
      return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const toggleSpeaking = () => {
    if (isSpeaking) {
      stopSpeaking();
    }
  };

  const activateJarvis = () => {
    setIsActive(true);
    speak("Good day, sir. Jarvis is now online and ready to assist you.");
    toast({
      title: "JARVIS Activated",
      description: "AI Assistant is now online and ready to help.",
    });
  };

  const deactivateJarvis = () => {
    setIsActive(false);
    stopListening();
    stopSpeaking();
    speak("Powering down. Until next time, sir.");
    setTimeout(() => {
      setMessages([]);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <h1 className="text-2xl md:text-3xl font-bold text-blue-300">JARVIS</h1>
          <span className="text-sm text-blue-400 opacity-80">Online</span>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-blue-300 hover:text-blue-100 hover:bg-blue-900/50"
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

      {/* Main Interface */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Voice Interface */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-blue-800/50 p-6">
          <div className="text-center space-y-6">
            <h2 className="text-xl font-semibold text-blue-300 mb-4">Voice Interface</h2>
            
            {/* Voice Visualizer */}
            <div className="flex justify-center">
              <VoiceVisualizer isActive={isListening || isSpeaking} />
            </div>
            
            {/* Status */}
            <div className="text-center">
              {isListening && (
                <p className="text-green-400 animate-pulse">Listening...</p>
              )}
              {isSpeaking && (
                <p className="text-blue-400 animate-pulse">Speaking...</p>
              )}
              {!isListening && !isSpeaking && (
                <p className="text-slate-400">Ready</p>
              )}
            </div>
            
            {/* Controls */}
            <div className="flex justify-center space-x-4">
              <Button
                onClick={toggleListening}
                className={`rounded-full p-4 transition-all duration-300 ${
                  isListening 
                    ? 'bg-red-600 hover:bg-red-500 shadow-red-500/50' 
                    : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/50'
                } shadow-lg`}
              >
                {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </Button>
              
              <Button
                onClick={toggleSpeaking}
                disabled={!isSpeaking}
                className="rounded-full p-4 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 shadow-lg transition-all duration-300"
              >
                {isSpeaking ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </Card>

        {/* Chat Interface */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-blue-800/50 p-6">
          <ChatInterface 
            messages={messages} 
            onSendMessage={handleUserMessage}
          />
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="max-w-4xl mx-auto mt-6">
        <Card className="bg-slate-800/50 backdrop-blur-sm border-blue-800/50 p-4">
          <h3 className="text-lg font-semibold text-blue-300 mb-3">Quick Commands</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              "What's the weather?",
              "Tell me a joke",
              "What time is it?",
              "How are you today?"
            ].map((command, index) => (
              <Button
                key={index}
                onClick={() => handleUserMessage(command)}
                variant="outline"
                className="text-sm border-blue-700 text-blue-300 hover:bg-blue-900/50"
              >
                {command}
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Index;
