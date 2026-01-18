import Fuse from 'fuse.js';

interface KnowledgeEntry {
    topics: string[];
    response: string | (() => string); // Support dynamic responses
    keywords: string[];
}

class KnowledgeBase {
    private knowledge: KnowledgeEntry[] = [
        // --- Greetings & Personality (Dynamic) ---
        {
            topics: ['Hello', 'Hi', 'Hey', 'Greetings'],
            keywords: ['hello', 'hi', 'hey', 'greetings', 'yo', 'sup'],
            response: () => {
                const hour = new Date().getHours();
                const timeOfDay = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
                return `👋 **Good ${timeOfDay}!**\nI'm ready to help. Try "New Bill" or "Show Profit".`;
            }
        },
        {
            topics: ['Positive Feedback', 'Compliment'],
            keywords: ['great', 'awesome', 'good', 'nice', 'cool', 'thanks', 'thank', 'amazing', 'excellent', 'perfect'],
            response: () => {
                const replies = [
                    "😊 **Glad I could help!** Let me know if you need anything else.",
                    "🚀 **Awesome!** I'm here to keep things running smoothly.",
                    "🙌 **Great to hear!** Making your store smarter, one command at a time.",
                    "🤖 **You're welcome!** Just doing my job."
                ];
                return replies[Math.floor(Math.random() * replies.length)];
            }
        },
        {
            topics: ['Who are you', 'Identity'],
            keywords: ['who', 'you', 'name', 'bot', 'identity', 'created'],
            response: "🤖 **I am POS-AI Gen2.**\nDesigned to manage your store efficiently. I don't sleep, I don't take breaks, and I love data."
        },
        {
            topics: ['How are you', 'Status'],
            keywords: ['how', 'are', 'you', 'doing', 'status'],
            response: "⚡ **Systems Operational.**\nDatabase: Connected\nSync: Active\nMood: Ambitious"
        },
        {
            topics: ['Joke', 'Fun'],
            keywords: ['joke', 'funny', 'laugh'],
            response: () => {
                const jokes = [
                    "Why did the database break up with the server? She found someone with more cache.",
                    "Reviewing sales data... 404 Profit Not Found. Just kidding! 🤑",
                    "I would tell you a UDP joke, but you might not get it."
                ];
                return `😂 **Here's one:**\n${jokes[Math.floor(Math.random() * jokes.length)]}`;
            }
        },

        // --- Core Features & Help ---
        {
            topics: ['Billing Help', 'How to bill'],
            keywords: ['bill', 'invoice', 'sale', 'sell', 'checkout'],
            response: "🧾 **Billing Guide:**\n1. Scan product or press `F2` to search.\n2. Adjust qty with `+` / `-` keys.\n3. Press `F12` to Checkout.\n\n*Shortcut: Say 'Add 2 Milk' to skip steps.*"
        },
        {
            topics: ['Search Product', 'Find Item'],
            keywords: ['search', 'find', 'lookup', 'price', 'cost'],
            response: "🔍 **Product Search:**\nPress `F2` to open the global search bar. You can search by Name, Barcode, or even dynamic Alias."
        },
        {
            topics: ['Return Policy', 'Refunds'],
            keywords: ['return', 'refund', 'exchange', 'policy'],
            response: "🔄 **Return Policy:**\nItems can be returned within 7 days with the original bill. processing a return? Go to **Sales History** > **Select Bill** > **Return Items**."
        },

        // --- Troubleshooting ---
        {
            topics: ['Printer Issue', 'Print fail'],
            keywords: ['print', 'printer', 'paper', 'jam', 'receipt'],
            response: "🖨️ **Printer Troubleshooting:**\n1. Check if printer is ON and connected.\n2. Verify paper roll is not empty.\n3. Go to **Settings > Hardware** to test connection."
        },
        {
            topics: ['Scanner Issue'],
            keywords: ['scan', 'scanner', 'barcode', 'reader'],
            response: "🔫 **Scanner Fix:**\nEnsure the scanner USB is plugged in tightly. If it beeps but doesn't enter text, click on the search box to focus it."
        },
        {
            topics: ['Login Failed', 'Password reset'],
            keywords: ['login', 'password', 'access', 'user'],
            response: "🔐 **Access Control:**\nIf you forgot your PIN, please contact the Store Administrator. Default Admin PIN is often `1234` or `0000`."
        },

        // --- Reports & Analytics ---
        {
            topics: ['Profit', 'Margin'],
            keywords: ['profit', 'margin', 'earn', 'revenue'],
            response: "💰 **Profitability:**\nI track your purchase vs sales price. Ask *\"Show profit today\"* to see your net earnings instantly."
        },
        {
            topics: ['Tax/GST'],
            keywords: ['tax', 'gst', 'vat', 'duty'],
            response: "🏛️ **Tax Management:**\nAll sales are recorded with GST. You can export a **GSTR-1** compatible report from the Reports page."
        }
    ];

    private fuse: Fuse<KnowledgeEntry>;

    constructor() {
        this.fuse = new Fuse(this.knowledge, {
            keys: ['topics', 'keywords'],
            threshold: 0.4,
            distance: 100,
        });
    }

    public ask(query: string): string | null {
        // 1. Direct Keyword Check (Strict Word Boundary)
        for (const entry of this.knowledge) {
            for (const k of entry.keywords) {
                const regex = new RegExp(`\\b${k}\\b`, 'i');
                if (regex.test(query) && query.split(' ').length < 6) {
                    return this.resolveResponse(entry.response);
                }
            }
        }

        // 2. Fuzzy Search
        const results = this.fuse.search(query);
        if (results.length > 0) {
            const best = results[0];
            if (best.score && best.score < 0.5) {
                return this.resolveResponse(best.item.response);
            }
        }

        return null;
    }

    private resolveResponse(response: string | (() => string)): string {
        if (typeof response === 'function') {
            return response();
        }
        return response;
    }
}

export const knowledgeBase = new KnowledgeBase();
