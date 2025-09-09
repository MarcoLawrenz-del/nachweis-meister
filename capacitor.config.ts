import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.82c1eb4c716d4b6f912f24d7b39acd25',
  appName: 'nachweis-meister',
  webDir: 'dist',
  server: {
    url: 'https://82c1eb4c-716d-4b6f-912f-24d7b39acd25.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    }
  }
};

export default config;