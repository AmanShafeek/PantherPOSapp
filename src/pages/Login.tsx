import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import type { User } from '../types/db';

interface LoginProps {
    onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
    const [view, setView] = useState<'SELECTION' | 'PIN'>('SELECTION');
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const allUsers = await authService.getUsers();
            setUsers(allUsers);
        } catch (e) {
            console.error("Failed to load users", e);
        }
    };

    const handleUserSelect = (user: User) => {
        setSelectedUser(user);
        setView('PIN');
        setPin('');
        setError('');
    };

    const handleBackToSelection = () => {
        setView('SELECTION');
        setSelectedUser(null);
        setPin('');
        setError('');
    };

    const handleDigit = (digit: string) => {
        if (pin.length < 6) {
            setPin(prev => prev + digit);
            setError('');
        }
    };

    const handleBackspace = () => {
        setPin(prev => prev.slice(0, -1));
        setError('');
    };

    const handleLogin = async () => {
        if (pin.length === 0 || !selectedUser) return;
        setLoading(true);
        try {
            const loggedInUser = await authService.login(pin);
            if (loggedInUser) {
                if (loggedInUser.id === selectedUser.id) {
                    onLogin(loggedInUser);
                } else {
                    setError('PIN does not match selected user');
                    setPin('');
                }
            } else {
                setError('Invalid PIN');
                setPin('');
            }
        } catch (err) {
            setError('Login failed');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (view === 'SELECTION') {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-glass pointer-events-none" />
                <div className="relative z-10 w-full max-w-4xl">
                    <h1 className="text-4xl font-bold mb-12 text-white text-center tracking-tight">Select User</h1>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {users.map(user => (
                            <button
                                key={user.id}
                                onClick={() => handleUserSelect(user)}
                                className="group bg-surface/50 backdrop-blur-md p-8 rounded-2xl border border-white/5 hover:border-primary/50 hover:bg-surface/80 transition-all duration-300 flex flex-col items-center hover:scale-105 hover:shadow-glow"
                            >
                                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-gray-800 to-black border border-white/10 flex items-center justify-center mb-6 text-2xl font-bold text-white group-hover:from-primary group-hover:to-emerald-700 transition-all shadow-lg">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-xl font-bold text-white mb-2">{user.name}</span>
                                <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold border border-white/5 px-2 py-1 rounded-full bg-black/20 group-hover:border-primary/20 group-hover:text-primary transition-colors">
                                    {user.role}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-glass pointer-events-none" />

            <div className="relative z-10 bg-surface/50 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/10 w-full max-w-md">
                <button onClick={handleBackToSelection} className="text-sm text-muted-foreground hover:text-white mb-8 flex items-center gap-2 transition-colors">
                    &larr; Back to Users
                </button>

                <div className="text-center mb-10">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-tr from-primary to-emerald-700 p-1 shadow-glow animate-pulse-slow">
                        <div className="w-full h-full rounded-full bg-surface flex items-center justify-center text-4xl font-bold text-white">
                            {(selectedUser?.name || '?').charAt(0).toUpperCase()}
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white">Welcome back, {selectedUser?.name}</h2>
                    <p className="text-muted-foreground mt-2 text-sm">Enter your secure PIN to continue</p>
                </div>

                <div className="flex flex-col gap-8">
                    <div className="relative">
                        <input
                            type="password"
                            value={pin}
                            readOnly
                            className="w-full text-center text-4xl tracking-[1em] font-mono bg-transparent border-b-2 border-white/20 py-4 focus:outline-none text-white placeholder:text-white/20 transition-all"
                            placeholder="••••"
                        />
                        <div className={`absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ${pin.length > 0 ? 'w-full shadow-[0_0_10px_#10b981]' : 'w-0'}`} />
                    </div>

                    {error && (
                        <div className="text-destructive text-sm text-center font-bold bg-destructive/10 p-3 rounded-lg border border-destructive/20 animate-shake">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button
                                key={num}
                                onClick={() => handleDigit(num.toString())}
                                className="h-16 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-2xl text-2xl font-bold text-white active:scale-95 transition-all shadow-lg backdrop-blur-sm"
                            >
                                {num}
                            </button>
                        ))}
                        <div />
                        <button
                            onClick={() => handleDigit('0')}
                            className="h-16 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-2xl text-2xl font-bold text-white active:scale-95 transition-all shadow-lg backdrop-blur-sm"
                        >
                            0
                        </button>
                        <button
                            onClick={handleBackspace}
                            className="h-16 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 rounded-2xl text-red-400 hover:text-red-300 font-bold active:scale-95 transition-all flex items-center justify-center backdrop-blur-sm"
                        >
                            DEL
                        </button>
                    </div>

                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-glow hover:scale-[1.02] active:scale-[0.98] mt-2"
                    >
                        {loading ? 'Authenticating...' : 'Access Dashboard'}
                    </button>
                </div>
            </div>
        </div>
    );
}
