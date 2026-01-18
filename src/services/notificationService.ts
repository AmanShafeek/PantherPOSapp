
import { productService } from './productService';

export interface Notification {
    id: number;
    type: 'LOW_STOCK' | 'SYSTEM';
    title: string;
    message: string;
    is_read: number; // 0 or 1
    created_at: string;
}

export const notificationService = {
    // Queries the DB and generates triggers
    checkStockLevels: async () => {
        try {
            // 1. Get all products with stock <= min_stock
            const products = await productService.getAll();
            const lowStockItems = products.filter(p => p.stock <= (p.min_stock_level || 5));

            if (lowStockItems.length === 0) return;

            // 2. Get existing unread notifications to avoid duplication
            // A smarter way would be to check if we alerted 'recently', but for now, 
            // if an unread alert exists for "Low Stock", we might group them or just append.
            // Simpler: Just create a "Low Stock Alert" summary.

            // Or better: Create individual alerts for critical items, but maybe cap it.
            // Let's create one summary alert if many, or individuals if few.

            if (lowStockItems.length > 5) {
                await window.electronAPI.addNotification({
                    type: 'LOW_STOCK',
                    title: 'Multiple Low Stock Items',
                    message: `${lowStockItems.length} products are below their minimum stock level. Please check inventory.`
                });
            } else {
                for (const item of lowStockItems) {
                    // Check if we already have an unread notification for this specific item? 
                    // Since we don't store product_id in notification table (simplified schema), 
                    // we'll rely on string matching or just allow duplicates for now (user reads and clears).
                    // To prevent spam on EVERY restart, we could check if the latest notification title contains the item name.

                    const recent = await window.electronAPI.getNotifications(true); // Unread only
                    const alreadyAlerted = recent.some((n: any) => n.title.includes(item.name));

                    if (!alreadyAlerted) {
                        await window.electronAPI.addNotification({
                            type: 'LOW_STOCK',
                            title: `Low Stock: ${item.name}`,
                            message: `Current Stock: ${item.stock}. Minimum: ${item.min_stock_level || 5}. Please restock.`
                        });
                    }
                }
            }
        } catch (e) {
            console.error('Stock check failed', e);
        }
    },

    getAll: async (unreadOnly = false) => {
        return await window.electronAPI.getNotifications(unreadOnly);
    },

    markRead: async (id: number) => {
        return await window.electronAPI.markNotificationRead(id);
    },

    markAllRead: async () => {
        return await window.electronAPI.markAllNotificationsRead();
    }
};
