
import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MainInterfaceProps {
  systemStatus: string;
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  isMobile: boolean;
  onToggleListening: () => void;
  onToggleSpeaking: () => void;
}

const MainInterface: React.FC<MainInterfaceProps> = ({
  systemStatus,
  isListening,
  isSpeaking,
  isProcessing,
  isMobile,
  onToggleListening,
  onToggleSpeaking
}) => {
  return (
    <>
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
              onClick={onToggleListening}
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
            onClick={onToggleSpeaking}
            disabled={!isSpeaking}
            className="w-12 h-12 rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 border-2 border-cyan-400"
          >
            {isSpeaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </>
  );
};

export default MainInterface;
