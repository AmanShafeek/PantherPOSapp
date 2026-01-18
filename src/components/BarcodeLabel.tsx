import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeLabelProps {
    value: string;
    name: string;
    price: number;
    className?: string;
}

export function BarcodeLabel({ value, name, price, className }: BarcodeLabelProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (svgRef.current && value) {
            try {
                JsBarcode(svgRef.current, value, {
                    format: "CODE128",
                    width: 2,
                    height: 50,
                    displayValue: true,
                    fontSize: 14,
                    margin: 10,
                    background: "transparent",
                    lineColor: "#000000"
                });
            } catch (err) {
                console.error('Barcode generation failed:', err);
            }
        }
    }, [value]);

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const svgHtml = svgRef.current?.outerHTML || '';

        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Label - ${name}</title>
                    <style>
                        body { 
                            display: flex; 
                            flex-direction: column; 
                            align-items: center; 
                            justify-content: center; 
                            height: 100vh; 
                            margin: 0; 
                            font-family: sans-serif;
                        }
                        .label-container {
                            border: 1px dashed #ccc;
                            padding: 20px;
                            text-align: center;
                        }
                        .name { font-weight: bold; font-size: 18px; margin-bottom: 5px; }
                        .price { font-size: 20px; font-weight: 900; margin-top: 10px; }
                    </style>
                </head>
                <body>
                    <div class="label-container">
                        <div class="name">${name.toUpperCase()}</div>
                        ${svgHtml}
                        <div class="price">₹${price.toFixed(2)}</div>
                    </div>
                    <script>
                        setTimeout(() => {
                            window.print();
                            window.close();
                        }, 500);
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className={`flex flex-col items-center p-4 bg-white rounded-xl shadow-mac-lg ${className}`}>
            <div className="text-black font-black text-sm mb-2 uppercase tracking-tighter">{name}</div>
            <svg ref={svgRef}></svg>
            <div className="text-black font-black text-lg mt-2">₹{price.toFixed(2)}</div>
            <button
                onClick={handlePrint}
                className="mt-4 px-6 py-2 bg-mac-accent-emerald text-black font-black text-xs rounded-lg uppercase tracking-widest hover:brightness-110 transition-all"
            >
                Print Label
            </button>
        </div>
    );
}
