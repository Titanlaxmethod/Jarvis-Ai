
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.9bb1aba2cb894fb889125d44fed5880d',
  appName: 'jarvisss',
  webDir: 'dist',
  server: {
    url: 'https://9bb1aba2-cb89-4fb8-8912-5d44fed5880d.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1e293b',
      showSpinner: false
    }
  }
};

export default config;
