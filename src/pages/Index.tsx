import React, { useEffect } from 'react';
import { Power, Settings, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VoiceSettings from '@/components/VoiceSettings';
import CallInterface from '@/components/CallInterface';
import ActivationScreen from '@/components/ActivationScreen';
import MainInterface from '@/components/MainInterface';
import { useJarvisState } from '@/hooks/useJarvisState';
import { useCommandHandlers } from '@/hooks/useCommandHandlers';

const Index = () => {
  const {
    isActive,
    isListening,
    isSpeaking,
    messages,
    currentCommand,
    understandLevel,
    currentResponse,
    systemStatus,
    showVoiceSettings,
    isProcessing,
    showCallInterface,
    isMobile,
    transcript,
    voices,
    currentVoice,
    isBackgroundListening,
    lastProcessedCommand,
    apiCallTimeout,
    setMessages,
    setCurrentCommand,
    setUnderstandLevel,
    setCurrentResponse,
    setSystemStatus,
    setShowVoiceSettings,
    setIsProcessing,
    setShowCallInterface,
    speak,
    stopListening,
    resetTranscript,
    setVoice,
    toggleListening,
    toggleSpeaking,
    activateJarvis,
    deactivateJarvis,
    toast
  } = useJarvisState();

  const {
    handleJokeRequest,
    handleAICallingCommands,
    handleMobileCommands,
    handlePersonalityResponses,
    getAIResponse
  } = useCommandHandlers();

  // Command processing with improved calling detection
  useEffect(() => {
    if (transcript && transcript.trim() !== '' && !isProcessing && !isSpeaking) {
      const lowerTranscript = transcript.toLowerCase().trim();
      
      if (lowerTranscript === lastProcessedCommand.current) {
        console.log('Duplicate command ignored:', lowerTranscript);
        resetTranscript();
        return;
      }
      
      // Check if it's a calling command - these should be processed even with lower confidence
      const callingKeywords = ['call', 'phone', 'dial', 'ring', 'emergency', '911'];
      const phoneNumberPattern = /[\d\s\-\(\)]{8,}/;
      const isCallingCommand = callingKeywords.some(keyword => lowerTranscript.includes(keyword)) || 
                              phoneNumberPattern.test(lowerTranscript);
      
      // For calling commands, be more lenient with processing
      if (isCallingCommand) {
        console.log('Calling command detected, processing:', transcript);
        setCurrentCommand(transcript);
        lastProcessedCommand.current = lowerTranscript;
        setUnderstandLevel('Processing call command...');
        handleUserMessage(transcript);
        resetTranscript();
        return;
      }
      
      // Regular noise filtering for non-calling commands
      const noisePatterns = [
        /^(ah|oh|um|uh|hmm|er|eh|mm)$/i,
        /^[a-z]{1,2}$/i,
        /^(.)\1+$/i,
      ];
      
      if (lowerTranscript.length < 3 || noisePatterns.some(pattern => pattern.test(lowerTranscript))) {
        console.log('Background noise or filler word ignored:', lowerTranscript);
        resetTranscript();
        return;
      }
      
      setCurrentCommand(transcript);
      lastProcessedCommand.current = lowerTranscript;
      
      if (lowerTranscript === 'jarvis' || lowerTranscript === 'jarvis.') {
        setUnderstandLevel('Wake word detected');
        handleWakeWord();
      } else if (lowerTranscript.includes('jarvis') && lowerTranscript.length > 6) {
        const commandAfterJarvis = lowerTranscript.replace(/.*jarvis,?\s*/i, '').trim();
        if (commandAfterJarvis.length > 2) {
          setUnderstandLevel('Processing command...');
          handleUserMessage(commandAfterJarvis);
        } else {
          setUnderstandLevel('Wake word detected');
          handleWakeWord();
        }
      } else if (lowerTranscript.length >= 5) {
        setUnderstandLevel('Processing command...');
        handleUserMessage(transcript);
      } else {
        console.log('Command too short or unclear, ignoring:', lowerTranscript);
      }
      resetTranscript();
    }
  }, [transcript, isProcessing, isSpeaking]);

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
    
    stopListening();
    await speak(response);
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
    
    if (apiCallTimeout.current) {
      clearTimeout(apiCallTimeout.current);
    }
    
    try {
      let response: string;
      
      console.log('Handling user message:', message);
      
      // Check for calling commands first - highest priority
      const callingResponse = await handleAICallingCommands(message);
      if (callingResponse) {
        console.log('Calling command handled:', callingResponse);
        setShowCallInterface(true);
        response = callingResponse;
      } else if (message.toLowerCase().includes('joke') || message.toLowerCase().includes('tell me something funny')) {
        response = await handleJokeRequest();
      } else {
        response = await handleMobileCommands(message) || 
                  handlePersonalityResponses(message) || 
                  await getAIResponse(message);
      }
      
      setUnderstandLevel('Command understood');
      setCurrentResponse(response);
      const aiMessage = { text: response, isUser: false, timestamp: new Date() };
      setMessages(prev => [...prev, aiMessage]);
      
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

  if (!isActive) {
    return (
      <>
        <ActivationScreen
          isMobile={isMobile}
          currentVoice={currentVoice}
          onActivate={activateJarvis}
          onShowSettings={() => setShowVoiceSettings(true)}
        />
        
        <VoiceSettings
          voices={voices}
          currentVoice={currentVoice}
          onVoiceChange={setVoice}
          isOpen={showVoiceSettings}
          onClose={() => setShowVoiceSettings(false)}
        />
      </>
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
        
        {isBackgroundListening && (
          <div className="mt-4 flex items-center justify-center gap-2 text-green-400 text-sm">
            <Headphones className="h-4 w-4 animate-pulse" />
            Background voice detection active
          </div>
        )}
      </div>

      <MainInterface
        systemStatus={systemStatus}
        isListening={isListening}
        isSpeaking={isSpeaking}
        isProcessing={isProcessing}
        isMobile={isMobile}
        onToggleListening={toggleListening}
        onToggleSpeaking={toggleSpeaking}
      />

      <CallInterface isVisible={showCallInterface} />
      
      <VoiceSettings
        voices={voices}
        currentVoice={currentVoice}
        onVoiceChange={setVoice}
        isOpen={showVoiceSettings}
        onClose={() => setShowVoiceSettings(false)}
      />
    </div>
  );
};

export default Index;
