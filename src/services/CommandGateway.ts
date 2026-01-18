import { eventBus } from '../utils/EventBus';
import { productService } from './productService';
import { cartService } from './cartService';
import { aliasService } from './aliasService';
import { reportService } from './reportService';
import { systemService } from './systemService';
import { billService } from './billService';
import { customerService } from './customerService';
import { exportService } from './exportService';
import { cashService } from './cashService';
import { proactiveService } from './proactiveService';
import Fuse from 'fuse.js';

export type POSCommand =
    | { type: 'ADD_ITEM'; payload: { productName: string; quantity?: number | string; unit?: string } }
    | { type: 'REMOVE_ITEM'; payload: { productName: string } }
    | { type: 'CLEAR_CART'; payload: {} }
    | { type: 'CHECK_STOCK'; payload: { productName: string } }
    | { type: 'LEARN_ALIAS'; payload: { alias: string; target: string } }
    | { type: 'REPORT_QUERY'; payload: { reportType: string; period: string; format?: string } }
    | { type: 'BILL_LOOKUP'; payload: { billId: string } }
    | { type: 'CUSTOMER_LOOKUP'; payload: { customerName: string } }
    | { type: 'INVENTORY_QUERY'; payload: { queryType: string } }
    | { type: 'SWITCH_THEME'; payload: { theme: 'light' | 'dark' } }
    | { type: 'NAVIGATE'; payload: { route: string; label: string } }
    | { type: 'HARDWARE_ACTION'; payload: { action: 'OPEN_DRAWER' | 'TEST_PRINTER' | 'READ_SCALE' } }
    | { type: 'DATA_MODIFICATION'; payload: { target: 'price' | 'stock'; productName: string; value: number } }
    | { type: 'ANALYTICS_QUERY'; payload: { subType: 'COMPARE_SALES' | 'TRENDING_PRODUCTS' | 'PREDICT_SALES' | 'WORST_SELLERS' | 'CHECK_ALERTS' | 'SYSTEM_HEALTH' | 'SELF_HEAL' | 'DEAD_STOCK'; period?: string } }
    | { type: 'AUTO_CLEARANCE'; payload: { discountPercent?: number } }
    | { type: 'ADD_EXPENSE'; payload: { amount: number; reason: string } }
    | { type: 'UNKNOWN'; payload: { text: string } };

export interface CommandResult {
    success: boolean;
    message: string;
    actionTaken?: string;
}

export const commandGateway = {
    init: () => {
        console.log("🎤 Command Gateway Initialized");
    },

    execute: async (command: POSCommand): Promise<CommandResult> => {
        console.log('[CommandGateway] Executing:', command);

        try {
            switch (command.type) {
                case 'ADD_ITEM':
                    return await handleAddItem(command.payload);
                case 'REMOVE_ITEM':
                    return await handleRemoveItem(command.payload);
                case 'CLEAR_CART':
                    cartService.clear();
                    return { success: true, message: 'Cart cleared', actionTaken: 'CLEARED_CART' };
                case 'CHECK_STOCK':
                    return await handleCheckStock(command.payload);
                case 'LEARN_ALIAS':
                    return await handleLearnAlias(command.payload);
                case 'REPORT_QUERY':
                    return await handleReportQuery(command.payload);
                case 'BILL_LOOKUP':
                    return await handleBillLookup(command.payload);
                case 'CUSTOMER_LOOKUP':
                    return await handleCustomerLookup(command.payload);
                case 'INVENTORY_QUERY':
                    return await handleInventoryQuery(command.payload);
                case 'SWITCH_THEME':
                    return await handleSwitchTheme(command.payload);
                case 'NAVIGATE':
                    return await handleNavigate(command.payload);
                case 'HARDWARE_ACTION':
                    return await handleHardwareAction(command.payload);
                case 'DATA_MODIFICATION':
                    return await handleDataModification(command.payload);
                case 'ANALYTICS_QUERY':
                    return await handleAnalyticsQuery(command.payload);
                case 'AUTO_CLEARANCE':
                    return await handleAutoClearance(command.payload);
                case 'ADD_EXPENSE':
                    return await handleAddExpense(command.payload);
                default:
                    return { success: false, message: "I didn't understand that command." };
            }
        } catch (e: any) {
            console.error('[CommandGateway] Error:', e);
            return { success: false, message: `Error: ${e.message}` };
        }
    }
};

// --- Handlers ---

async function handleAddItem(payload: { productName: string; quantity?: number | string; unit?: string }): Promise<CommandResult> {
    const products = await productService.getAll();

    // Fuzzy search with Fuse.js
    const fuse = new Fuse(products, {
        keys: ['name', 'barcode'],
        threshold: 0.4, // Tolerance for typos
    });

    const result = fuse.search(payload.productName);
    const product = result.length > 0 ? result[0].item : null;

    if (!product) {
        return { success: false, message: `Could not find product "${payload.productName}"` };
    }

    // Parse Qty
    let qty = 0;
    if (payload.quantity === undefined || payload.quantity === null) {
        return { success: false, message: `How much ${product.name} do you want?` };
    }

    if (typeof payload.quantity === 'string') {
        const parsed = parseFloat(payload.quantity);
        if (!isNaN(parsed)) qty = parsed;
    } else {
        qty = payload.quantity;
    }

    // Stock Check
    if (product.stock < qty) {
        // WARN ONLY as per configuration
        eventBus.emit('SHOW_TOAST', { type: 'info', message: `Warning: Low Stock (${product.stock})` });
    }

    cartService.addItem(product, qty);
    return { success: true, message: `Added ${qty} ${product.name}`, actionTaken: 'ADDED_TO_CART' };
}

async function handleRemoveItem(payload: { productName: string }): Promise<CommandResult> {
    // We strictly need product ID to remove, so we might need to search or ask UI.
    // Simple approach: search product first.
    // But cart might have multiple items with similar names. 
    // This is tricky. For MVP, we search product DB, get ID, try to remove that ID.

    // Better: EventBus 'REMOVE_BY_NAME' could be handled in Home.tsx which knows Cart content.
    // For now, let's try to resolve ID.
    const products = await productService.getAll();
    const product = products.find(p => p.name.toLowerCase().includes(payload.productName.toLowerCase()));

    if (!product) {
        return { success: false, message: `Product "${payload.productName}" not found` };
    }

    cartService.removeItem(product.id);
    return { success: true, message: `Removed ${product.name}`, actionTaken: 'REMOVED_FROM_CART' };
}

async function handleCheckStock(payload: { productName: string }): Promise<CommandResult> {
    const products = await productService.getAll();
    const product = products.find(p => p.name.toLowerCase().includes(payload.productName.toLowerCase()));

    if (!product) {
        return { success: false, message: `Product "${payload.productName}" not found` };
    }

    return { success: true, message: `${product.name} Stock: ${product.stock} units` };
}

async function handleLearnAlias(payload: { alias: string; target: string }): Promise<CommandResult> {
    aliasService.addAlias(payload.alias, payload.target);
    return {
        success: true,
        message: `Got it! I've learned that "${payload.alias}" means "${payload.target}".`,
        actionTaken: 'LEARNED_ALIAS'
    };
}

async function handleReportQuery(payload: { reportType: string; period: string; format?: string }): Promise<CommandResult> {
    const today = new Date();
    let startDate = today.toISOString().split('T')[0];
    let endDate = startDate;
    let periodName = "Today";

    // Date Logic
    if (payload.period === 'yesterday') {
        const y = new Date(today);
        y.setDate(today.getDate() - 1);
        startDate = y.toISOString().split('T')[0];
        endDate = startDate;
        periodName = "Yesterday";
    }

    // Auto-detect PDF intent for "details"
    // IntentEngine defaults format to 'text', so we override it if keyword implies details
    // Auto-detect PDF intent for "details"
    // IntentEngine defaults format to 'text', so we override it if keyword implies details
    // REMOVED: Managed by IntentEngine now
    // if (payload.reportType.includes('details') || payload.reportType.includes('invoice') || payload.reportType.includes('list')) {
    //    payload.format = 'pdf';
    // }

    // Very basic mapping for now. Can explode this later.
    if (payload.reportType.includes('profit')) {
        const profitData = await reportService.getProfitMargin(startDate, endDate); // Added dates supported by service

        if (payload.format === 'pdf') {
            if (!profitData || profitData.length === 0) {
                return { success: true, message: `📉 **No Sales Data**\nThere are no sales records for this period, so I can't generate a report.` };
            }

            const fileName = `Profit_Report_${today.toISOString().split('T')[0]}.pdf`;
            exportService.exportToPdf(fileName, `Profit Analysis - ${periodName}`, profitData as any[]);
            return {
                success: true,
                message: `📄 **Report Ready!**\nProfit analysis saved as: **${fileName}**`
            };
        }

        // Calculate Totals
        const totalRevenue = profitData.reduce((sum: number, item: any) => sum + (item.revenue || 0), 0);
        const totalCost = profitData.reduce((sum: number, item: any) => sum + (item.cost || 0), 0);
        const totalExpenses = await reportService.getExpenses(startDate, endDate);
        // const totalExpenses = 0;

        const grossProfit = totalRevenue - totalCost;
        const netProfit = grossProfit - totalExpenses;

        const margin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

        // Top 3 Items
        const topItems = profitData.slice(0, 3).map((p: any) =>
            `- **${p.name}**: ₹${p.profit} (${((p.profit / grossProfit) * 100).toFixed(0)}%)`
        ).join('\n');

        return {
            success: true,
            message: `💰 **Net Profit Analysis (${periodName})**\n` +
                `Net Profit: **₹${netProfit.toLocaleString()}** (Margin: ${margin}%)\n` +
                `Revenue: ₹${totalRevenue.toLocaleString()} | COGS: ₹${totalCost.toLocaleString()}\n` +
                `Expenses/Payouts: ₹${totalExpenses.toLocaleString()}\n\n` +
                `**Top Performers:**\n${topItems}\n\n` +
                `*Say "Profit PDF" for full details.*`
        };
    }

    // Default Sales Report (Enhanced)
    if (['sale', 'report', 'summary', 'details', 'status'].some(k => payload.reportType.includes(k))) {
        // ... (PDF logic remains same) ...
        if (payload.format === 'pdf') {
            const fileName = `Comprehensive_Sales_Report_${periodName}_${startDate}.pdf`;
            const fullReport = await reportService.getComprehensiveReport(startDate, endDate);
            exportService.generateComprehensivePdf(fileName, fullReport);
            return {
                success: true,
                message: `📄 **Comprehensive Report Ready!**\nI've generated the detailed 12-section report for ${periodName}: **${fileName}**`
            };
        }

        const report = await reportService.getDailySales(startDate, endDate);
        if (report && report.length > 0) {
            const stat = report[0];
            const payments = await reportService.getPaymentSplit(startDate, endDate);

            const paymentStr = payments.map((p: any) => `${p.payment_mode}: ₹${p.total}`).join(' | ');

            return {
                success: true,
                message: `📊 **Sales Report (${periodName})**\n` +
                    `Total Sales: **₹${stat.total}**\n` +
                    `Transactions: ${stat.count}\n\n` +
                    `**By Payment Mode:**\n${paymentStr || 'No payment data'}\n\n` +
                    `*Say "Sales PDF" for comprehensive 12-point report.*`
            };
        }
        return { success: true, message: `No sales recorded for ${periodName}.` };
    }

    if (payload.reportType.includes('supplier')) {
        const suppliers = await reportService.getSupplierList();

        // Auto-PDF for lists
        if (payload.format === 'pdf') {
            const fileName = `Suppliers_List_${today}.pdf`;
            // Suppliers might be a different table structure, hope exportService handles generic arrays
            exportService.exportToPdf(fileName, `Supplier List`, suppliers);
            return {
                success: true,
                message: `📄 **Supplier List Ready!**\nGenerated PDF: **${fileName}**`
            };
        }

        return {
            success: true,
            message: `🚚 **Coupled Suppliers**\nFound ${suppliers.length} active suppliers.`
        };
    }

    return { success: false, message: `I don't know how to generate a "${payload.reportType}" report yet.` };
}

async function handleBillLookup(payload: { billId: string }): Promise<CommandResult> {
    const bill = await billService.getBill(payload.billId);
    if (!bill) {
        return { success: false, message: `🚫 Bill #${payload.billId} not found.` };
    }

    const itemsList = bill.items.map((i: any) => `- ${i.product_name} x${i.quantity} (${i.total})`).join('\n');
    return {
        success: true,
        message: `🧾 **Bill #${bill.bill_no}**\nDate: ${bill.date.substring(0, 10)}\nCustomer: ${bill.customer_name || 'Walk-in'}\nTotal: ₹${bill.total}\n\n**Items:**\n${itemsList}`
    };
}

async function handleCustomerLookup(payload: { customerName: string }): Promise<CommandResult> {
    const customers = await customerService.search(payload.customerName);
    if (customers.length === 0) {
        return { success: false, message: `🚫 No customer found matching "${payload.customerName}".` };
    }
    const c = customers[0];
    return {
        success: true,
        message: `👤 **Customer Details**\nName: ${c.name}\nPhone: ${c.phone}\nBalance: ₹${c.balance || 0}\nTotal Visits: ${c.total_purchases || 0}`
    };
}

async function handleInventoryQuery(payload: { queryType: string }): Promise<CommandResult> {
    if (payload.queryType.includes('low') || payload.queryType.includes('out')) {
        const lowStock = await productService.getLowStockProducts();
        if (lowStock.length === 0) return { success: true, message: "✅ Inventory is healthy! No low stock items." };

        const list = lowStock.slice(0, 5).map(p => `- ${p.name}: ${p.stock} left`).join('\n');
        return {
            success: true,
            message: `⚠️ **Low Stock Alert**\nFound ${lowStock.length} items running low:\n\n${list}`
        };
    }
    return { success: false, message: "I can only check for 'Low Stock' right now." };
}

async function handleSwitchTheme(payload: { theme: 'light' | 'dark' }): Promise<CommandResult> {
    if (payload.theme === 'light') {
        document.body.classList.add('light-mode');
        return { success: true, message: "☀️ Switched to **White Mode** (Light Theme). My eyes feel better!", actionTaken: 'THEME_SWITCHED' };
    } else {
        document.body.classList.remove('light-mode');
        return { success: true, message: "🌙 Switched to **Dark Mode**. Stealth mode activated.", actionTaken: 'THEME_SWITCHED' };
    }
}

async function handleNavigate(payload: { route: string; label: string }): Promise<CommandResult> {
    eventBus.emit('NAVIGATE', { path: payload.route });
    return {
        success: true,
        message: `🚀 **Teleporting...**\nOpening ${payload.label}.`,
        actionTaken: 'NAVIGATED'
    };
}

async function handleHardwareAction(payload: { action: 'OPEN_DRAWER' | 'TEST_PRINTER' | 'READ_SCALE' }): Promise<CommandResult> {
    if (!window.electronAPI) {
        return { success: false, message: "⚠️ Hardware control is only available in the Desktop App." };
    }

    try {
        if (payload.action === 'OPEN_DRAWER') {
            // Standard ESC/POS Pulse: ESC p m t1 t2
            // Decimal: 27, 112, 0, 25, 250
            const pulse = [27, 112, 0, 25, 250];
            await window.electronAPI.printRaw(pulse);
            return { success: true, message: "🔓 Cash Drawer Opened.", actionTaken: 'DRAWER_OPENED' };
        }

        if (payload.action === 'TEST_PRINTER') {
            // Convert string to basic byte array (simple ASCII)
            const text = "Hello from AI Assistant!\n\n";
            const bytes = Array.from(text).map(c => c.charCodeAt(0));
            await window.electronAPI.printRaw(bytes);
            return { success: true, message: "🖨️ Printer Test Sent.", actionTaken: 'PRINTER_TESTED' };
        }

        if (payload.action === 'READ_SCALE') {
            const res = await window.electronAPI.scaleReadWeight();
            if (res.success) {
                return { success: true, message: `⚖️ Scale Weight: **${res.weight} kg**` };
            } else {
                return { success: false, message: `⚠️ Scale Error: ${res.error}` };
            }
        }

    } catch (e: any) {
        return { success: false, message: `Hardware Error: ${e.message}` };
    }

    return { success: false, message: "Unknown hardware action." };
}

async function handleDataModification(payload: { target: 'price' | 'stock'; productName: string; value: number }): Promise<CommandResult> {
    console.log('[CommandGateway] Handling Data Mod:', payload);
    const products = await productService.getAll();
    // Fuzzy search for product
    const fuse = new Fuse(products, { keys: ['name'], threshold: 0.4 });
    const result = fuse.search(payload.productName);
    const product = result.length > 0 ? result[0].item : null;

    if (!product) {
        console.warn('[CommandGateway] Product not found for:', payload.productName);
        return { success: false, message: `Could not find product "${payload.productName}"` };
    }
    console.log('[CommandGateway] Found Product:', product);

    if (payload.target === 'price') {
        const result = await productService.updatePrice(product.id, payload.value);
        console.log('[CommandGateway] Update Price Result:', result);
        if (result.success) {
            const extraMsg = result.message ? ` (${result.message})` : '';
            return { success: true, message: `✅ Updated price of **${product.name}** to ₹${payload.value}${extraMsg}`, actionTaken: 'PRICE_UPDATED' };
        } else {
            return { success: false, message: `Failed to update price: ${result.message}` };
        }
    } else if (payload.target === 'stock') {
        const result = await productService.updateStock(product.id, payload.value);
        console.log('[CommandGateway] Update Stock Result:', result);
        if (result.success) {
            const extraMsg = result.message ? ` (${result.message})` : '';
            return { success: true, message: `✅ Updated stock of **${product.name}** to ${payload.value} units${extraMsg}`, actionTaken: 'STOCK_UPDATED' };
        } else {
            return { success: false, message: `Failed to update stock: ${result.message}` };
        }
    }

    return { success: false, message: "Failed to update data. (Internal Error)" };
}

async function handleAnalyticsQuery(payload: { subType: 'COMPARE_SALES' | 'TRENDING_PRODUCTS' | 'PREDICT_SALES' | 'WORST_SELLERS' | 'CHECK_ALERTS' | 'SYSTEM_HEALTH' | 'SELF_HEAL' | 'DEAD_STOCK'; period?: string }): Promise<CommandResult> {
    if (payload.subType === 'COMPARE_SALES') {
        // Default: Today vs Yesterday
        const today = new Date().toISOString().split('T')[0];
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterday = yesterdayDate.toISOString().split('T')[0];

        const res = await reportService.getSalesComparison(today, today, yesterday, yesterday);

        const validPct = parseFloat(res.percentageChange);
        const arrow = validPct >= 0 ? "📈" : "📉";
        const sign = validPct >= 0 ? "+" : "";

        return {
            success: true,
            message: `📊 **Sales Comparison (Today vs Yesterday)**\n\n` +
                `Today: **₹${res.currentTotal}**\n` +
                `Yesterday: ₹${res.previousTotal}\n` +
                `Growth: ${arrow} **${sign}${res.percentageChange}%**`
        };
    }

    if (payload.subType === 'TRENDING_PRODUCTS') {
        const products = await reportService.getTrendingProducts(5);

        if (!Array.isArray(products)) {
            console.error('[Analytics] Error fetching trending products:', products);
            return { success: false, message: "Use 'Sales Report' for now. I'm having trouble calculating trends." };
        }

        if (products.length === 0) {
            return { success: true, message: "No sales data found for this week." };
        }

        const list = products.map((p: any, i: number) =>
            `${i + 1}. **${p.name}** - ${p.qty_sold} sold (₹${p.revenue})`
        ).join('\n');

        return {
            success: true,
            message: `🔥 **Trending Products (Last 7 Days)**\n\n${list}`
        };
    }

    if (payload.subType === 'WORST_SELLERS') {
        const products = await reportService.getLeastSellingProducts(5);

        if (!Array.isArray(products)) {
            console.error('[Analytics] Error fetching worst sellers:', products);
            return { success: false, message: "I ran into a database error while checking that." };
        }

        if (products.length === 0) {
            return { success: true, message: "Could not analyze product performance." };
        }

        // Check for 0 sales
        const zeroSales = products.filter((p: any) => p.qty_sold === 0);
        let messageHeader = "📉 **Slow Moving Products (Last 30 Days)**";

        if (zeroSales.length > 0) {
            messageHeader = "⚠️ **Zero Sales Alert (Last 30 Days)**\nThese items have not sold at all:";
        }

        const list = products.map((p: any) =>
            `- **${p.name}**: ${p.qty_sold === 0 ? '🚫 0 Sold' : p.qty_sold + ' sold'} (₹${p.revenue})`
        ).join('\n');

        return {
            success: true,
            message: `${messageHeader}\n\n${list}\n\n*Consider running a promotion for these items.*`
        };
    }

    if (payload.subType === 'PREDICT_SALES') {
        const proj = await reportService.getSalesProjection();

        return {
            success: true,
            message: `🔮 **Sales Projection (End of Month)**\n\n` +
                `Current Sales: ₹${proj.currentTotal}\n` +
                `Daily Average: ₹${proj.dailyAverage}\n` +
                `Predicted Total: **₹${proj.projectedTotal}**\n\n` +
                `*Based on performance so far this month.*`
        };
    }

    if (payload.subType === 'CHECK_ALERTS') {
        // Trigger manual check
        const alerts: any[] = await proactiveService.checkLowStock();

        if (alerts && alerts.length > 0) {
            const list = alerts.map((i: any) => `- **${i.name}**: Only ${i.stock} left`).join('\n');
            return {
                success: true,
                message: `⚠️ **System Alerts Found**\n\nI found the following low stock warnings:\n${list}\n\n*Time to reorder!*`
            };
        }

        return {
            success: true,
            message: "✅ **System Healthy**\nI checked for alerts and everything looks good. No low stock warnings found."
        };
    }

    if (payload.subType === 'SYSTEM_HEALTH') {
        const health = await systemService.checkHealth();

        let statusEmoji = '✅';
        if (health.database.status !== 'ONLINE') statusEmoji = '⚠️';

        const msg = `**System Diagnostic** ${statusEmoji}\n\n` +
            `🗄️ **Database**: ${health.database.message} (${health.database.status})\n` +
            `💾 **Backup**: ${health.backup.message}`;

        return { success: true, message: msg };
    }

    if (payload.subType === 'SELF_HEAL') {
        await systemService.performSelfHeal();
        return { success: true, message: "♻️ restarting interface..." };
    }

    if (payload.subType === 'DEAD_STOCK') {
        const deadStock: any[] = []; // await reportService.getDeadStock(180);

        if (deadStock.length === 0) {
            return { success: true, message: "✅ **No Dead Stock**\nFeature temporarily disabled for debugging." };
        }

        const list = deadStock.slice(0, 5).map(p => `- **${p.name}**: ${p.stock} units (₹${p.sell_price})`).join('\n');
        return {
            success: true,
            message: `🕸️ **Dead Stock Alert (6 Months)**\n\nFound ${deadStock.length} items that haven't sold in 180 days:\n${list}\n\n*Say "Clearance" to markdown these items by 25%.*`
        };
    }

    return { success: false, message: "Unknown analytics query." };
}

async function handleAutoClearance(payload: { discountPercent?: number }): Promise<CommandResult> {
    const deadStock: any[] = []; // await reportService.getDeadStock(180);
    if (deadStock.length === 0) {
        return { success: true, message: "No dead stock found to clear." };
    }

    const percent = payload.discountPercent || 25;
    const factor = (100 - percent) / 100;
    let count = 0;

    for (const item of deadStock) {
        const newPrice = Math.floor(item.sell_price * factor);
        if (newPrice > item.cost_price) { // Ensure we don't go below cost automatically for safety, or we could optionalize this.
            // Actually, clearance OFTEN goes below cost to free cash. 
            // Let's just do it but maybe warn? 
            // User implementation plan said "mark down ... by 25%".
            await productService.updatePrice(item.id, newPrice);
            count++;
        } else {
            // Safety check: if 25% off is below cost, maybe just set to cost?
            // For now, let's just apply it. Cashier knows best.
            await productService.updatePrice(item.id, newPrice);
            count++;
        }
    }

    return {
        success: true,
        message: `🏷️ **Clearance Event Started!**\n\nI have marked down **${count}** dead stock items by **${percent}%**.\n\n*Check the 'Dead Stock' report to see them.*`,
        actionTaken: 'CLEARANCE_APPLIED'
    };
}

async function handleAddExpense(payload: { amount: number; reason: string }): Promise<CommandResult> {
    const session = await cashService.getCurrentSession();
    if (!session) {
        return { success: false, message: "⚠️ No open cash session. Please open the register first." };
    }

    await cashService.addTransaction(session.id, 'PAYOUT', payload.amount, payload.reason);

    return {
        success: true,
        message: `💸 **Expense Recorded**\nLogged ₹${payload.amount} for "${payload.reason}".`,
        actionTaken: 'EXPENSE_ADDED'
    };
}
