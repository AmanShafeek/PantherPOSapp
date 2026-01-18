"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    dbQuery: (sql, params) => electron_1.ipcRenderer.invoke('db-query', sql, params),
    printRaw: (data) => electron_1.ipcRenderer.invoke('print-raw', data),
    scaleReadWeight: () => electron_1.ipcRenderer.invoke('scale-read-weight'),
    openWindow: (path) => electron_1.ipcRenderer.invoke('open-window', path),
    // Notification Service
    getNotifications: (unreadOnly) => electron_1.ipcRenderer.invoke('notification-list', unreadOnly),
    addNotification: (payload) => electron_1.ipcRenderer.invoke('notification-add', payload),
    markNotificationRead: (id) => electron_1.ipcRenderer.invoke('notification-read', id),
    markAllNotificationsRead: () => electron_1.ipcRenderer.invoke('notification-read-all'),
    // Audit Service
    addAuditLog: (payload) => electron_1.ipcRenderer.invoke('audit-log-add', payload),
    getAuditLogs: (limit) => electron_1.ipcRenderer.invoke('audit-log-list', limit),
    // Cash Session Service
    startCashSession: (userId, startCash) => electron_1.ipcRenderer.invoke('cash-session-start', { userId, startCash }),
    endCashSession: (sessionId, endCash) => electron_1.ipcRenderer.invoke('cash-session-end', { sessionId, endCash }),
    addCashTransaction: (payload) => electron_1.ipcRenderer.invoke('cash-transaction-add', payload),
    // Database Backup/Restore/Export/Import
    createBackup: () => electron_1.ipcRenderer.invoke('db-backup-create'),
    getBackups: () => electron_1.ipcRenderer.invoke('db-backup-list'),
    restoreBackup: (filename) => electron_1.ipcRenderer.invoke('db-backup-restore', filename),
    exportDb: () => electron_1.ipcRenderer.invoke('db-export'),
    importDb: () => electron_1.ipcRenderer.invoke('db-import'),
    saveFile: (filename, data) => electron_1.ipcRenderer.invoke('save-file', { filename, data }),
    // AI Assist
    startAI: () => electron_1.ipcRenderer.send('ai-start'),
    stopAI: () => electron_1.ipcRenderer.send('ai-stop'),
    sendAudioChunk: (buffer) => electron_1.ipcRenderer.send('ai-audio-chunk', buffer),
    on: (channel, callback) => {
        const subscription = (_event, ...args) => callback(_event, ...args);
        electron_1.ipcRenderer.on(channel, subscription);
        return () => {
            electron_1.ipcRenderer.removeListener(channel, subscription);
        };
    }
});
