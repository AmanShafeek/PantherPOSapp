import type { InventoryLog, StocktakeItem, StocktakeSession } from '../types/db';

export const inventoryService = {
    // Inventory Logs
    addLog: async (
        productId: number,
        type: InventoryLog['type'],
        qtyChange: number,
        reason: string,
        userId?: number
    ) => {
        if (!window.electronAPI) return;
        const date = new Date().toISOString();
        await window.electronAPI.dbQuery(
            `INSERT INTO inventory_logs (product_id, type, quantity_change, reason, date, user_id) VALUES (?, ?, ?, ?, ?, ?)`,
            [productId, type, qtyChange, reason, date, userId || null]
        );
    },

    getLogs: async (productId?: number): Promise<InventoryLog[]> => {
        if (!window.electronAPI) return [];
        let query = `SELECT * FROM inventory_logs`;
        const params = [];
        if (productId) {
            query += ` WHERE product_id = ?`;
            params.push(productId);
        }
        query += ` ORDER BY date DESC LIMIT 100`;
        return await window.electronAPI.dbQuery(query, params);
    },

    // Stocktaking Sessions
    startStocktake: async (notes?: string): Promise<number> => {
        if (!window.electronAPI) return 0;
        const createdAt = new Date().toISOString();
        const result = await window.electronAPI.dbQuery(
            `INSERT INTO stocktake_sessions (created_at, status, notes) VALUES (?, 'IN_PROGRESS', ?)`,
            [createdAt, notes || '']
        );
        // Assuming we are using a method to get the last ID, similar to cashService or rely on a wrapper result
        // For now, let's fetch the latest open session
        const sess = await window.electronAPI.dbQuery(`SELECT id FROM stocktake_sessions WHERE status = 'IN_PROGRESS' ORDER BY id DESC LIMIT 1`);
        return sess[0]?.id || result.lastInsertRowid; // Fallback attempts
    },

    getActiveSession: async (): Promise<StocktakeSession | null> => {
        if (!window.electronAPI) return null;
        const rows = await window.electronAPI.dbQuery(`SELECT * FROM stocktake_sessions WHERE status = 'IN_PROGRESS' LIMIT 1`);
        return rows[0] || null;
    },

    saveCount: async (sessionId: number, productId: number, countedQty: number) => {
        if (!window.electronAPI) return;

        // Get current system stock for snapshot
        const prodRes = await window.electronAPI.dbQuery(`SELECT stock FROM products WHERE id = ?`, [productId]);
        const systemStock = prodRes[0]?.stock || 0;
        const variance = countedQty - systemStock;

        // Check if item already counted in this session
        const existing = await window.electronAPI.dbQuery(
            `SELECT id FROM stocktake_items WHERE session_id = ? AND product_id = ?`,
            [sessionId, productId]
        );

        if (existing.length > 0) {
            await window.electronAPI.dbQuery(
                `UPDATE stocktake_items SET counted_stock = ?, variance = ?, system_stock = ? WHERE id = ?`,
                [countedQty, variance, systemStock, existing[0].id]
            );
        } else {
            await window.electronAPI.dbQuery(
                `INSERT INTO stocktake_items (session_id, product_id, system_stock, counted_stock, variance) VALUES (?, ?, ?, ?, ?)`,
                [sessionId, productId, systemStock, countedQty, variance]
            );
        }
    },

    deleteCount: async (sessionId: number, productId: number) => {
        if (!window.electronAPI) return;
        await window.electronAPI.dbQuery(`DELETE FROM stocktake_items WHERE session_id = ? AND product_id = ?`, [sessionId, productId]);
    },

    getSessionItems: async (sessionId: number): Promise<any[]> => {
        if (!window.electronAPI) return [];
        return await window.electronAPI.dbQuery(
            `SELECT si.*, p.name, p.barcode 
             FROM stocktake_items si 
             JOIN products p ON si.product_id = p.id 
             WHERE si.session_id = ?`,
            [sessionId]
        );
    },

    finalizeStocktake: async (sessionId: number) => {
        if (!window.electronAPI) return;
        const finalizedAt = new Date().toISOString();

        // 1. Get all items in the session
        const items = await window.electronAPI.dbQuery(`SELECT * FROM stocktake_items WHERE session_id = ?`, [sessionId]);

        // 2. Update actual product stock and log changes
        for (const item of items) {
            if (item.variance !== 0) {
                // Update Product
                await window.electronAPI.dbQuery(
                    `UPDATE products SET stock = ? WHERE id = ?`,
                    [item.counted_stock, item.product_id]
                );
                // Log Inventory Change
                await inventoryService.addLog(
                    item.product_id,
                    'STOCKTAKE_ADJUSTMENT',
                    item.variance,
                    `Audit #${sessionId} Variance`
                );
            }
        }

        // 3. Close Session
        await window.electronAPI.dbQuery(
            `UPDATE stocktake_sessions SET status = 'COMPLETED', finalized_at = ? WHERE id = ?`,
            [finalizedAt, sessionId]
        );
    },

    // Shrinkage Helper
    reportShrinkage: async (productId: number, qtyToReduce: number, reason: string, userId?: number) => {
        if (!window.electronAPI) return;
        // Reduce stock
        await window.electronAPI.dbQuery(
            `UPDATE products SET stock = stock - ? WHERE id = ?`,
            [qtyToReduce, productId]
        );
        // Log
        await inventoryService.addLog(productId, 'SHRINKAGE', -qtyToReduce, reason, userId);
    }
};
