import { useState, useEffect, useRef } from 'react';
import { aiChatbotService, type ChatMessage } from '../services/AIChatbotService';
import { voiceCommandService, type VoiceStatus } from '../services/voiceCommandService';
import { Send, Mic, MicOff, Bot, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AIAssist() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('OFFLINE');
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

    return (
        <div className="flex flex-col h-full bg-white text-black p-4">
            <h1 className="text-2xl font-bold mb-4">AI Assistant ({voiceStatus})</h1>

            <div className="flex-1 overflow-auto border p-4 mb-4 space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`p-2 rounded max-w-[80%] ${msg.sender === 'USER' ? 'ml-auto bg-blue-100' : 'bg-gray-100'}`}>
                        <div className="font-bold text-xs mb-1">{msg.sender}</div>
                        <div>{msg.text}</div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-2">
                <button onClick={toggleVoice} className={`p-2 border rounded ${voiceStatus === 'LISTENING' ? 'bg-red-500 text-white' : ''}`}>
                    {voiceStatus === 'LISTENING' ? <MicOff /> : <Mic />}
                </button>
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 border p-2 rounded"
                    placeholder="Type a message..."
                />
                <button onClick={handleSend} className="p-2 bg-blue-500 text-white rounded">
                    <Send />
                </button>
            </div>
        </div>
    );
}
