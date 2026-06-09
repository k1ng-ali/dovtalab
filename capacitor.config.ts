import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dovtalab.app',
  appName: 'Dovtalab',
  webDir: 'dist',
  plugins: {
    CapacitorCookies: {
      enabled: true, // Включает нативную синхронизацию кук
    },
    CapacitorHttp: {
      enabled: true, // Перехватывает axios и отправляет нативно
    },
    Assets: {
      android: {
        iconPath: 'src/assets/icon.png',
        splashPath: 'src/assets/splash.png',
      }
    },
    SystemBars: {
      insetsHandling: 'disable', // контент рисуется под статус баром
    },
    EdgeToEdge: {
      statusBarColor: 'rgba(34,34,34,0.3)',
      navigationBarColor: '#F6F6F6',
      backgroundColor: '#F6F6F6',
    },
  },
};

export default config;
