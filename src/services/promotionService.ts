import type { Promotion, LoyaltyConfig } from '../types/db';

export const promotionService = {
    // Promotions CRUD
    getAllPromotions: async (): Promise<Promotion[]> => {
        const rows = await window.electronAPI.dbQuery('SELECT * FROM promotions ORDER BY id DESC');
        return rows.map((r: any) => ({ ...r, active: r.active === 1 }));
    },

    createPromotion: async (promo: Omit<Promotion, 'id'>): Promise<number> => {
        const result = await window.electronAPI.dbQuery(
            `INSERT INTO promotions (name, type, code, discount_type, discount_value, min_cart_value, max_discount, start_date, end_date, active, description)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [promo.name, promo.type, promo.code || null, promo.discount_type, promo.discount_value, promo.min_cart_value, promo.max_discount, promo.start_date || null, promo.end_date || null, promo.active ? 1 : 0, promo.description || null]
        );
        return result.changes;
    },

    updatePromotion: async (promo: Promotion): Promise<number> => {
        const result = await window.electronAPI.dbQuery(
            `UPDATE promotions SET name=?, type=?, code=?, discount_type=?, discount_value=?, min_cart_value=?, max_discount=?, start_date=?, end_date=?, active=?, description=?
             WHERE id=?`,
            [promo.name, promo.type, promo.code || null, promo.discount_type, promo.discount_value, promo.min_cart_value, promo.max_discount, promo.start_date || null, promo.end_date || null, promo.active ? 1 : 0, promo.description || null, promo.id]
        );
        return result.changes;
    },

    deletePromotion: async (id: number): Promise<number> => {
        const result = await window.electronAPI.dbQuery('DELETE FROM promotions WHERE id = ?', [id]);
        return result.changes;
    },

    getByCode: async (code: string): Promise<Promotion | null> => {
        const rows = await window.electronAPI.dbQuery('SELECT * FROM promotions WHERE code = ? AND active = 1', [code]);
        if (rows.length === 0) return null;
        return { ...rows[0], active: rows[0].active === 1 };
    },

    // Loyalty Configs
    getLoyaltyConfigs: async (): Promise<LoyaltyConfig[]> => {
        return await window.electronAPI.dbQuery('SELECT * FROM loyalty_configs');
    },

    updateLoyaltyConfig: async (key: string, value: string): Promise<void> => {
        await window.electronAPI.dbQuery('UPDATE loyalty_configs SET value = ? WHERE key = ?', [value, key]);
    }
};
