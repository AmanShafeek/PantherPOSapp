import { eventBus } from '../utils/EventBus';
import { toast } from 'react-hot-toast';

export const proactiveService = {
    init: () => {
        console.log("🤖 Proactive Service Initialized");

        // 1. Listen for App Init or Sales to check stock
        eventBus.on('APP_INIT', () => proactiveService.checkLowStock());
        eventBus.on('SALE_COMPLETED', () => {
            proactiveService.checkLowStock();
            // Future: Check daily target progress?
        });

        // 2. Listen for Customer Selection
        eventBus.on('CUSTOMER_SELECTED', (customer) => {
            proactiveService.handleCustomerInsight(customer);
        });

        // Initial check on load (delayed slightly)
        setTimeout(() => proactiveService.checkLowStock(), 5000);
    },

    checkLowStock: async () => {
        try {
            // Find items with stock < min_stock (default 5)
            console.log('[Proactive] Checking for low stock items...');
            const lowStockItems = await window.electronAPI.dbQuery(`
                SELECT name, stock, min_stock_level FROM products 
                WHERE stock <= COALESCE(min_stock_level, 5) 
                LIMIT 3
            `);

            console.log('[Proactive] Low stock query result:', lowStockItems);

            if (lowStockItems && lowStockItems.length > 0) {
                const names = lowStockItems.map((i: any) => `${i.name} (${i.stock})`).join(', ');
                console.log('[Proactive] Triggering toast for:', names);

                // Don't spam: Check if we recently alerted? (For now, simple implementation)
                // Use a custom toast with longer duration
                toast(`⚠️ **Low Stock Alert**\nTime to reorder:\n${names}`, {
                    duration: 6000,
                    icon: '📦',
                    style: {
                        borderRadius: '12px',
                        background: '#333',
                        color: '#fff',
                        border: '1px solid #C53030'
                    }
                });
                return lowStockItems;
            } else {
                console.log('[Proactive] No low stock items found.');
                return [];
            }
        } catch (error) {
            console.error('[Proactive] Stock check failed', error);
            return [];
        }
    },

    handleCustomerInsight: async (customer: any) => {
        if (!customer || !customer.id) return;

        try {
            // 1. Get Top Product
            const topProducts = await window.electronAPI.dbQuery(`
                SELECT p.name, SUM(bi.quantity) as total_qty
                FROM bill_items bi
                JOIN bills b ON bi.bill_id = b.id
                JOIN products p ON bi.product_id = p.id
                WHERE b.customer_id = ?
                GROUP BY p.id
                ORDER BY total_qty DESC
                LIMIT 1
            `, [customer.id]);

            // 2. Get Last Visit
            const lastVisit = await window.electronAPI.dbQuery(`
                SELECT date FROM bills WHERE customer_id = ? ORDER BY date DESC LIMIT 1
            `, [customer.id]);

            if (topProducts.length > 0) {
                const fav = topProducts[0].name;
                const lastDate = lastVisit.length > 0 ? new Date(lastVisit[0].date).toLocaleDateString() : 'N/A';

                toast(`👋 **Welcome Back, ${customer.name.split(' ')[0]}**\n\n⭐ Favorite: ${fav}\n📅 Last Visit: ${lastDate}`, {
                    duration: 5000,
                    icon: '👤',
                    style: {
                        borderRadius: '12px',
                        background: '#0F172A', // Slate 900
                        color: '#38BDF8', // Sky 400
                        border: '1px solid #0EA5E9'
                    }
                });
            }
        } catch (error) {
            console.error('[Proactive] Customer insight failed', error);
        }
    }
};
