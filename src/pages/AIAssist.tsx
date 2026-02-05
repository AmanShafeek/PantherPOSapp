import { useState, useEffect, useRef } from 'react';
import { aiChatbotService, type ChatMessage } from '../services/AIChatbotService';
import { voiceCommandService, type VoiceStatus } from '../services/voiceCommandService';
import { Send, Mic, MicOff, Bot, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const AI_SUGGESTIONS_STORAGE = 'pos_ai_command_counts';
const MAX_SUGGESTIONS = 3;
const DEFAULT_SUGGESTIONS = ['New Bill', 'Show Profit'];

function recordCommand(cmd: string) {
    const raw = localStorage.getItem(AI_SUGGESTIONS_STORAGE);
    const counts: Record<string, number> = raw ? JSON.parse(raw) : {};
    const key = cmd.trim();
    if (!key) return;
    counts[key] = (counts[key] || 0) + 1;
    localStorage.setItem(AI_SUGGESTIONS_STORAGE, JSON.stringify(counts));
}

function getTopSuggestions(): string[] {
    const raw = localStorage.getItem(AI_SUGGESTIONS_STORAGE);
    const counts: Record<string, number> = raw ? JSON.parse(raw) : {};
    const sorted = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .map(([cmd]) => cmd)
        .slice(0, MAX_SUGGESTIONS);
    return sorted.length > 0 ? sorted : DEFAULT_SUGGESTIONS;
}

export default function AIAssist() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('OFFLINE');
    const [suggestions, setSuggestions] = useState<string[]>(getTopSuggestions());
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // --- LOGIC (Copied & Adapted from Widget) ---
    useEffect(() => {
        const unsubChat = aiChatbotService.subscribe(setMessages);

        // Initial Greeting if empty
        if (aiChatbotService.getMessages().length === 0) {
            aiChatbotService.addMessage(
                'AI',
                "**Good Afternoon!** I'm ready to help. Try \"New Bill\" or \"Show Profit\"."
            );
        }

        voiceCommandService.setCallbacks(
            (text) => aiChatbotService.handleUserMessage(text),
            (status, msg) => {
                setVoiceStatus(status);
                if (status === 'ERROR' && msg) toast.error(`Voice Error: ${msg}`);
            }
        );
        return () => unsubChat();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const cmd = input.trim();
        recordCommand(cmd);
        setSuggestions(getTopSuggestions());
        await aiChatbotService.sendText(cmd);
        setInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSend();
    };

    const handleSuggestionClick = async (cmd: string) => {
        recordCommand(cmd);
        setSuggestions(getTopSuggestions());
        await aiChatbotService.sendText(cmd);
    };

    const toggleVoice = async () => {
        if (voiceStatus === 'LISTENING') {
            voiceCommandService.stopListening();
        } else {
            if (voiceStatus === 'OFFLINE' || voiceStatus === 'ERROR') {
                await voiceCommandService.loadModel();
            }
            voiceCommandService.startListening();
        }
    };

    const renderCard = (msg: ChatMessage) => {
        if (!msg.data || !msg.actionTaken) return null;
        const { actionTaken, data } = msg;

        if (actionTaken === 'show_health_card') {
            return (
                <div className="mt-3 bg-background/50 p-3 rounded-xl border border-border/50 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-surface p-2.5 rounded-lg border border-border/50 shadow-sm">
                            <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Health Score</span>
                            <div className={`text-lg font-bold mt-1 ${data.healthScore === 'EXCELLENT' ? 'text-green-500' : data.healthScore === 'GOOD' ? 'text-blue-500' : 'text-yellow-500'}`}>
                                {data.healthScore}
                            </div>
                        </div>
                        <div className="bg-surface p-2.5 rounded-lg border border-border/50 shadow-sm">
                            <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Current Ratio</span>
                            <div className="text-lg font-bold mt-1 text-foreground">{data.liquidity?.currentRatio || '-'}</div>
                        </div>
                        <div className="bg-surface p-2.5 rounded-lg border border-border/50 shadow-sm">
                            <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Net Margin</span>
                            <div className="text-lg font-bold mt-1 text-foreground">{data.profitability?.netMargin}%</div>
                        </div>
                        <div className="bg-surface p-2.5 rounded-lg border border-border/50 shadow-sm">
                            <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Quick Ratio</span>
                            <div className="text-lg font-bold mt-1 text-foreground">{data.liquidity?.quickRatio || '-'}</div>
                        </div>
                    </div>
                </div>
            );
        }

        if (actionTaken === 'show_forecast') {
            return (
                <div className="mt-3 bg-background/50 p-3 rounded-xl border border-border/50 text-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-xs text-muted-foreground uppercase font-semibold">30-Day Projection</div>
                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${data.trend === 'growing' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                            {data.trend.toUpperCase()}
                        </div>
                    </div>
                    <div className="h-24 flex items-end justify-between gap-1 px-1">
                        {data.forecast_data?.slice(0, 15).map((d: any, i: number) => (
                            <div key={i} className="w-full bg-primary/20 rounded-t-sm relative group hover:bg-primary/40 transition-colors"
                                style={{ height: `${Math.min(100, Math.max(10, (d.predicted_amount / (data.avg_daily * 1.5)) * 100))}%` }}>
                                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 text-[9px] bg-popover text-popover-foreground px-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 shadow-sm border border-border">
                                    ₹{d.predicted_amount}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-2 text-center text-xs text-muted-foreground">
                        Avg: <span className="text-foreground font-medium">₹{data.avg_daily}</span> / day
                    </div>
                </div>
            );
        }

        if (actionTaken === 'show_report') {
            return (
                <div className="mt-3 bg-background/50 p-3 rounded-xl border border-border/50 text-sm">
                    <div className="text-xs text-muted-foreground uppercase font-semibold mb-2">{data.type.replace(/_/g, ' ')}</div>
                    {data.type === 'gst_summary' && (
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>Net Payable</span>
                                <span className="font-bold text-destructive">₹{data.data.netPayable.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Input Credit</span>
                                <span>₹{data.data.inputTax.toLocaleString()}</span>
                            </div>
                        </div>
                    )}
                    {data.type === 'ageing_summary' && (
                        <div className="space-y-2">
                            <div className="flex justify-between font-bold border-b border-border pb-1">
                                <span>Total Due</span>
                                <span className="text-destructive">₹{data.data.total.toLocaleString()}</span>
                            </div>
                            <div className="max-h-32 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                {data.data.items.slice(0, 5).map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between text-xs p-1.5 bg-surface rounded border border-border/30 hover:bg-muted/50 transition-colors">
                                        <span className="truncate max-w-[60%] font-medium">{item.name}</span>
                                        <span className="font-mono text-muted-foreground">₹{item.totalDue}</span>
                                    </div>
                                ))}
                                {data.data.items.length > 5 && <div className="text-[10px] text-center text-muted-foreground mt-1 font-medium">+ {data.data.items.length - 5} more customers</div>}
                            </div>
                        </div>
                    )}
                    {data.type === 'cashflow_statement' && (
                        <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between items-center p-1.5 bg-green-500/10 border border-green-500/20 rounded">
                                <span className="font-medium text-green-600 dark:text-green-400">Operating</span>
                                <span className="font-mono">₹{data.data.operating.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center p-1.5 bg-blue-500/10 border border-blue-500/20 rounded">
                                <span className="font-medium text-blue-600 dark:text-blue-400">Investing</span>
                                <span className="font-mono">₹{data.data.investing.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center p-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded">
                                <span className="font-medium text-yellow-600 dark:text-yellow-400">Financing</span>
                                <span className="font-mono">₹{data.data.financing.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between font-bold pt-2 border-t border-border mt-1">
                                <span>Net Change</span>
                                <span className={data.data.netChange >= 0 ? "text-green-500" : "text-destructive"}>₹{data.data.netChange.toLocaleString()}</span>
                            </div>
                        </div>
                    )}
                    {data.type === 'daybook' && (
                        <div className="max-h-48 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                            {data.data.length === 0 && <div className="text-center text-muted-foreground italic py-2">No transactions recorded today.</div>}
                            {data.data.map((tx: any, idx: number) => (
                                <div key={idx} className="p-2 bg-surface rounded border border-border/50 text-[10px] hover:border-primary/30 transition-colors">
                                    <div className="flex justify-between font-semibold mb-1">
                                        <span className="bg-muted px-1 rounded text-muted-foreground">#{tx.voucher_no}</span>
                                        <span className={tx.type === 'RECEIPT' || tx.type === 'SALES' ? "text-green-500" : "text-destructive"}>
                                            {tx.type === 'RECEIPT' || tx.type === 'SALES' ? '+' : '-'}₹{tx.total_amount}
                                        </span>
                                    </div>
                                    <div className="text-muted-foreground truncate mb-0.5">{tx.notes || (tx.details ? tx.details.split(',')[0] : 'Transaction')}</div>
                                    <div className="text-[9px] opacity-60 text-right uppercase tracking-wider">{tx.type}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        return null;
    };

    return (
        <div className="flex flex-col h-full bg-background text-foreground p-6 overflow-hidden">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <Bot className="text-primary animate-pulse" size={32} />
                    AI Assistant <span className="text-muted-foreground text-sm font-normal self-end mb-1 uppercase tracking-widest bg-muted py-1 px-3 rounded-full border border-border">{voiceStatus}</span>
                </h1>
                <p className="text-muted-foreground ml-11">Offline Voice-Activated POS Helper</p>
            </div>

            <div className="flex-1 overflow-y-auto mb-6 bg-surface rounded-xl border border-border shadow-inner p-6 space-y-6 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex flex-col max-w-[80%] ${msg.sender === 'USER' ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center gap-2 mb-1 px-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-50">
                                    {msg.sender === 'USER' ? 'You' : msg.sender === 'SYSTEM' ? 'System' : 'POS-AI'}
                                </span>
                            </div>
                            <div className={`p-4 rounded-2xl shadow-sm backdrop-blur-sm border whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.sender === 'USER'
                                ? 'bg-primary/20 text-foreground border-primary/30 rounded-tr-sm'
                                : msg.sender === 'SYSTEM'
                                    ? 'bg-muted text-muted-foreground border-border font-mono text-sm'
                                    : 'bg-muted/50 text-foreground border-border rounded-tl-sm'
                                }`}>
                                {/* Basic Markdown-like rendering for bold text */}
                                <div dangerouslySetInnerHTML={{
                                    __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                }} />
                                {renderCard(msg)}
                            </div>
                            {msg.sender === 'AI' && (
                                <span className="text-[10px] text-muted-foreground mt-1 ml-1 opacity-50">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0 flex items-center gap-1.5">
                    <Sparkles size={12} className="text-primary" /> Suggestions
                </span>
                <div className="flex gap-2 flex-wrap min-w-0">
                    {suggestions.map((cmd) => (
                        <button
                            key={cmd}
                            onClick={() => handleSuggestionClick(cmd)}
                            className="px-3 py-1.5 text-xs font-medium rounded-full bg-muted/80 hover:bg-primary/20 hover:text-primary border border-border/50 hover:border-primary/30 text-foreground/90 transition-all duration-200 shrink-0"
                        >
                            {cmd}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-1 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl">
                <div className="bg-surface border border-border rounded-lg p-2 flex items-center gap-2 shadow-lg">
                    <button
                        onClick={toggleVoice}
                        className={`p-4 rounded-xl transition-all duration-300 flex items-center justify-center border ${voiceStatus === 'LISTENING'
                            ? 'bg-destructive/10 text-destructive border-destructive/50 animate-pulse shadow-[0_0_15px_rgba(var(--destructive),0.2)]'
                            : 'bg-muted text-muted-foreground hover:text-foreground border-transparent hover:bg-muted/80'
                            }`}
                        title={voiceStatus === 'LISTENING' ? "Stop Listening" : "Start Voice"}
                    >
                        {voiceStatus === 'LISTENING' ? <MicOff size={24} /> : voiceStatus === 'LOADING' ? <Loader2 className="animate-spin" size={24} /> : <Mic size={24} />}
                    </button>

                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-transparent border-none text-lg text-foreground placeholder:text-muted-foreground/30 focus:ring-0 focus:outline-none px-4"
                        placeholder="Type a command or say 'Add 2 Milk'..."
                        autoFocus
                    />

                    <button
                        onClick={handleSend}
                        className="p-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-glow transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!input.trim()}
                    >
                        <Send size={24} className={input.trim() ? "translate-x-0.5" : ""} />
                    </button>
                </div>
            </div>
        </div>
    );
}
