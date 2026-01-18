
export interface AppSettings {
    store_name: string;
    store_address: string;
    store_phone: string;
    gst_no: string;
    printer_enabled: boolean;
    printer_name: string;
    drawer_enabled: boolean;
    pulse_on: number;
    pulse_off: number;
    store_logo: string;
    receipt_header: string;
    invoice_terms: string;
    invoice_footer: string;
    scale_enabled: boolean;
    scale_port: string;
    scale_baud_rate: number;
    scale_protocol: string;
}

export const settingsService = {
    init: async () => {
        if (!window.electronAPI) {
            console.warn('[Settings] Browser mode detected, skipping DB init');
            return;
        }
        await window.electronAPI.dbQuery(`
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        `);

        // Check if default settings exist, if not, create them
        const keys = [
            ['store_name', 'QuickPOS Store'],
            ['store_address', '123 Business Avenue, Tech Park'],
            ['store_phone', '+91 98765 43210'],
            ['gst_no', '29ABCDE1234F1Z5'],
            ['printer_enabled', 'false'],
            ['printer_name', 'Thermal Printer'],
            ['drawer_enabled', 'true'],
            ['pulse_on', '25'],
            ['pulse_off', '250'],
            ['store_logo', ''],
            ['receipt_header', 'Welcome to QuickPOS'],
            ['invoice_terms', '1. Goods once sold will not be taken back.\n2. Interest @18% will be charged if not paid within 7 days.'],
            ['invoice_footer', 'Thank you for your business!'],

            ['scale_enabled', 'false'],
            ['scale_port', 'COM1'],
            ['scale_baud_rate', '9600'],
            ['scale_protocol', 'GENERIC']
        ];

        for (const [key, defaultValue] of keys) {
            const result = await window.electronAPI.dbQuery(`SELECT * FROM settings WHERE key = ?`, [key]);
            if (result.length === 0) {
                await window.electronAPI.dbQuery(`INSERT INTO settings (key, value) VALUES (?, ?)`, [key, defaultValue]);
            }
        }
    },

    getSettings: async (): Promise<AppSettings> => {
        if (!window.electronAPI) {
            console.warn('[Settings] Browser mode detected, returning mock settings');
            return {
                store_name: 'QuickPOS Store (Browser)',
                store_address: '123 Browser Lane',
                store_phone: '000-000-0000',
                gst_no: 'BROWSER-TEST',
                printer_enabled: false,
                printer_name: 'Mock Printer',
                drawer_enabled: true,
                pulse_on: 25,
                pulse_off: 250,
                store_logo: '',
                receipt_header: 'Welcome to QuickPOS (Browser)',
                invoice_terms: 'Mock Terms',
                invoice_footer: 'Mock Footer',
                scale_enabled: false,
                scale_port: 'COM1',
                scale_baud_rate: 9600,
                scale_protocol: 'GENERIC'
            };
        }
        const result = await window.electronAPI.dbQuery(`SELECT * FROM settings`);
        const settings: any = {};
        result.forEach((row: { key: string; value: string }) => {
            if (row.key === 'printer_enabled' || row.key === 'drawer_enabled' || row.key === 'scale_enabled') {
                settings[row.key] = row.value === 'true';
            } else if (row.key === 'pulse_on' || row.key === 'pulse_off' || row.key === 'scale_baud_rate') {
                settings[row.key] = parseInt(row.value);
            } else {
                settings[row.key] = row.value;
            }
        });
        return settings as AppSettings;
    },

    updateSetting: async (key: keyof AppSettings, value: string | number | boolean) => {
        if (!window.electronAPI) {
            console.warn(`[Settings] Browser mode: Mock update ${key} = ${value}`);
            return;
        }
        // Use generic settings table which spans both app config and store config
        // Check if key exists in settings table (legacy) or store_settings (new)
        // For simplicity, we will use the 'settings' table created in init() for now, 
        // to avoid migrating data between 'settings' and 'store_settings' mid-flight unless strictly needed.
        // Wait, the migration created 'store_settings'. Let's use that for Store Details and 'settings' for App Configs? 
        // Or better, unify. Let's just write to 'settings' table which seems to be the active one.

        await window.electronAPI.dbQuery(
            `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
            [key, String(value)]
        );
    },

    // --- TAX RATES ---
    getTaxRates: async (): Promise<{ id: number; name: string; rate: number; is_default: boolean }[]> => {
        if (!window.electronAPI) return [];
        const res = await window.electronAPI.dbQuery(`SELECT * FROM tax_rates ORDER BY rate ASC`);
        return res.map((r: any) => ({ ...r, is_default: r.is_default === 1 }));
    },

    saveTaxRate: async (rate: { id?: number; name: string; rate: number; is_default: boolean }) => {
        if (!window.electronAPI) return;
        if (rate.is_default) {
            await window.electronAPI.dbQuery(`UPDATE tax_rates SET is_default = 0`);
        }

        if (rate.id) {
            await window.electronAPI.dbQuery(
                `UPDATE tax_rates SET name = ?, rate = ?, is_default = ? WHERE id = ?`,
                [rate.name, rate.rate, rate.is_default ? 1 : 0, rate.id]
            );
        } else {
            await window.electronAPI.dbQuery(
                `INSERT INTO tax_rates (name, rate, is_default) VALUES (?, ?, ?)`,
                [rate.name, rate.rate, rate.is_default ? 1 : 0]
            );
        }
    },

    deleteTaxRate: async (id: number) => {
        if (!window.electronAPI) return;
        await window.electronAPI.dbQuery(`DELETE FROM tax_rates WHERE id = ?`, [id]);
    }
};
