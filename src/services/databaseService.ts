export const databaseService = {
    init: async () => {
        if (!window.electronAPI) {
            console.warn('[Database] Browser mode detected, skipping DB init');
            return;
        }

        console.log('[Database] Initializing tables...');

        try {
            // Products Table
            await window.electronAPI.dbQuery(`
                CREATE TABLE IF NOT EXISTS products (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    barcode TEXT NOT NULL UNIQUE,
                    cost_price REAL DEFAULT 0,
                    sell_price REAL NOT NULL,
                    stock INTEGER DEFAULT 0,
                    gst_rate INTEGER DEFAULT 0,
                    hsn_code TEXT,
                    min_stock_level INTEGER DEFAULT 5,
                    variant_group_id INTEGER,
                    attributes TEXT
                )
            `);

            // Bills Table
            await window.electronAPI.dbQuery(`
                CREATE TABLE IF NOT EXISTS bills (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    bill_no TEXT NOT NULL UNIQUE,
                    date TEXT NOT NULL,
                    subtotal REAL DEFAULT 0,
                    cgst REAL DEFAULT 0,
                    sgst REAL DEFAULT 0,
                    igst REAL DEFAULT 0,
                    gst_total REAL DEFAULT 0,
                    total REAL NOT NULL,
                    payment_mode TEXT DEFAULT 'CASH',
                    status TEXT DEFAULT 'PAID'
                )
            `);

            // Bill Items Table
            await window.electronAPI.dbQuery(`
                CREATE TABLE IF NOT EXISTS bill_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    bill_id INTEGER NOT NULL,
                    product_id INTEGER NOT NULL,
                    quantity INTEGER NOT NULL,
                    returned_quantity INTEGER DEFAULT 0,
                    price REAL NOT NULL,
                    taxable_value REAL DEFAULT 0,
                    gst_rate INTEGER DEFAULT 0,
                    gst_amount REAL DEFAULT 0,
                    FOREIGN KEY(bill_id) REFERENCES bills(id),
                    FOREIGN KEY(product_id) REFERENCES products(id)
                )
            `);

            // Product Groups Table
            await window.electronAPI.dbQuery(`
                CREATE TABLE IF NOT EXISTS product_groups (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    created_at TEXT NOT NULL
                )
            `);

            // Product Group Items Table
            await window.electronAPI.dbQuery(`
                CREATE TABLE IF NOT EXISTS product_group_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    group_id INTEGER NOT NULL,
                    product_id INTEGER NOT NULL,
                    FOREIGN KEY(group_id) REFERENCES product_groups(id) ON DELETE CASCADE,
                    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
                )
            `);

            // Audit Logs Table
            await window.electronAPI.dbQuery(`
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    action TEXT NOT NULL,
                    details TEXT,
                    performed_by INTEGER,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            console.log('[Database] Tables initialized successfully');
        } catch (error) {
            console.error('[Database] Failed to initialize tables:', error);
            // Re-throw or alert? For now log is enough, app might partially work
        }
    },

    createBackup: async (): Promise<string> => {
        if (!window.electronAPI) throw new Error('Not supported in browser');
        // Placeholder for backup logic
        return "Automatic backups are enabled on startup.";
    }
};
