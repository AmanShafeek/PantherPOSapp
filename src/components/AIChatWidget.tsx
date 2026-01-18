import { useState, useEffect, useRef } from 'react';
import { aiChatbotService, type ChatMessage } from '../services/AIChatbotService';
import { voiceCommandService, type VoiceStatus } from '../services/voiceCommandService';
import { Send, Mic, MicOff, Bot, X, Minimize2, Maximize2, Loader2, Command } from 'lucide-react';
import toast from 'react-hot-toast';

interface AIChatWidgetProps {
    variant?: 'floating' | 'embedded';
}

export function AIChatWidget({ variant = 'floating' }: AIChatWidgetProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isOpen, setIsOpen] = useState(variant === 'embedded');
    const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('OFFLINE');
    const [isMinimized, setIsMinimized] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (variant === 'embedded') setIsOpen(true);

        if (isOpen && aiChatbotService.getMessages().length === 0) {
            aiChatbotService.handleUserMessage("hello");
        }
    }, [variant, isOpen]);

    useEffect(() => {
        const unsubChat = aiChatbotService.subscribe(setMessages);
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
        scrollToBottom();
    }, [messages, isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSend = async () => {
        if (!input.trim()) return;
        await aiChatbotService.sendText(input);
        setInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSend();
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

    // FLOATING BUTTON
    if (!isOpen && variant === 'floating') {
        return (
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    position: 'fixed',
                    bottom: '32px',
                    right: '32px',
                    width: '64px',
                    height: '64px',
                    background: 'linear-gradient(to right, #7c3aed, #2563eb)',
                    borderRadius: '50%',
                    boxShadow: '0 0 40px rgba(124,58,237,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,0.2)',
                    zIndex: 50,
                    cursor: 'pointer',
                    transition: 'all 0.5s'
                }}
            >
                <Bot size={32} color="white" />
                <div style={{ position: 'absolute', top: 0, right: 0, width: '16px', height: '16px', backgroundColor: '#22c55e', border: '3px solid #0f172a', borderRadius: '50%' }} />
            </button>
        );
    }

    if (!isOpen && variant === 'embedded') return null;

    // CONTAINER STYLES
    const containerStyle: React.CSSProperties = variant === 'floating' ? {
        position: 'fixed',
        bottom: '32px',
        right: '32px',
        width: '420px',
        zIndex: 50,
        height: isMinimized ? '80px' : '650px',
        borderRadius: '32px',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 0 80px rgba(0,0,0,0.6)',
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(40px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: 'sans-serif',
        transition: 'all 0.5s'
    } : {
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'transparent',
        overflow: 'hidden',
        fontFamily: 'sans-serif'
    };

    return (
        <div style={containerStyle}>
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px',
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.05), transparent)',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', inset: 0, background: '#a855f7', borderRadius: '12px', filter: 'blur(8px)', opacity: voiceStatus === 'LISTENING' ? 0.8 : 0.4 }}></div>
                        <div style={{ position: 'relative', padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex' }}>
                            <Bot size={20} color="#d8b4fe" />
                        </div>
                    </div>
                    <div>
                        <h3 style={{ fontWeight: 'bold', color: 'white', fontSize: '15px', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                            AIAssistant
                            {voiceStatus === 'LISTENING' && (
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444', animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
                            )}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: voiceStatus === 'LISTENING' ? '#ef4444' : voiceStatus === 'READY' ? '#34d399' : '#6b7280', boxShadow: '0 0 8px currentColor' }} />
                            <span style={{ fontSize: '10px', fontWeight: 500, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{voiceStatus}</span>
                        </div>
                    </div>
                </div>

                {variant === 'floating' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button onClick={() => setIsMinimized(!isMinimized)} style={{ padding: '8px', borderRadius: '50%', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                        </button>
                        <button onClick={() => setIsOpen(false)} style={{ padding: '8px', borderRadius: '50%', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                            <X size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            {!isMinimized && (
                <>
                    {/* Chat Area */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', scrollbarWidth: 'none' }}>
                        {messages.length === 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', gap: '24px' }}>
                                <div style={{ position: 'relative', padding: '24px' }}>
                                    <Bot size={64} color="rgba(255,255,255,0.2)" />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                                    <p style={{ fontSize: '18px', fontWeight: 500, color: 'rgba(255,255,255,0.8)', margin: 0 }}>How can I help you?</p>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                        {['Check Sales', 'Add Milk', 'Show Reports'].map((hint) => (
                                            <span key={hint} style={{ padding: '6px 12px', borderRadius: '999px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', fontSize: '12px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                                                "{hint}"
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {messages.map((msg) => <ChatBubble key={msg.id} msg={msg} />)}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div style={{ padding: '20px', paddingBottom: '24px' }}>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', background: 'linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(255,255,255,0.05))', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', backdropFilter: 'blur(20px)' }}>

                            {/* Voice Button */}
                            <button
                                onClick={toggleVoice}
                                disabled={voiceStatus === 'LOADING'}
                                style={{
                                    position: 'relative',
                                    padding: '12px',
                                    borderRadius: '18px',
                                    transition: 'all 0.3s',
                                    flexShrink: 0,
                                    background: voiceStatus === 'LISTENING' ? '#ef4444' : 'rgba(255,255,255,0.05)',
                                    color: voiceStatus === 'LISTENING' ? 'white' : 'rgba(255,255,255,0.6)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    boxShadow: voiceStatus === 'LISTENING' ? '0 0 20px rgba(239,68,68,0.4)' : 'none'
                                }}
                            >
                                {voiceStatus === 'LOADING' ? <Loader2 size={20} className="animate-spin" /> :
                                    voiceStatus === 'LISTENING' ? <Mic size={20} /> :
                                        <MicOff size={20} />}
                            </button>

                            {/* Text Input */}
                            <div style={{ flex: 1, position: 'relative' }}>
                                <input
                                    type="text"
                                    style={{ width: '100%', background: 'transparent', border: 'none', padding: '8px', color: 'white', outline: 'none', fontSize: '15px', fontWeight: 500, letterSpacing: '0.025em' }}
                                    placeholder="Ask anything..."
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                            </div>

                            {/* Send Button */}
                            <button
                                onClick={handleSend}
                                disabled={!input.trim()}
                                style={{
                                    padding: '12px',
                                    borderRadius: '18px',
                                    transition: 'all 0.3s',
                                    flexShrink: 0,
                                    background: input.trim() ? 'linear-gradient(to top right, #9333ea, #2563eb)' : 'rgba(255,255,255,0.05)',
                                    color: input.trim() ? 'white' : 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    cursor: input.trim() ? 'pointer' : 'not-allowed',
                                    boxShadow: input.trim() ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : 'none'
                                }}
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                </>
            )}
            <style>{`.animate-spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

// Inline CSS for Bubble
const ChatBubble = ({ msg }: { msg: ChatMessage }) => {
    const isUser = msg.sender === 'USER';
    const isSystem = msg.sender === 'SYSTEM';

    const bubbleStyle: React.CSSProperties = {
        position: 'relative',
        padding: '14px 20px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        backdropFilter: 'blur(12px)',
        transition: 'all 0.3s',
        maxWidth: '85%',
        // Dynamic styles based on sender
        ...(isUser ? {
            background: 'linear-gradient(to top right, #7c3aed, #2563eb)',
            color: 'white',
            borderRadius: '24px 24px 0 24px', // Top-Right corner sharp
            alignSelf: 'flex-end'
        } : isSystem ? {
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.7)',
            fontSize: '12px',
            fontStyle: 'italic',
            borderRadius: '12px',
            padding: '8px 16px',
            alignSelf: 'flex-start'
        } : {
            background: 'rgba(255,255,255,0.1)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '24px 24px 24px 0', // Top-Left corner sharp
            alignSelf: 'flex-start'
        })
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
            <div style={bubbleStyle}>
                <span style={{ position: 'relative', zIndex: 10, lineHeight: '1.625', fontSize: '15px' }}>{msg.text}</span>
            </div>
            {!isSystem && (
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '6px', padding: '0 8px', fontWeight: 500, letterSpacing: '0.025em' }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            )}
        </div>
    );
};
