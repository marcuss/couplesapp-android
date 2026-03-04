import { registerPlugin } from '@capacitor/core';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  metadata?: Record<string, string>;
}

export interface DeviceInfo {
  model: string;
  systemVersion: string;
  appVersion: string;
  buildNumber: string;
  environment: string;
  bundleId: string;
}

export interface DebugPluginInterface {
  isDebugEnabled(): Promise<{ enabled: boolean }>;
  getLogs(): Promise<{ logs: LogEntry[] }>;
  getDeviceInfo(): Promise<DeviceInfo>;
  clearLogs(): Promise<void>;
  addListener(
    eventName: 'shake',
    listenerFunc: () => void
  ): Promise<{ remove: () => void }>;
}

const DebugPlugin = registerPlugin<DebugPluginInterface>('Debug', {
  web: () => ({
    async isDebugEnabled() {
      return { enabled: import.meta.env.DEV };
    },
    async getLogs() {
      return { logs: [] };
    },
    async getDeviceInfo() {
      return {
        model: 'Web Browser',
        systemVersion: navigator.userAgent,
        appVersion: '0.0.0',
        buildNumber: '0',
        environment: import.meta.env.DEV ? 'Development' : 'Production',
        bundleId: 'com.nextasy.couplesapp',
      };
    },
    async clearLogs() {},
    async addListener(_event: string, _fn: () => void) {
      return { remove: () => {} };
    },
  }),
});

export default DebugPlugin;
