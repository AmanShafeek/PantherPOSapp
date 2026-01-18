import { Bill, BillItem, Product } from './db';

export interface ElectronAPI {
    dbQuery: (sql: string, params?: any[]) => Promise<any>;
    printRaw: (data: number[]) => Promise<{ success: boolean; error?: string }>;
    scaleReadWeight: () => Promise<{ success: boolean; weight?: number; error?: string }>;
    openWindow: (path: string) => Promise<void>;
    createBackup: () => Promise<{ success: boolean; path?: string; filename?: string; error?: string }>;
    getBackups: () => Promise<any[]>;
    restoreBackup: (filename: string) => Promise<{ success: boolean; error?: string }>;
    exportDb: () => Promise<{ success: boolean; path?: string; canceled?: boolean }>;
    importDb: () => Promise<{ success: boolean; error?: string; canceled?: boolean }>;
    addAuditLog: (payload: { userId: number, userName: string, action: string, details: string }) => Promise<any>;
    getAuditLogs: (limit?: number) => Promise<any[]>;
    saveFile: (filename: string, data: any) => Promise<{ success: boolean; path?: string; error?: string; canceled?: boolean }>;

    addNotification: (payload: { type: 'LOW_STOCK' | 'SYSTEM', title: string, message: string }) => Promise<any>;
    getNotifications: (unreadOnly?: boolean) => Promise<any[]>;
    markNotificationRead: (id: number) => Promise<any>;
    markAllNotificationsRead: () => Promise<any>;

    // AI Assist
    startAI: () => Promise<void>;
    stopAI: () => Promise<void>;
    sendAudioChunk: (buffer: Int16Array) => Promise<void>;
    on: (channel: string, callback: Function) => void;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
