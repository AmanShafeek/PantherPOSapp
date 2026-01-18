import type { POSCommand } from './CommandGateway';
import { aliasService } from './aliasService';

interface IntentPattern {
    regex: RegExp;
    intent: POSCommand['type'];
    extract: (matches: RegExpMatchArray) => any;
}

export class IntentEngine {
    private patterns: IntentPattern[] = [
        // EXPENSE: Top priority to prevent "expense" being treated as a product
        {
            regex: /\b(add|log|record)\s+(expense|cost|spending|payout)\b(.*)/i,
            intent: 'ADD_EXPENSE',
            extract: (matches) => {
                const tail = matches[3] ? matches[3].trim().toLowerCase() : "";

                // 1. Look for amount in the tail
                const amountMatch = tail.match(/(\d+(?:\.\d+)?)/);
                const amount = amountMatch ? parseFloat(amountMatch[0]) : 0;

                // 2. Look for reason
                let reason = "Miscellaneous";

                if (amountMatch) {
                    const cleanTail = tail.replace(amountMatch[0], '')
                        .replace(/\b(rupees|rs|inr)\b/g, '')
                        .replace(/\b(for|on)\b/g, '')
                        .trim();
                    if (cleanTail) reason = cleanTail;
                } else if (tail) {
                    reason = tail.replace(/\b(for|on)\b/g, '').trim();
                }

                return { amount, reason };
            }
        },
        // SWITCH THEME: "Turn on white mode", "Dark mode please"
        {
            regex: /\b(turn|switch|enable|set|change|activate)?.*\b(white|light|day|dark|night)\s+(mode|theme)?/i,
            intent: 'SWITCH_THEME',
            extract: (matches) => {
                const text = matches[0].toLowerCase();
                const isDark = text.includes('dark') || text.includes('night');
                return {
                    theme: isDark ? 'dark' : 'light'
                };
            }
        },
        // NAVIGATION: "Go to settings", "Open dashboard", "Show customers"
        {
            regex: /\b(go to|open|show|view|navigate to|launch)\s+(.+)/i,
            intent: 'NAVIGATE',
            extract: (matches) => {
                const target = matches[2].toLowerCase();
                if (target.includes('dashboard') || target.includes('home')) return { route: '/', label: 'Dashboard' };
                if (target.includes('bill') || target.includes('checkout') || target.includes('sales')) return { route: '/billing', label: 'Billing' };
                if (target.includes('settings') || target.includes('config')) return { route: '/settings', label: 'Settings' };
                if (target.includes('customer') || target.includes('client')) return { route: '/customers', label: 'Customers' };
                if (target.includes('stock') || target.includes('inventory')) return { route: '/stocktake', label: 'Stocktake' };
                if (target.includes('staff') || target.includes('employee')) return { route: '/staff', label: 'Staff Management' };

                return { route: '/', label: 'Home' }; // Fallback
            }
        },
        // HARDWARE: "Open drawer", "Open cash box", "Test printer", "Weigh this"
        {
            regex: /\b(open|test|read|check)\s+(drawer|printer|scale|weight|cash box|till)/i,
            intent: 'HARDWARE_ACTION',
            extract: (matches) => {
                const target = matches[2].toLowerCase();
                if (target.includes('drawer') || target.includes('cash') || target.includes('till')) return { action: 'OPEN_DRAWER' };
                if (target.includes('printer')) return { action: 'TEST_PRINTER' };
                if (target.includes('scale') || target.includes('weight')) return { action: 'READ_SCALE' };

                return { action: 'OPEN_DRAWER' }; // Fallback safe?
            }
        },
        // SYSTEM: "Check alerts", "Any warnings?", "System status"
        {
            regex: /\b(check|show|any)\s+(alerts|warnings|notifications)\b/i,
            intent: 'ANALYTICS_QUERY',
            extract: () => ({ subType: 'CHECK_ALERTS' })
        },
        // SYSTEM OPS: "System status", "Health check", "Reload app"
        {
            regex: /\b(system|health|connection|backup)\s+(status|check)\b/i,
            intent: 'ANALYTICS_QUERY',
            extract: () => ({ subType: 'SYSTEM_HEALTH' })
        },
        {
            regex: /\b(reload|restart|refresh|reset|fix)\s+(app|system|page|ui)\b/i,
            intent: 'ANALYTICS_QUERY',
            extract: () => ({ subType: 'SELF_HEAL' })
        },
        // ANALYTICS: "Compare sales", "Trending items", "Predict revenue", "Not selling"
        {
            regex: /\b(compare|growth|vs|versus|trending|trends|best\s+sell|top\s+sell|predict|forecast|projection|target|not\s+selling|worst\s+sell|least\s+sold|slow\s+moving|dead\s+stock)\b/i,
            intent: 'ANALYTICS_QUERY',
            extract: (matches) => {
                const text = (matches.input || "").toLowerCase();

                if (text.includes('predict') || text.includes('forecast') || text.includes('projection') || text.includes('target')) {
                    return { subType: 'PREDICT_SALES' };
                }

                if (text.includes('trending') || text.includes('trend') || text.includes('best sell') || text.includes('top sell') || text.includes('hot') || text.includes('popular')) {
                    return { subType: 'TRENDING_PRODUCTS' };
                }

                if (text.includes('dead')) {
                    return { subType: 'DEAD_STOCK' };
                }

                if (text.includes('not selling') || text.includes('worst') || text.includes('least') || text.includes('slow')) {
                    return { subType: 'WORST_SELLERS' };
                }

                // Default fallback to comparison (e.g. "compare sales")
                return { subType: 'COMPARE_SALES', period: 'today' };
            }
        },
        // DATA MODIFICATION: "Set price of milk to 20", "Update stock of sugar to 50"
        {
            // Improved Regex: Handles "Update THE stock...", "Set price FOR...", extra spaces
            regex: /\b(set|change|update|make)\s+(?:the\s+)?(price|rate|cost|stock|quantity|inventory)\s+(?:of|for)?\s+(.+)\s+(?:to|as|is)\s+(\d+(?:\.\d+)?)/i,
            intent: 'DATA_MODIFICATION',
            extract: (matches) => {
                const typeInfo = matches[2].toLowerCase();
                const target = (typeInfo.includes('stock') || typeInfo.includes('quantity') || typeInfo.includes('inventory')) ? 'stock' : 'price';
                return {
                    target: target,
                    productName: matches[3].trim(), // Capture group 3 is now product name
                    value: parseFloat(matches[4])   // Capture group 4 is value
                };
            }
        },
        // CLEARANCE SALE: "Clearance", "Start clearance", "Apply clearance"
        {
            regex: /\b(clearance|clear\s+stock|markdown\s+dead)\b/i,
            intent: 'AUTO_CLEARANCE',
            extract: (matches) => {
                const text = matches[0].toLowerCase();
                let percent = 25; // Default
                // Try to extract number if user said "Clearance 50%"
                const numberMatch = text.match(/(\d+)/);
                if (numberMatch) percent = parseInt(numberMatch[0]);

                return { discountPercent: percent };
            }
        },
        // REPORT: "Sales today", "Weekly report", "Show profit this month", "Report as pdf", "Suppliers list"
        {
            // Improved Regex: Matches "Suppliers list", "List of suppliers", "Sales list"
            regex: /\b(sales|report|profit|turnover|collection|details|summary|status|supplier|suppliers|list)\s*(?:of|for)?\s*(today|todays|yesterday|this week|this month|last month|daily|weekly|monthly)?\s*(?:as|in|format)?\s*(?:a)?\s*(pdf|download|list)?/i,
            intent: 'REPORT_QUERY',
            extract: (matches) => {
                const fullText = (matches.input || matches[0] || "").toLowerCase();

                // 1. Explicit PDF override
                if (/\b(pdf|download)\b/.test(fullText)) {
                    return {
                        reportType: matches[1].toLowerCase(),
                        period: matches[2] ? matches[2].toLowerCase().replace('todays', 'today') : 'today',
                        format: 'pdf'
                    };
                }

                // 2. Verb Logic: "Give" implies ownership/file, "Show" implies viewing
                const hasGive = /\b(give|send|generate|get)\b/.test(fullText);
                const hasShow = /\b(show|view|display)\b/.test(fullText);

                // 3. Keyword Context
                const impliesHeavyData = /\b(list|details|invoice)\b/.test(fullText);

                // Rule: If "Give" + Heavy Data -> PDF. Else -> Text.
                const format = (hasGive && impliesHeavyData) ? 'pdf' : 'text';

                return {
                    reportType: matches[1].toLowerCase(),
                    period: matches[2] ? matches[2].toLowerCase().replace('todays', 'today') : 'today',
                    format: format
                };
            }
        },
        // BILL LOOKUP: "Show bill 123", "Get invoice 456"
        {
            regex: /\b(bill|invoice|receipt)\s*(?:no|number|#)?\s*(\d+)/i,
            intent: 'BILL_LOOKUP',
            extract: (matches) => ({
                billId: matches[2]
            })
        },
        // CUSTOMER LOOKUP: "Customer John", "Details of Rahul"
        {
            regex: /\b(customer|client)\s+(.+)/i,
            intent: 'CUSTOMER_LOOKUP',
            extract: (matches) => ({
                customerName: matches[2].trim()
            })
        },
        // INVENTORY/ALERTS: "Low stock", "Expiring items", "Negative stock"
        {
            regex: /\b(low stock|out of stock|dead stock|expiry|negative|alerts)/i,
            intent: 'INVENTORY_QUERY',
            extract: (matches) => ({
                queryType: matches[1].toLowerCase()
            })
        },
        // LEARN ALIAS: "Learn chaya is tea", "Teach mettt to sugar"
        {
            regex: /\b(?:learn|teach|set)\s+(.+)\s+(?:as|is|means|to)\s+(.+)/i,
            intent: 'LEARN_ALIAS',
            extract: (matches) => ({
                alias: matches[1].trim(),
                target: matches[2].trim()
            })
        },
        // CLEAR CART: "Clear cart", "Empty basket"
        {
            regex: /\b(clear|empty|reset)\s+(cart|basket|bill)/i,
            intent: 'CLEAR_CART',
            extract: () => ({})
        },
        // CHECK STOCK: "Stock of milk", "How much sugar"
        {
            regex: /\b(stock|quantity|count|ethra|evide)\s+(of\s+)?(.+)/i,
            intent: 'CHECK_STOCK',
            extract: (matches) => ({
                productName: matches[3].trim()
            })
        },
        // REMOVE ITEM: "Remove milk", "Delete soap"
        {
            regex: /\b(remove|delete|cancel|clear|kalayu|maatu)\s+(.+)/i,
            intent: 'REMOVE_ITEM',
            extract: (matches) => ({
                productName: matches[2].trim()
            })
        },

        // ADD ITEM: "Add 2 milk", "Give me 5 kg sugar", "Need 1 soap"
        {
            regex: /\b(add|give|need|want|tharu|venam|edu)\s+(\d+(?:\.\d+)?)\s*(?:(kg|g|gm|gram|grams|pcs|nos|liter|litre|l|ml))?\s+(.+)/i,
            intent: 'ADD_ITEM',
            extract: (matches) => ({
                quantity: parseFloat(matches[2]),
                unit: matches[3],
                productName: matches[4].trim()
            })
        },
        // ADD ITEM (No Qty, Default 1): "Add milk", "Give soap"
        // THIS IS THE CATCH-ALL FOR "GIVE..." SO IT MUST BE LAST
        {
            regex: /\b(add|give|need|want|tharu|venam|edu)\s+(.+)/i,
            intent: 'ADD_ITEM',
            extract: (matches) => ({
                quantity: undefined, // Undefined triggers "How much?" prompt
                productName: matches[2].trim()
            })
        }
    ];

    // Alias Map for Manglish / Synonyms
    private aliases: Record<string, string> = {
        'paal': 'milk',
        'panjasara': 'sugar',
        'ari': 'rice',
        'vellam': 'water',
        'kadi': 'snacks',
        'mittayi': 'candy',
        'soap': 'soap',
        'chaya': 'tea',
        'kappi': 'coffee'
    };

    public parse(text: string): POSCommand | null {
        const cleanedText = this.preprocess(text);

        for (const pattern of this.patterns) {
            const matches = cleanedText.match(pattern.regex);
            if (matches) {
                console.log(`[IntentEngine] Matched: ${pattern.intent}`, matches);
                const payload = pattern.extract(matches);
                // Post-process payload (e.g., map aliases in product name)
                if (payload.productName) {
                    payload.productName = this.resolveAlias(payload.productName);
                }

                return {
                    type: pattern.intent,
                    payload: payload
                } as POSCommand;
            }
        }

        return null; // No match
    }

    private preprocess(text: string): string {
        // Lowercase, remove special chars?
        // Keep numbers and alphabets
        return text.trim().toLowerCase();
    }

    private resolveAlias(word: string): string {
        // Check dynamic aliases first, then hardcoded (if any left, though we should move hardcoded to init of service)
        // For now, let's trust aliasService.
        // We can ALSO keep the hardcoded map if we want fallback, or migrate them.
        // Let's rely on aliasService + fallback to internal map.
        const dynamic = aliasService.resolve(word);
        if (dynamic !== word.toLowerCase()) return dynamic;

        const lower = word.toLowerCase();
        return this.aliases[lower] || lower;
    }
}

export const intentEngine = new IntentEngine();
