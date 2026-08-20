import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.propertywithmanish.vouchers',
  appName: 'PWM Expense Vouchers',
  webDir: 'out',
  server: {
    url: 'https://pwm-expense-vouchers.vercel.app',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
