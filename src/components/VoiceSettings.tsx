
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Volume2, VolumeX } from 'lucide-react';

interface Voice {
  name: string;
  lang: string;
  gender: 'male' | 'female';
  quality: 'high' | 'medium' | 'low';
}

interface VoiceSettingsProps {
  voices: Voice[];
  currentVoice: Voice | null;
  onVoiceChange: (voice: Voice) => void;
  isOpen: boolean;
  onClose: () => void;
}

const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  voices,
  currentVoice,
  onVoiceChange,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const maleVoices = voices.filter(v => v.gender === 'male');
  const femaleVoices = voices.filter(v => v.gender === 'female');

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'high': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-slate-800 border-cyan-400 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-cyan-300">Voice Settings</h2>
            <Button onClick={onClose} variant="ghost" className="text-cyan-300">
              ×
            </Button>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-cyan-300 mb-3 flex items-center">
                <Volume2 className="mr-2 h-5 w-5" />
                Male Voices
              </h3>
              <div className="grid gap-2">
                {maleVoices.map((voice, index) => (
                  <Button
                    key={index}
                    onClick={() => onVoiceChange(voice)}
                    variant={currentVoice?.name === voice.name ? "default" : "outline"}
                    className={`justify-start text-left h-auto p-3 ${
                      currentVoice?.name === voice.name 
                        ? "bg-cyan-600 border-cyan-400" 
                        : "bg-slate-700 border-slate-600 hover:bg-slate-600"
                    }`}
                  >
                    <div>
                      <div className="font-medium text-white">{voice.name}</div>
                      <div className="text-sm opacity-70">
                        <span className={getQualityColor(voice.quality)}>
                          {voice.quality.toUpperCase()}
                        </span>
                        {' • '}{voice.lang}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-cyan-300 mb-3 flex items-center">
                <VolumeX className="mr-2 h-5 w-5" />
                Female Voices
              </h3>
              <div className="grid gap-2">
                {femaleVoices.map((voice, index) => (
                  <Button
                    key={index}
                    onClick={() => onVoiceChange(voice)}
                    variant={currentVoice?.name === voice.name ? "default" : "outline"}
                    className={`justify-start text-left h-auto p-3 ${
                      currentVoice?.name === voice.name 
                        ? "bg-cyan-600 border-cyan-400" 
                        : "bg-slate-700 border-slate-600 hover:bg-slate-600"
                    }`}
                  >
                    <div>
                      <div className="font-medium text-white">{voice.name}</div>
                      <div className="text-sm opacity-70">
                        <span className={getQualityColor(voice.quality)}>
                          {voice.quality.toUpperCase()}
                        </span>
                        {' • '}{voice.lang}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default VoiceSettings;
