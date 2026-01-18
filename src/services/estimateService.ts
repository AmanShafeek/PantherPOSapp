import type { Bill, BillItem } from '../types/db';
import { billService } from './billService';
import { productService } from './productService';

// Reusing Bill interface structures as they are identical
export interface Estimate {
    id: number;
    estimate_no: string;
    customer_id?: number | null;
    sub_total: number;
    discount_amount: number;
    tax_amount: number;
    total_amount: number;
    payment_mode: string;
    date: string;
    valid_until?: string;
    notes?: string;
    status: 'ACTIVE' | 'CONVERTED' | 'EXPIRED';
}

export interface EstimateItem {
    id: number;
    estimate_id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    price: number;
    tax_rate: number;
    total_amount: number;
}

export const estimateService = {
    getAll: async (): Promise<(Estimate & { customer_name?: string })[]> => {
        if (!window.electronAPI) return [];
        return await window.electronAPI.dbQuery(`
            SELECT e.*, c.name as customer_name 
            FROM estimates e
            LEFT JOIN customers c ON e.customer_id = c.id
            ORDER BY e.date DESC
        `);
    },

    getById: async (id: number): Promise<{ estimate: Estimate, items: EstimateItem[] } | null> => {
        if (!window.electronAPI) return null;
        const res = await window.electronAPI.dbQuery('SELECT * FROM estimates WHERE id = ?', [id]);
        if (!res[0]) return null;

        const items = await window.electronAPI.dbQuery('SELECT * FROM estimate_items WHERE estimate_id = ?', [id]);
        return { estimate: res[0], items };
    },

    create: async (data: Omit<Estimate, 'id' | 'estimate_no' | 'date'>, items: Omit<EstimateItem, 'id' | 'estimate_id'>[]): Promise<number> => {
        if (!window.electronAPI) return 0;

        // Generate No
        const date = new Date();
        const prefix = `EST-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
        const countRes = await window.electronAPI.dbQuery('SELECT count(*) as c FROM estimates WHERE estimate_no LIKE ?', [`${prefix}%`]);
        const count = (countRes[0]?.c || 0) + 1;
        const estimateNo = `${prefix}-${count.toString().padStart(4, '0')}`;
        const now = new Date().toISOString();

        // Insert Header
        const result = await window.electronAPI.dbQuery(
            `INSERT INTO estimates (estimate_no, date, customer_id, sub_total, discount_amount, tax_amount, total_amount, payment_mode, valid_until, notes, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
            [estimateNo, now, data.customer_id || null, data.sub_total, data.discount_amount, data.tax_amount, data.total_amount, data.payment_mode, data.valid_until || null, data.notes || null]
        );
        const estimateId = result.changes;

        // Insert Items
        for (const item of items) {
            await window.electronAPI.dbQuery(
                `INSERT INTO estimate_items (estimate_id, product_id, product_name, quantity, price, tax_rate, total_amount)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [estimateId, item.product_id, item.product_name, item.quantity, item.price, item.tax_rate, item.total_amount]
            );
        }
        return estimateId;
    },

    convertToBill: async (estimateId: number): Promise<number> => {
        const estData = await estimateService.getById(estimateId);
        if (!estData) throw new Error("Estimate not found");
        if (estData.estimate.status === 'CONVERTED') throw new Error("Already converted");

        // Create Bill (this will deduct stock as per billService logic)
        // We map estimate items to bill items
        const billId = await billService.createBill(
            {
                customer_id: estData.estimate.customer_id || undefined,
                sub_total: estData.estimate.sub_total,
                discount_amount: estData.estimate.discount_amount,
                tax_amount: estData.estimate.tax_amount,
                total_amount: estData.estimate.total_amount,
                payment_mode: estData.estimate.payment_mode || 'CASH'
            },
            estData.items.map(i => ({
                id: 0, // unused
                bill_id: 0, // unused
                product_id: i.product_id,
                product_name: i.product_name,
                quantity: i.quantity,
                price: i.price,
                tax_rate: i.tax_rate,
                total_amount: i.total_amount
            }))
        );

        // Update Estimate Status
        await window.electronAPI?.dbQuery('UPDATE estimates SET status = ? WHERE id = ?', ['CONVERTED', estimateId]);

        return billId;
    }
};
