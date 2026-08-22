import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.propertywithmanish.vouchers',
  appName: 'PWM Expense Vouchers',
  webDir: 'out',
  // Web-link app: always open the live website inside the Android shell
  server: {
    url: 'https://pwm-expense-vouchers.vercel.app',
    cleartext: true,
    allowNavigation: [
      'pwm-expense-vouchers.vercel.app',
      '*.vercel.app',
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
