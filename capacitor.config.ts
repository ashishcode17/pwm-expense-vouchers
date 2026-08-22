import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.propertywithmanish.vouchers',
  appName: 'PWM Expense Vouchers',
  webDir: 'out',
  server: {
    url: 'https://vouchers.propertywithmanish.com',
    cleartext: true,
    allowNavigation: [
      'vouchers.propertywithmanish.com',
      'propertywithmanish.com',
      '*.propertywithmanish.com',
      '*.supabase.co',
    ],
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#ffffff',
    webContentsDebuggingEnabled: false,
  },
};

export default config;
