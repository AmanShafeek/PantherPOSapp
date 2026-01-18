import type { CashDrawerSession, CashTransaction } from '../types/db';

export const cashService = {
    startSession: async (userId: number, initialCash: number): Promise<number> => {
        const startTime = new Date().toISOString();
        await window.electronAPI.dbQuery(
            `INSERT INTO cash_drawer_sessions (user_id, start_time, start_cash, status) VALUES (?, ?, ?, 'OPEN')`,
            [userId, startTime, initialCash]
        );

        // Also log as an initial transaction
        // Based on other services, let's select the last ID for this user.

        const sessionRes = await window.electronAPI.dbQuery(
            `SELECT id FROM cash_drawer_sessions WHERE user_id = ? AND status = 'OPEN' ORDER BY id DESC LIMIT 1`,
            [userId]
        );
        const newSessionId = sessionRes[0].id;

        await window.electronAPI.dbQuery(
            `INSERT INTO cash_transactions (session_id, type, amount, reason, time) VALUES (?, 'OPENING', ?, 'Opening Balance', ?)`,
            [newSessionId, initialCash, startTime]
        );

        return newSessionId;
    },

    getCurrentSession: async (): Promise<CashDrawerSession | null> => {
        // We really need to know the logged in user, but for now let's find ANY open session if we treat registers as single-user-exclusive
        // OR we pass userId. Let's pass userId if possible, but for a global lock, checking any open session is safer for single-till.
        const res = await window.electronAPI.dbQuery(
            `SELECT * FROM cash_drawer_sessions WHERE status = 'OPEN' LIMIT 1`
        );
        return res[0] || null;
    },

    endSession: async (sessionId: number, endCash: number): Promise<void> => {
        const endTime = new Date().toISOString();
        await window.electronAPI.dbQuery(
            `UPDATE cash_drawer_sessions SET end_time = ?, end_cash = ?, status = 'CLOSED' WHERE id = ?`,
            [endTime, endCash, sessionId]
        );

        await window.electronAPI.dbQuery(
            `INSERT INTO cash_transactions (session_id, type, amount, reason, time) VALUES (?, 'CLOSING', ?, 'Closing Balance', ?)`,
            [sessionId, endCash, endTime]
        );
    },

    addTransaction: async (sessionId: number, type: 'DROP' | 'PAYOUT' | 'SALE' | 'REFUND', amount: number, reason: string) => {
        const time = new Date().toISOString();
        await window.electronAPI.dbQuery(
            `INSERT INTO cash_transactions (session_id, type, amount, reason, time) VALUES (?, ?, ?, ?, ?)`,
            [sessionId, type, amount, reason, time]
        );
    },

    getTransactions: async (sessionId: number): Promise<CashTransaction[]> => {
        return await window.electronAPI.dbQuery(
            `SELECT * FROM cash_transactions WHERE session_id = ? ORDER BY id DESC`,
            [sessionId]
        );
    }
};
