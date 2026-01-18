import { useState, useEffect, useRef } from 'react';
import { X, Lock, Loader2 } from 'lucide-react';
import { Modal } from './Modal';
import { authService } from '../services/authService';

interface PinModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (user: any) => void;
    title?: string;
    description?: string;
    requiredRole?: 'ADMIN' | 'MANAGER' | 'CASHIER';
}

export function PinModal({ isOpen, onClose, onSuccess, title = "Admin Verification", description = "Enter PIN to authorize action", requiredRole = 'ADMIN' }: PinModalProps) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setPin('');
            setError('');
            // Focus after animation
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const user = await authService.login(pin); // Re-using login for PIN verification
            if (!user) {
                setError('Invalid PIN');
            } else {
                // Check Role
                if (requiredRole === 'ADMIN' && user.role !== 'ADMIN') {
                    setError('Insufficient Privileges. Admin PIN required.');
                } else if (requiredRole === 'MANAGER' && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
                    setError('Insufficient Privileges. Manager PIN required.');
                } else {
                    onSuccess(user);
                    onClose();
                }
            }
        } catch (err: any) {
            setError('Verification failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <div className="flex flex-col items-center justify-center p-4">
                <div className="bg-red-500/10 p-4 rounded-full mb-4">
                    <Lock className="w-8 h-8 text-red-500" />
                </div>

                <p className="text-mac-text-secondary text-sm text-center mb-6">
                    {description}
                </p>

                <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-center tracking-[0.5em] font-black text-xl focus:border-red-500/50 outline-none transition-all placeholder:tracking-normal placeholder:font-normal placeholder:text-sm"
                            placeholder="ENTER PIN"
                            maxLength={6}
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="text-red-500 text-xs text-center font-bold animate-pulse">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="py-3 rounded-xl bg-white/5 hover:bg-white/10 text-mac-text-secondary text-xs font-bold uppercase tracking-wider transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || pin.length < 4}
                            className="py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                            Verify
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
