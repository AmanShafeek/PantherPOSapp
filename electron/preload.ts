import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    dbQuery: (sql: string, params?: any[]) => ipcRenderer.invoke('db-query', sql, params),
    printRaw: (data: number[]) => ipcRenderer.invoke('print-raw', data),
    scaleReadWeight: () => ipcRenderer.invoke('scale-read-weight'),
    openWindow: (path: string) => ipcRenderer.invoke('open-window', path),

    // Notification Service
    getNotifications: (unreadOnly?: boolean) => ipcRenderer.invoke('notification-list', unreadOnly),
    addNotification: (payload: any) => ipcRenderer.invoke('notification-add', payload),
    markNotificationRead: (id: number) => ipcRenderer.invoke('notification-read', id),
    markAllNotificationsRead: () => ipcRenderer.invoke('notification-read-all'),

    // Audit Service
    addAuditLog: (payload: any) => ipcRenderer.invoke('audit-log-add', payload),
    getAuditLogs: (limit?: number) => ipcRenderer.invoke('audit-log-list', limit),

    // Cash Session Service
    startCashSession: (userId: number, startCash: number) => ipcRenderer.invoke('cash-session-start', { userId, startCash }),
    endCashSession: (sessionId: number, endCash: number) => ipcRenderer.invoke('cash-session-end', { sessionId, endCash }),
    addCashTransaction: (payload: any) => ipcRenderer.invoke('cash-transaction-add', payload),

    // Database Backup/Restore/Export/Import
    createBackup: () => ipcRenderer.invoke('db-backup-create'),
    getBackups: () => ipcRenderer.invoke('db-backup-list'),
    restoreBackup: (filename: string) => ipcRenderer.invoke('db-backup-restore', filename),
    exportDb: () => ipcRenderer.invoke('db-export'),
    importDb: () => ipcRenderer.invoke('db-import'),
    saveFile: (filename: string, data: any) => ipcRenderer.invoke('save-file', { filename, data }),

    // AI Assist
    startAI: () => ipcRenderer.send('ai-start'),
    stopAI: () => ipcRenderer.send('ai-stop'),
    sendAudioChunk: (buffer: Int16Array) => ipcRenderer.send('ai-audio-chunk', buffer),
    on: (channel: string, callback: Function) => {
        const subscription = (_event: any, ...args: any[]) => callback(_event, ...args);
        ipcRenderer.on(channel, subscription);
        return () => {
            ipcRenderer.removeListener(channel, subscription);
        };
    }
});
