import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { eventBus } from '../utils/EventBus';
import Sidebar from '../components/Sidebar';
import { Toaster } from 'react-hot-toast';
import type { User } from '../types/db';

interface AppShellProps {
    children: React.ReactNode;
    user: User;
    onLogout: () => void;
}

export default function AppShell({ children, user, onLogout }: AppShellProps) {
    const navigate = useNavigate();

    useEffect(() => {
        const unsub = eventBus.on('NAVIGATE', (data) => navigate(data.path));
        return unsub;
    }, [navigate]);

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-background text-white selection:bg-primary/30 font-sans">
            <Toaster position="top-right"
                toastOptions={{
                    style: {
                        background: '#1a1a1a',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }
                }}
            />

            {/* Sidebar (Fixed width) */}
            <Sidebar user={user} onLogout={onLogout} />

            {/* Main Content Area */}
            <main className="flex-1 h-full min-w-0 bg-background relative flex flex-col">
                <div className="flex-1 overflow-hidden relative z-10">
                    {children}
                </div>
            </main>
        </div>
    );

}
