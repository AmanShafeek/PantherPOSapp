import { aliasService } from './aliasService';

interface Question {
    id: string;
    text: string;
    handler: (answer: string) => void;
}

class TrainingService {
    private isTraining = false;
    private currentQuestionIndex = 0;
    private answers: Record<string, string> = {};

    // The "Personality" storage
    private botName = 'QuickBot';
    private userPreferredName = 'Boss';
    private isFriendly = true;
    private _isConfigured = false;

    constructor() {
        this.load();
    }

    private load() {
        try {
            const stored = localStorage.getItem('bot_config');
            if (stored) {
                const data = JSON.parse(stored);
                // Validation: Check if minimal config exists
                if (data.userPreferredName || (data.memories && Object.keys(data.memories).length > 0)) {
                    this.botName = data.botName || 'QuickBot';
                    this.userPreferredName = data.userPreferredName || 'Boss';
                    this.answers = data.memories || {};
                    this._isConfigured = true;
                    return;
                }
            }

            // AUTO-CALIBRATION (Fallback)
            console.log('[TrainingService] No valid config found. Auto-calibrating...');
            this.botName = 'QuickBot';
            this.userPreferredName = 'Boss';
            this.answers = {
                'store_name': 'My Store',
                'shop_type': 'Retail',
                'gst_enabled': 'Yes',
                'inventory_tracking': 'Yes',
                'currency_symbol': '₹'
            };
            this._isConfigured = true;
            this.save(); // Persist immediately

        } catch (e) {
            console.error('Failed to load bot config', e);
            // Default to configured to unblock user
            this._isConfigured = true;
        }
    }

    public isConfigured(): boolean {
        return this._isConfigured;
    }

    private questions: Question[] = [
        // --- PHASE 1: IDENTITY ---
        { id: 'name', text: "Hello! I'm your offline Business AI. First, what should I call you?", handler: (a) => this.userPreferredName = a },
        { id: 'store_name', text: "Nice to comply, Boss! What is the name of this store?", handler: (a) => this.saveMemory('store_name', a) },

        // --- PHASE 2: BUSINESS RULES (MANDATORY) ---
        { id: 'shop_type', text: "Is this a Retail Shop, Restaurant, or Service Business?", handler: (a) => this.saveMemory('shop_type', a) },
        { id: 'gst_enabled', text: "Do you want to enable GST/Tax calculation? (Yes/No)", handler: (a) => this.saveMemory('gst_enabled', a) },
        { id: 'inventory_tracking', text: "Should I strictly track Inventory Stock? (Yes/No)", handler: (a) => this.saveMemory('inventory_tracking', a) },
        { id: 'cash_tracking', text: "Enable Cash Drawer & Shift tracking? (Yes/No)", handler: (a) => this.saveMemory('cash_tracking', a) },
        { id: 'staff_tracking', text: "Do you have staff who need login/tracking? (Yes/No)", handler: (a) => this.saveMemory('staff_tracking', a) },
        { id: 'default_period', text: "When you ask for 'Sales', what should be the default period? (Day/Week/Month)", handler: (a) => this.saveMemory('default_report_period', a) },
        { id: 'currency', text: "What currency symbol should I use? (e.g., ₹, $, £)", handler: (a) => this.saveMemory('currency_symbol', a) },

        // --- PHASE 3: AI SECURITY ---
        { id: 'ai_write', text: "Am I allowed to CHANGE settings if you ask me to? (Yes/No)", handler: (a) => this.saveMemory('ai_can_change_settings', a) },
        { id: 'confirmation', text: "Should I ask for Confirmation before every action? (Always/Critical Only)", handler: (a) => this.saveMemory('confirmation_level', a) },
        { id: 'admin_pin', text: "Is an Admin PIN required for critical changes? If yes, type the PIN (or type 'No')", handler: (a) => this.saveMemory('admin_pin', a) },

        // --- PHASE 4: KNOWLEDGE (SHORT) ---
        { id: 'alias_sugar', text: "Quick check: What do customers call 'Sugar' locally? (Skip if none)", handler: (a) => this.learnAlias(a, 'Sugar') },
        { id: 'finish', text: "Configuration Complete! 🔒 System Locked & Loaded. Ready for commands.", handler: (a) => { } }
    ];

    public isActive(): boolean {
        return this.isTraining;
    }

    public startTraining(): string {
        this.isTraining = true;
        this.currentQuestionIndex = 0;
        return `⚠️ SYSTEM INITIALIZATION REQUIRED\n\nI need to calibrate the Business Rules before I can execute any commands.\n\n` + this.questions[0].text;
    }

    public handleInput(input: string): string {
        if (!this.isTraining) return '';

        // Handle the answer to the *current* question
        const question = this.questions[this.currentQuestionIndex];

        // Run specific handler logic
        try {
            question.handler(input);
        } catch (e) {
            console.error(e);
        }

        // Move to next
        this.currentQuestionIndex++;

        // Check if done
        if (this.currentQuestionIndex >= this.questions.length) {
            this.isTraining = false;
            this.save();
            return `Training Complete! 🎓\n\nThanks ${this.userPreferredName}. I'm ready to help run ${this.answers['store_name'] || 'the store'}!`;
        }

        return this.questions[this.currentQuestionIndex].text;
    }

    // Helpers
    private learnAlias(alias: string, target: string) {
        // Only learn if it's not a generic 'no' or empty
        if (alias.length > 2 && !['no', 'none', 'nah', 'nope'].includes(alias.toLowerCase())) {
            aliasService.addAlias(alias, target);
        }
    }

    private saveMemory(key: string, value: string) {
        this.answers[key] = value;
    }

    private save() {
        this._isConfigured = true;
        localStorage.setItem('bot_config', JSON.stringify({
            botName: this.botName,
            userPreferredName: this.userPreferredName,
            isFriendly: this.isFriendly,
            memories: this.answers
        }));
    }

    // Getters for personality
    public getBotName() { return this.botName; }
    public getUserName() { return this.userPreferredName; }
}

export const trainingService = new TrainingService();
