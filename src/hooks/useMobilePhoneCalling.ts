import { useState, useCallback } from 'react';
import { Device } from '@capacitor/device';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

interface CallState {
  isInCall: boolean;
  isConnecting: boolean;
  targetNumber: string | null;
  message: string | null;
}

export const useMobilePhoneCalling = () => {
  const [callState, setCallState] = useState<CallState>({
    isInCall: false,
    isConnecting: false,
    targetNumber: null,
    message: null,
  });

  const makePhoneCall = useCallback(async (phoneNumber: string, message: string): Promise<string> => {
    try {
      setCallState({
        isInCall: false,
        isConnecting: true,
        targetNumber: phoneNumber,
        message: message,
      });

      // Check if we're running on a native platform
      if (Capacitor.isNativePlatform()) {
        // Get device info
        const deviceInfo = await Device.getInfo();
        
        if (deviceInfo.platform === 'ios' || deviceInfo.platform === 'android') {
          // For mobile devices, use the native phone dialer
          // This will open the phone app with the number pre-filled
          const telUrl = `tel:${phoneNumber}`;
          
          await Browser.open({
            url: telUrl,
            windowName: '_system'
          });

          setCallState({
            isInCall: true,
            isConnecting: false,
            targetNumber: phoneNumber,
            message: message,
          });

          return `Initiating call to ${phoneNumber} on your mobile device, sir. Please deliver this message: "${message}"`;
        }
      }

      // Fallback for web or unsupported platforms
      setCallState({
        isInCall: false,
        isConnecting: false,
        targetNumber: null,
        message: null,
      });

      return `I can make actual phone calls when running as a mobile app, sir. Currently running on web - would you like me to prepare the number ${phoneNumber} for you to call manually? Message: "${message}"`;

    } catch (error) {
      console.error('Error making phone call:', error);
      
      setCallState({
        isInCall: false,
        isConnecting: false,
        targetNumber: null,
        message: null,
      });

      return `I encountered an error while trying to make the call, sir. Please try calling ${phoneNumber} manually with this message: "${message}"`;
    }
  }, []);

  const endCall = useCallback(() => {
    setCallState({
      isInCall: false,
      isConnecting: false,
      targetNumber: null,
      message: null,
    });
  }, []);

  const isNativePlatform = useCallback(() => {
    return Capacitor.isNativePlatform();
  }, []);

  return {
    callState,
    makePhoneCall,
    endCall,
    isNativePlatform,
  };
};