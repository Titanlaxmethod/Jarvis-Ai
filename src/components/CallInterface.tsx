
import React, { useState, useEffect } from 'react';
import { Phone, PhoneCall, PhoneOff, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { aiCallingService } from '@/services/aiCallingService';

interface CallSession {
  id: string;
  contact: {
    name: string;
    phone: string;
  };
  status: 'dialing' | 'connected' | 'ended' | 'failed';
  startTime: Date;
  duration?: number;
}

interface CallInterfaceProps {
  isVisible: boolean;
}

const CallInterface: React.FC<CallInterfaceProps> = ({ isVisible }) => {
  const [activeCalls, setActiveCalls] = useState<CallSession[]>([]);
  const [callDurations, setCallDurations] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isVisible) return;

    const updateCalls = () => {
      const calls = aiCallingService.getActiveCalls();
      setActiveCalls(calls);
      
      // Update durations for active calls
      const newDurations: Record<string, number> = {};
      calls.forEach(call => {
        if (call.status === 'connected') {
          const duration = Math.floor((Date.now() - call.startTime.getTime()) / 1000);
          newDurations[call.id] = duration;
        }
      });
      setCallDurations(newDurations);
    };

    // Update immediately and then every second
    updateCalls();
    const interval = setInterval(updateCalls, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = async (callId: string) => {
    await aiCallingService.endCall(callId);
  };

  if (!isVisible || activeCalls.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2">
      {activeCalls.map(call => (
        <Card key={call.id} className="p-4 bg-slate-800/90 backdrop-blur-sm border-cyan-400/30 text-cyan-300 min-w-64">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {call.status === 'dialing' ? (
                <Phone className="h-5 w-5 animate-pulse text-yellow-400" />
              ) : call.status === 'connected' ? (
                <PhoneCall className="h-5 w-5 text-green-400" />
              ) : (
                <PhoneOff className="h-5 w-5 text-red-400" />
              )}
              
              <div>
                <div className="font-semibold">{call.contact.name}</div>
                <div className="text-sm opacity-70">{call.contact.phone}</div>
                <div className="text-xs">
                  {call.status === 'dialing' && 'Connecting...'}
                  {call.status === 'connected' && `Connected • ${formatDuration(callDurations[call.id] || 0)}`}
                  {call.status === 'ended' && 'Call Ended'}
                  {call.status === 'failed' && 'Call Failed'}
                </div>
              </div>
            </div>
            
            {call.status === 'connected' && (
              <Button
                onClick={() => handleEndCall(call.id)}
                size="sm"
                className="bg-red-600 hover:bg-red-500 text-white"
              >
                <PhoneOff className="h-4 w-4" />
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default CallInterface;
