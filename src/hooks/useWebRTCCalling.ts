import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CallState {
  isInCall: boolean;
  isConnecting: boolean;
  remoteUserId: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}

export const useWebRTCCalling = () => {
  const [callState, setCallState] = useState<CallState>({
    isInCall: false,
    isConnecting: false,
    remoteUserId: null,
    localStream: null,
    remoteStream: null,
  });

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const channelRef = useRef<any>(null);

  // WebRTC configuration (using free STUN servers)
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' }, // Free Google STUN
      { urls: 'stun:stun1.l.google.com:19302' }, // Free Google STUN
    ],
  };

  const initializePeerConnection = useCallback(() => {
    peerConnection.current = new RTCPeerConnection(rtcConfig);

    // Handle remote stream
    peerConnection.current.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setCallState(prev => ({ ...prev, remoteStream }));
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    // Handle ICE candidates
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: { candidate: event.candidate }
        });
      }
    };

    // Handle connection state
    peerConnection.current.onconnectionstatechange = () => {
      const state = peerConnection.current?.connectionState;
      if (state === 'connected') {
        setCallState(prev => ({ ...prev, isConnecting: false, isInCall: true }));
      } else if (state === 'disconnected' || state === 'failed') {
        endCall();
      }
    };
  }, []);

  const startCall = useCallback(async (targetUserId: string) => {
    try {
      setCallState(prev => ({ ...prev, isConnecting: true, remoteUserId: targetUserId }));

      // Get user media (audio/video)
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      });

      setCallState(prev => ({ ...prev, localStream }));

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }

      // Initialize peer connection
      initializePeerConnection();

      // Add local stream to peer connection
      localStream.getTracks().forEach(track => {
        peerConnection.current?.addTrack(track, localStream);
      });

      // Create and join signaling channel
      const callId = `call_${Date.now()}`;
      channelRef.current = supabase.channel(callId);

      // Listen for signaling messages
      channelRef.current
        .on('broadcast', { event: 'offer' }, async ({ payload }: any) => {
          if (peerConnection.current) {
            await peerConnection.current.setRemoteDescription(payload.offer);
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);
            
            channelRef.current.send({
              type: 'broadcast',
              event: 'answer',
              payload: { answer }
            });
          }
        })
        .on('broadcast', { event: 'answer' }, async ({ payload }: any) => {
          if (peerConnection.current) {
            await peerConnection.current.setRemoteDescription(payload.answer);
          }
        })
        .on('broadcast', { event: 'ice-candidate' }, async ({ payload }: any) => {
          if (peerConnection.current) {
            await peerConnection.current.addIceCandidate(payload.candidate);
          }
        })
        .subscribe();

      // Create and send offer
      const offer = await peerConnection.current!.createOffer();
      await peerConnection.current!.setLocalDescription(offer);

      channelRef.current.send({
        type: 'broadcast',
        event: 'offer',
        payload: { offer, callerId: 'jarvis-user' }
      });

    } catch (error) {
      console.error('Error starting call:', error);
      setCallState({
        isInCall: false,
        isConnecting: false,
        remoteUserId: null,
        localStream: null,
        remoteStream: null,
      });
    }
  }, [initializePeerConnection]);

  const endCall = useCallback(() => {
    // Stop all tracks
    callState.localStream?.getTracks().forEach(track => track.stop());
    callState.remoteStream?.getTracks().forEach(track => track.stop());

    // Close peer connection
    peerConnection.current?.close();
    peerConnection.current = null;

    // Unsubscribe from channel
    channelRef.current?.unsubscribe();
    channelRef.current = null;

    // Reset state
    setCallState({
      isInCall: false,
      isConnecting: false,
      remoteUserId: null,
      localStream: null,
      remoteStream: null,
    });
  }, [callState.localStream, callState.remoteStream]);

  const makePhoneCall = useCallback(async (phoneNumber: string, message: string) => {
    // For demo purposes, simulate a call
    return `Starting WebRTC call simulation to ${phoneNumber}. Message: "${message}". 

In a real implementation, this would:
1. Look up the phone number in your user database
2. Find their WebRTC ID/username
3. Initiate a peer-to-peer connection
4. Play the message through WebRTC

This is completely FREE - no API costs!`;
  }, []);

  return {
    callState,
    startCall,
    endCall,
    makePhoneCall,
    localVideoRef,
    remoteVideoRef,
  };
};