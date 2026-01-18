import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'lg' }: ModalProps) {
    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '4xl': 'max-w-4xl'
    };


    // Close on Escape
    useEffect(() => {
        const handleKv = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleKv);
        return () => window.removeEventListener('keydown', handleKv);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div
                className={clsx(
                    "mac-card !rounded-[32px] !bg-surface shadow-mac-lg w-full flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-300 border-white/5",
                    sizeClasses[size]
                )}
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-center justify-between px-10 py-6 border-b border-white/5">
                    <h2 className="text-xl font-black text-white tracking-tight">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-white transition-colors p-2 hover:bg-white/5 rounded-xl"
                        aria-label="Close modal"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-10 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
