import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ramfinance.mobile',
  appName: 'RAM Finance',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  }
};

export default config;
