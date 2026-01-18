import type { Product } from '../types/db';

export interface ProductGroup {
    id: number;
    name: string;
    description: string;
    created_at: string;
    item_count?: number;
    items?: Product[];
}

export const groupService = {
    getAll: async (): Promise<ProductGroup[]> => {
        const groups = await window.electronAPI.dbQuery('SELECT * FROM product_groups ORDER BY created_at DESC');

        // Enrich with item counts
        const enriched = await Promise.all(groups.map(async (g: any) => {
            const countResult = await window.electronAPI.dbQuery(
                'SELECT COUNT(*) as count FROM product_group_items WHERE group_id = ?',
                [g.id]
            );
            return { ...g, item_count: countResult[0].count };
        }));

        return enriched;
    },

    create: async (name: string, description: string): Promise<number> => {
        const result = await window.electronAPI.dbQuery(
            'INSERT INTO product_groups (name, description, created_at) VALUES (?, ?, ?)',
            [name, description, new Date().toISOString()]
        );
        // @ts-ignore
        return result.lastInsertRowid;
    },

    delete: async (id: number): Promise<void> => {
        await window.electronAPI.dbQuery('DELETE FROM product_groups WHERE id = ?', [id]);
    },

    addProduct: async (groupId: number, productId: number): Promise<void> => {
        // Check if exists
        const exists = await window.electronAPI.dbQuery(
            'SELECT id FROM product_group_items WHERE group_id = ? AND product_id = ?',
            [groupId, productId]
        );

        if (exists.length === 0) {
            await window.electronAPI.dbQuery(
                'INSERT INTO product_group_items (group_id, product_id) VALUES (?, ?)',
                [groupId, productId]
            );
        }
    },

    removeProduct: async (groupId: number, productId: number): Promise<void> => {
        await window.electronAPI.dbQuery(
            'DELETE FROM product_group_items WHERE group_id = ? AND product_id = ?',
            [groupId, productId]
        );
    },

    getGroupProducts: async (groupId: number): Promise<Product[]> => {
        return await window.electronAPI.dbQuery(`
            SELECT p.* 
            FROM products p
            JOIN product_group_items gi ON p.id = gi.product_id
            WHERE gi.group_id = ?
        `, [groupId]);
    }
};
