
export interface AuditLogEntry {
    id: number;
    user_id: number;
    user_name: string;
    action: string;
    details: string;
    timestamp: string;
}

export const auditService = {
    log: async (action: string, details: any = {}) => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return; // Should rarely happen if we are logged in, but for generic protection

            const user = JSON.parse(userStr);

            // Format details as string if it's an object
            const detailsStr = typeof details === 'string' ? details : JSON.stringify(details);

            await window.electronAPI.addAuditLog({
                userId: user.id || 0,
                userName: user.name || 'System',
                action,
                details: detailsStr
            });
        } catch (e) {
            console.error('Failed to write audit log', e);
        }
    },

    getLogs: async (limit: number = 100): Promise<AuditLogEntry[]> => {
        try {
            return await window.electronAPI.getAuditLogs(limit);
        } catch (e) {
            console.error('Failed to fetch audit logs', e);
            return [];
        }
    }
};
