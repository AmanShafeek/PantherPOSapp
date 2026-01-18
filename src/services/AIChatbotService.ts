import { voiceCommandService, type VoiceStatus } from './voiceCommandService';
import { intentEngine } from './IntentEngine';
import { commandGateway } from './CommandGateway';
import { trainingService } from './trainingService';
import { knowledgeBase } from './KnowledgeBase';
// import { eventBus } from '../utils/EventBus';

export interface ChatMessage {
    id: string;
    sender: 'USER' | 'AI' | 'SYSTEM';
    text: string;
    timestamp: number;
    actionTaken?: string;
}

class AIChatbotService {
    private messages: ChatMessage[] = [];
    private listeners: ((messages: ChatMessage[]) => void)[] = [];
    private pendingContext: { type: string; payload: any } | null = null;

    // LEVEL 2: Context Memory
    private lastCommand: { type: string; payload: any } | null = null;

    constructor() {
        // Initialize Voice Service Callbacks
        voiceCommandService.setCallbacks(
            (text) => this.handleUserMessage(text),
            (status, msg) => this.handleVoiceStatus(status, msg)
        );
    }

    public subscribe(callback: (messages: ChatMessage[]) => void) {
        this.listeners.push(callback);
        callback(this.messages); // Initial state
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    public getMessages() {
        return this.messages;
    }

    public addMessage(sender: 'USER' | 'AI' | 'SYSTEM', text: string, actionTaken?: string) {
        const msg: ChatMessage = {
            id: Date.now().toString() + Math.random(),
            sender,
            text,
            timestamp: Date.now(),
            actionTaken
        };
        this.messages = [...this.messages, msg];
        this.notifyListeners();
    }

    private notifyListeners() {
        this.listeners.forEach(cb => cb(this.messages));
    }

    // --- Core Logic ---

    public async handleUserMessage(text: string) {
        if (!text.trim()) return;

        this.addMessage('USER', text);

        // --- TRAINER INTERCEPTION ---
        if (trainingService.isActive()) {
            await new Promise(r => setTimeout(r, 600));
            const response = trainingService.handleInput(text);
            this.addMessage('AI', response);
            return;
        }

        if (!trainingService.isConfigured()) {
            const response = trainingService.startTraining();
            this.addMessage('AI', response);
            return;
        }
        // ----------------------------

        // 1. Pending Context Check (Specific Wait)
        if (this.pendingContext) {
            if (await this.resolvePendingContext(text)) return;
        }

        // 2. Intelligent Follow-up Check (Implicit Context)
        if (this.lastCommand && this.isFollowUpQuery(text)) {
            const followUpCmd = this.constructFollowUpCommand(text);
            if (followUpCmd) {
                this.addMessage('SYSTEM', `Context Inference: ${followUpCmd.type}...`);
                await this.executeCommand(followUpCmd);
                return;
            }
        }

        // 3. New Intent Parsing
        const command = intentEngine.parse(text);

        // Manual Training Trigger
        if (!command && (text.toLowerCase().includes('training') || text.toLowerCase().includes('calibrate'))) {
            const response = trainingService.startTraining();
            this.addMessage('AI', response);
            return;
        }

        if (command) {
            await this.executeCommand(command);
        } else {
            // 4. Knowledge Base Fallback
            const knowledge = knowledgeBase.ask(text);
            if (knowledge) {
                this.addMessage('AI', knowledge);
                return;
            }

            this.addMessage('AI', "I didn't catch that. Try saying 'Add 2 milk' or 'Show sales'.");
        }
    }

    // --- Helper Methods ---

    private async executeCommand(command: any) {
        this.addMessage('SYSTEM', `Processing: ${command.type}...`);
        const result = await commandGateway.execute(command);

        if (result.success) {
            this.addMessage('AI', result.message, result.actionTaken);
            this.lastCommand = command; // Save successful command for context
        } else {
            // Check for specific prompts (basic context setting)
            if (result.message.includes('How much')) {
                const productMatch = result.message.match(/How much (.+) do you want/i);
                if (productMatch) {
                    this.pendingContext = {
                        type: 'WAITING_FOR_QTY',
                        payload: { productName: productMatch[1] }
                    };
                }
            }
            this.addMessage('AI', result.message, 'ERROR');
        }
    }

    private async resolvePendingContext(text: string): Promise<boolean> {
        if (this.pendingContext?.type === 'WAITING_FOR_QTY') {
            const qtyMatch = text.match(/(\d+(?:\.\d+)?)/);
            if (qtyMatch) {
                const qty = parseFloat(qtyMatch[1]);
                const product = this.pendingContext.payload.productName;
                const newCommand = {
                    type: 'ADD_ITEM',
                    payload: { productName: product, quantity: qty }
                };

                this.addMessage('SYSTEM', `Context Resolved: Adding ${qty} ${product}...`);
                this.pendingContext = null;
                await this.executeCommand(newCommand);
                return true;
            } else {
                // If text doesn't look like a number, assume they aborted context.
                this.pendingContext = null;
                return false; // Continue to normal parsing
            }
        }
        return false;
    }

    // Level 2 Intelligence: Detect casual follow-ups
    private isFollowUpQuery(text: string): boolean {
        const lower = text.toLowerCase();
        // Check for time-based follow-ups like "and yesterday?", "what about this week?"
        return /^(and|what about|how about)?\s*(yesterday|today|tomorrow|last\s+|this\s+)/.test(lower);
    }

    private constructFollowUpCommand(text: string): any | null {
        if (!this.lastCommand) return null;

        // Extract time period from follow-up
        const lower = text.toLowerCase();
        let period = null;
        if (lower.includes('yesterday')) period = 'yesterday';
        else if (lower.includes('today')) period = 'today';
        else if (lower.includes('week')) period = 'this week';
        else if (lower.includes('month')) period = 'this month';

        if (!period) return null;

        // If last command was a REPORT, re-run with new period
        if (this.lastCommand.type === 'REPORT_QUERY') {
            return {
                type: 'REPORT_QUERY',
                payload: {
                    ...this.lastCommand.payload,
                    period: period
                }
            };
        }

        return null;
    }

    private handleVoiceStatus(status: VoiceStatus, message?: string) {
        console.log(`Voice Status: ${status}`, message);
        if (status === 'ERROR' && message) {
            this.addMessage('SYSTEM', `Mic Error: ${message}`);
        }
    }

    public async sendText(text: string) {
        await this.handleUserMessage(text);
    }
}

export const aiChatbotService = new AIChatbotService();
