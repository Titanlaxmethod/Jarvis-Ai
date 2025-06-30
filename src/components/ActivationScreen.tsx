
import React from 'react';
import { Power, Settings, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActivationScreenProps {
  isMobile: boolean;
  currentVoice: any;
  onActivate: () => void;
  onShowSettings: () => void;
}

const ActivationScreen: React.FC<ActivationScreenProps> = ({
  isMobile,
  currentVoice,
  onActivate,
  onShowSettings
}) => {
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
            onClick={onActivate}
            className={`relative bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-full font-semibold shadow-2xl transform hover:scale-105 transition-all duration-300 ${
              isMobile ? 'px-8 py-4 text-lg' : 'px-12 py-6 text-xl'
            }`}
          >
            <Power className={`mr-3 ${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} />
            Activate JARVIS
          </Button>
        </div>
        
        <Button
          onClick={onShowSettings}
          variant="outline"
          className="border-cyan-400 text-cyan-300 hover:bg-cyan-900/50"
        >
          <Settings className="mr-2 h-4 w-4" />
          Voice Settings
        </Button>
      </div>
    </div>
  );
};

export default ActivationScreen;
