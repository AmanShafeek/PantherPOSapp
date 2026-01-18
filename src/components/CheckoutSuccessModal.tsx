import { useEffect } from 'react';
import { CheckCircle, Printer, ArrowRight } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface CheckoutSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    billNo: string;
    total: number;
    customerName?: string;
    onPrint?: () => void;
}

export function CheckoutSuccessModal({ isOpen, onClose, billNo, total, customerName, onPrint }: CheckoutSuccessModalProps) {

    // Auto-close after 3 seconds if not interacted? No, let user acknowledge.

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Payment Successful" size="sm">
            <div className="flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                </div>

                <h2 className="text-2xl font-black text-white mb-2">₹{total.toFixed(2)}</h2>
                <p className="text-mac-text-secondary text-sm mb-6">
                    Transaction <b>{billNo}</b> completed successfully.
                    {customerName && <span className="block mt-1">Customer: {customerName}</span>}
                </p>

                <div className="grid grid-cols-2 gap-3 w-full">
                    <Button
                        variant="secondary"
                        onClick={() => { onPrint?.(); onClose(); }}
                        className="flex items-center justify-center gap-2"
                    >
                        <Printer className="w-4 h-4" />
                        Print & New
                    </Button>
                    <Button
                        variant="primary"
                        onClick={onClose}
                        className="flex items-center justify-center gap-2"
                    >
                        New Sale
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
