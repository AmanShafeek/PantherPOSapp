import type { Supplier } from '../types/db';

export const supplierService = {
    getAll: async (): Promise<Supplier[]> => {
        return await window.electronAPI.dbQuery('SELECT * FROM suppliers ORDER BY name ASC');
    },

    search: async (query: string): Promise<Supplier[]> => {
        const term = `%${query}%`;
        return await window.electronAPI.dbQuery(
            'SELECT * FROM suppliers WHERE name LIKE ? OR contact_person LIKE ? OR phone LIKE ? ORDER BY name ASC',
            [term, term, term]
        );
    },

    getById: async (id: number): Promise<Supplier | null> => {
        const results = await window.electronAPI.dbQuery('SELECT * FROM suppliers WHERE id = ?', [id]);
        return results[0] || null;
    },

    create: async (supplier: Omit<Supplier, 'id' | 'created_at'>): Promise<number> => {
        const result = await window.electronAPI.dbQuery(
            `INSERT INTO suppliers (name, contact_person, phone, email, address, gstin, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [supplier.name, supplier.contact_person || null, supplier.phone || null, supplier.email || null, supplier.address || null, supplier.gstin || null, new Date().toISOString()]
        );
        return result.changes;
    },

    update: async (supplier: Supplier): Promise<number> => {
        const result = await window.electronAPI.dbQuery(
            `UPDATE suppliers SET name=?, contact_person=?, phone=?, email=?, address=?, gstin=? WHERE id=?`,
            [supplier.name, supplier.contact_person || null, supplier.phone || null, supplier.email || null, supplier.address || null, supplier.gstin || null, supplier.id]
        );
        return result.changes;
    },

    delete: async (id: number): Promise<number> => {
        // Check if supplier has any purchase orders before deleting
        const orders = await window.electronAPI.dbQuery('SELECT count(*) as count FROM purchase_orders WHERE supplier_id = ?', [id]);
        if (orders[0].count > 0) {
            throw new Error('Cannot delete supplier with existing purchase orders');
        }
        const result = await window.electronAPI.dbQuery('DELETE FROM suppliers WHERE id = ?', [id]);
        return result.changes;
    },

    // --- LEDGER ---
    getLedger: async (supplierId: number): Promise<any[]> => {
        return await window.electronAPI.dbQuery(
            `SELECT * FROM supplier_ledger WHERE supplier_id = ? ORDER BY date DESC`,
            [supplierId]
        );
    },

    updateBalance: async (supplierId: number, amount: number, type: 'DEBIT' | 'CREDIT', description: string, refId?: number) => {
        if (!window.electronAPI) return;

        // 1. Get current balance
        const res = await window.electronAPI.dbQuery(`SELECT balance FROM suppliers WHERE id = ?`, [supplierId]);
        const currentBalance = res[0]?.balance || 0;

        // 2. Calculate new balance
        // CREDIT means we OWE MORE (Purchase) -> Increase Balance
        // DEBIT means we PAID (Payment) -> Decrease Balance
        let newBalance = currentBalance;
        if (type === 'CREDIT') {
            newBalance += amount;
        } else {
            newBalance -= amount;
        }

        // 3. Update Supplier Balance
        await window.electronAPI.dbQuery(`UPDATE suppliers SET balance = ? WHERE id = ?`, [newBalance, supplierId]);

        // 4. Insert Ledger Entry
        const date = new Date().toISOString();
        await window.electronAPI.dbQuery(
            `INSERT INTO supplier_ledger (supplier_id, type, amount, balance_after, description, reference_id, date) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [supplierId, type, amount, newBalance, description, refId || null, date]
        );
    },

    addPayment: async (supplierId: number, amount: number, mode: string, notes?: string) => {
        await supplierService.updateBalance(supplierId, amount, 'DEBIT', `Payment Out (${mode}) ${notes ? '- ' + notes : ''}`);
    }
};
