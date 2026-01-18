import { QRCodeCanvas } from 'qrcode.react';

interface PaymentQRCodeProps {
    amount: number;
    billNo: string;
    vpa?: string; // Virtual Payment Address (UPI ID)
    storeName?: string;
}

export default function PaymentQRCode({ amount, billNo, vpa, storeName }: PaymentQRCodeProps) {
    // Fallback to demo VPA if not configured
    const upiId = vpa || 'demo@upi';
    const payeeName = storeName || 'QuickPOS Store';

    // UPI URL Format: upi://pay?pa=ADDRESS&pn=NAME&am=AMOUNT&tr=REF&tn=NOTE
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount.toFixed(2)}&tr=${billNo}&tn=Bill ${billNo}`;

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm">
            <h3 className="text-mac-text-primary font-bold mb-3 text-sm uppercase tracking-wider">Scan to Pay</h3>
            <div className="p-2 border-2 border-mac-text-primary/10 rounded-lg">
                <QRCodeCanvas
                    value={upiUrl}
                    size={200}
                    level={"H"}
                    includeMargin={true}
                />
            </div>
            <div className="mt-3 text-center">
                <p className="font-mono text-lg font-bold text-mac-text-primary">₹{amount.toFixed(2)}</p>
                <p className="text-xs text-mac-text-secondary mt-1 opacity-70">UPI: {upiId}</p>
            </div>
        </div>
    );
}
