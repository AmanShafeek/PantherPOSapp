import type { PurchaseOrder, PurchaseOrderItem } from '../types/db';

export const purchaseService = {
    getAll: async (): Promise<(PurchaseOrder & { supplier_name: string })[]> => {
        return await window.electronAPI.dbQuery(`
            SELECT po.*, s.name as supplier_name 
            FROM purchase_orders po
            JOIN suppliers s ON po.supplier_id = s.id
            ORDER BY po.date DESC
        `);
    },

    getById: async (id: number): Promise<{ order: PurchaseOrder, items: any[] } | null> => {
        const orders = await window.electronAPI.dbQuery(`
            SELECT po.*, s.name as supplier_name 
            FROM purchase_orders po
            JOIN suppliers s ON po.supplier_id = s.id
            WHERE po.id = ?
        `, [id]);

        if (!orders[0]) return null;

        const items = await window.electronAPI.dbQuery(`
            SELECT poi.*, p.name as product_name, p.barcode
            FROM purchase_order_items poi
            JOIN products p ON poi.product_id = p.id
            WHERE poi.purchase_order_id = ?
        `, [id]);

        return { order: orders[0], items };
    },

    generateOrderNo: async (): Promise<string> => {
        const date = new Date();
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const prefix = `PO-${yyyy}${mm}${dd}`;

        const result = await window.electronAPI.dbQuery(
            `SELECT count(*) as count FROM purchase_orders WHERE order_no LIKE ?`,
            [`${prefix}%`]
        );

        const count = (result[0]?.count || 0) + 1;
        const sequence = String(count).padStart(4, '0');
        return `${prefix}-${sequence}`;
    },

    create: async (order: Omit<PurchaseOrder, 'id' | 'order_no' | 'date'>, items: Omit<PurchaseOrderItem, 'id' | 'purchase_order_id'>[]): Promise<number> => {
        const orderNo = await purchaseService.generateOrderNo();
        const dateStr = new Date().toISOString();

        const result = await window.electronAPI.dbQuery(
            `INSERT INTO purchase_orders (order_no, supplier_id, date, total_amount, status, notes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [orderNo, order.supplier_id, dateStr, order.total_amount, order.status, order.notes || null]
        );

        const purchaseOrderId = result.changes;

        for (const item of items) {
            await window.electronAPI.dbQuery(
                `INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, cost_price, total_amount)
                 VALUES (?, ?, ?, ?, ?)`,
                [purchaseOrderId, item.product_id, item.quantity, item.cost_price, item.total_amount]
            );
        }

        return purchaseOrderId;
    },

    updateStatus: async (id: number, status: PurchaseOrder['status']): Promise<void> => {
        await window.electronAPI.dbQuery('UPDATE purchase_orders SET status = ? WHERE id = ?', [status, id]);
    },

    receiveOrder: async (id: number): Promise<void> => {
        const data = await purchaseService.getById(id);
        if (!data) throw new Error('Order not found');
        if (data.order.status === 'RECEIVED') throw new Error('Order already received');

        // Start transaction-like flow (manual since we're using simple queries)
        // 1. Update stock for each item
        for (const item of data.items) {
            await window.electronAPI.dbQuery(
                'UPDATE products SET stock = stock + ?, cost_price = ? WHERE id = ?',
                [item.quantity, item.cost_price, item.product_id]
            );
        }

        // 2. Mark order as received
        await window.electronAPI.dbQuery(
            'UPDATE purchase_orders SET status = ?, receive_date = ? WHERE id = ?',
            ['RECEIVED', new Date().toISOString(), id]
        );

        // 3. Update Supplier Ledger (We owe them money)
        // Check if supplierService needs to be imported, but we are in same package essentially.
        // It's safer to use a dynamic import or assume it's available via module. 
        // Or duplicate the logic to avoid circular dependency since supplierService might use purchaseService later.
        // For now, let's use a direct DB manipulation here for robustness and speed.

        const amount = data.rows ? data.rows[0].total_amount : data.order.total_amount;

        // Fetch current balance
        const supRes = await window.electronAPI.dbQuery('SELECT balance FROM suppliers WHERE id = ?', [data.order.supplier_id]);
        const currentBal = supRes[0]?.balance || 0;
        const newBal = currentBal + (amount || 0);

        await window.electronAPI.dbQuery('UPDATE suppliers SET balance = ? WHERE id = ?', [newBal, data.order.supplier_id]);

        const date = new Date().toISOString();
        await window.electronAPI.dbQuery(
            `INSERT INTO supplier_ledger (supplier_id, type, amount, balance_after, description, reference_id, date) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [data.order.supplier_id, 'CREDIT', amount, newBal, `Purchase Order ${data.order.order_no}`, id, date]
        );
    },

    deleteDraft: async (id: number): Promise<void> => {
        const order = await window.electronAPI.dbQuery('SELECT status FROM purchase_orders WHERE id = ?', [id]);
        if (order[0]?.status !== 'DRAFT') {
            throw new Error('Only draft orders can be deleted');
        }
        await window.electronAPI.dbQuery('DELETE FROM purchase_order_items WHERE purchase_order_id = ?', [id]);
        await window.electronAPI.dbQuery('DELETE FROM purchase_orders WHERE id = ?', [id]);
    }
};
