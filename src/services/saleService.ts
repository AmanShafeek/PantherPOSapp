import type { Bill, BillItem } from '../types/db';

export interface BillWithItems extends Bill {
    items: (BillItem & { productName: string; barcode: string })[];
}

export const saleService = {
    getSales: async (filters?: { search?: string; startDate?: string; endDate?: string; status?: string }): Promise<Bill[]> => {
        let sql = `SELECT * FROM bills WHERE 1=1`;
        const params: any[] = [];

        if (filters?.search) {
            sql += ` AND bill_no LIKE ?`;
            params.push(`%${filters.search}%`);
        }

        if (filters?.startDate) {
            sql += ` AND date >= ?`;
            params.push(filters.startDate);
        }

        if (filters?.endDate) {
            sql += ` AND date <= ?`;
            params.push(filters.endDate);
        }

        if (filters?.status && filters.status !== 'ALL') {
            sql += ` AND status = ?`;
            params.push(filters.status);
        }

        sql += ` ORDER BY date DESC LIMIT 1000`;
        return await window.electronAPI.dbQuery(sql, params);
    },

    getTodaySummary: async (): Promise<{ total: number; count: number }> => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isoString = today.toISOString();

        const result = await window.electronAPI.dbQuery(
            `SELECT SUM(total) as total, COUNT(*) as count FROM bills WHERE date >= ? AND status = 'PAID'`,
            [isoString]
        );
        return {
            total: result[0]?.total || 0,
            count: result[0]?.count || 0
        };
    },

    getBillDetails: async (billId: number): Promise<BillWithItems> => {
        const billResult = await window.electronAPI.dbQuery(`SELECT * FROM bills WHERE id = ?`, [billId]);
        if (billResult.length === 0) throw new Error('Bill not found');
        const bill = billResult[0];

        const items = await window.electronAPI.dbQuery(
            `SELECT bi.*, p.name as productName, p.barcode, p.hsn_code 
             FROM bill_items bi 
             JOIN products p ON bi.product_id = p.id 
             WHERE bi.bill_id = ?`,
            [billId]
        );

        return { ...bill, items };
    },

    getBillDetailsByNo: async (billNo: string): Promise<BillWithItems> => {
        const billResult = await window.electronAPI.dbQuery(`SELECT * FROM bills WHERE bill_no = ?`, [billNo]);
        if (billResult.length === 0) throw new Error('Bill not found');
        return saleService.getBillDetails(billResult[0].id);
    },

    // ... existing cancel/refund methods ...
    refundBill: async (billId: number): Promise<void> => {
        const bill = await saleService.getBillDetails(billId);
        if (bill.status !== 'PAID') throw new Error('Bill is already ' + bill.status);
        await window.electronAPI.dbQuery(`UPDATE bills SET status = 'REFUNDED' WHERE id = ?`, [billId]);
        for (const item of bill.items) {
            await window.electronAPI.dbQuery(`UPDATE products SET stock = stock + ? WHERE id = ?`, [item.quantity, item.product_id]);
        }
    },

    cancelBill: async (billId: number): Promise<void> => {
        const bill = await saleService.getBillDetails(billId);
        if (bill.status !== 'PAID') throw new Error('Bill is already ' + bill.status);
        await window.electronAPI.dbQuery(`UPDATE bills SET status = 'CANCELLED' WHERE id = ?`, [billId]);
        for (const item of bill.items) {
            await window.electronAPI.dbQuery(`UPDATE products SET stock = stock + ? WHERE id = ?`, [item.quantity, item.product_id]);
        }
    },

    generateReturnNo: async (): Promise<string> => {
        const date = new Date();
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const prefix = `RET-${yyyy}${mm}${dd}`;

        const result = await window.electronAPI.dbQuery(
            `SELECT count(*) as count FROM returns WHERE bill_no LIKE ?`,
            [`${prefix}%`]
        );

        const count = (result[0]?.count || 0) + 1;
        return `${prefix}-${String(count).padStart(4, '0')}`;
    },

    processReturn: async (originalBillId: number, items: { productId: number; quantity: number; refundAmount: number; billItemId: number }[], reason: string, paymentMode: string): Promise<string> => {
        const returnNo = await saleService.generateReturnNo();
        const dateStr = new Date().toISOString();
        const totalRefund = items.reduce((sum, item) => sum + item.refundAmount, 0);

        await window.electronAPI.dbQuery(
            `INSERT INTO returns (original_bill_id, bill_no, date, total_refund, payment_mode, reason)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [originalBillId, returnNo, dateStr, totalRefund, paymentMode, reason]
        );

        const res = await window.electronAPI.dbQuery(`SELECT id FROM returns WHERE bill_no = ?`, [returnNo]);
        const returnId = res[0].id;

        for (const item of items) {
            await window.electronAPI.dbQuery(
                `INSERT INTO return_items (return_id, product_id, quantity, refund_amount)
                 VALUES (?, ?, ?, ?)`,
                [returnId, item.productId, item.quantity, item.refundAmount]
            );

            await window.electronAPI.dbQuery(
                `UPDATE bill_items SET returned_quantity = returned_quantity + ? WHERE id = ?`,
                [item.quantity, item.billItemId]
            );

            await window.electronAPI.dbQuery(
                `UPDATE products SET stock = stock + ? WHERE id = ?`,
                [item.quantity, item.productId]
            );
        }

        // Check if full bill is returned
        const bill = await saleService.getBillDetails(originalBillId);
        const totalItems = bill.items.reduce((sum, i) => sum + i.quantity, 0);
        const totalReturned = bill.items.reduce((sum, i) => sum + (i.returned_quantity || 0), 0);

        if (totalReturned >= totalItems) {
            await window.electronAPI.dbQuery(`UPDATE bills SET status = 'RETURNED' WHERE id = ?`, [originalBillId]);
        } else {
            await window.electronAPI.dbQuery(`UPDATE bills SET status = 'PARTIAL_RETURN' WHERE id = ?`, [originalBillId]);
        }

        return returnNo;
    }
};
