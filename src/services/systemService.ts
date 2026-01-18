export const systemService = {
    checkHealth: async () => {
        const report = {
            database: { status: 'UNKNOWN', message: '' },
            backup: { status: 'UNKNOWN', message: '' }
        };

        // 1. Check Database
        try {
            if (window.electronAPI) {
                await window.electronAPI.dbQuery('SELECT 1');
                report.database = { status: 'ONLINE', message: 'Connected to SQLite' };
            } else {
                report.database = { status: 'MOCK', message: 'Running in Browser Mode' };
            }
        } catch (error: any) {
            report.database = { status: 'OFFLINE', message: error.message };
        }

        // 2. Internet Check Removed (Offline App)

        // 3. Check Last Backup (Mock logic for now, real implementation would check file timestamp)
        report.backup = { status: 'WARNING', message: 'No recent backup found. Please backup manually.' };

        return report;
    },

    performSelfHeal: async () => {
        // Clear non-essential caches or reset state if needed
        console.log("🩹 Performing Self-Heal sequence...");

        // Reload the window to clear memory/state issues
        window.location.reload();

        return true;
    }
};
