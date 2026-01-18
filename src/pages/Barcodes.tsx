import { useState, useEffect, useRef } from 'react';
import { productService } from '../services/productService';
import type { Product } from '../types/db';
import { Search, Printer, Trash2, Grid, Plus, Minus, Barcode } from 'lucide-react';
import { BarcodeLabel } from '../components/BarcodeLabel';
import { useReactToPrint } from 'react-to-print';

export default function Barcodes() {
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState('');
    const [queue, setQueue] = useState<{ product: Product, qty: number }[]>([]);
    const componentRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({ content: () => componentRef.current });

    useEffect(() => { loadProducts(); }, []);

    const loadProducts = async () => { setProducts(await productService.getAll()); };

    const addToQueue = (product: Product) => {
        setQueue(prev => {
            const existing = prev.find(i => i.product.id === product.id);
            if (existing) return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
            return [...prev, { product, qty: 1 }];
        });
    };

    const removeFromQueue = (id: number) => { setQueue(prev => prev.filter(i => i.product.id !== id)); };
    const updateQty = (id: number, newQty: number) => { if (newQty < 1) return; setQueue(prev => prev.map(i => i.product.id === id ? { ...i, qty: newQty } : i)); };

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search)).slice(0, 20);

    return (
        <div className="p-6 bg-white min-h-screen text-black font-sans flex gap-6">
            {/* LEFT: Product Selector */}
            <div className="flex-1 flex flex-col gap-4">
                {/* Header / Search */}
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Barcode size={24} className="text-blue-500" />
                        Label Printer
                    </h1>
                    <input
                        className="w-full p-3 border rounded mt-4"
                        placeholder="Search products by name or barcode..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        autoFocus
                    />
                </div>

                {/* Products Grid */}
                <div className="flex-1 overflow-y-auto border rounded p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredProducts.map(p => (
                            <button
                                key={p.id}
                                onClick={() => addToQueue(p)}
                                className="text-left p-4 border rounded hover:bg-gray-50 flex flex-col gap-2"
                            >
                                <div className="flex justify-between items-center w-full">
                                    <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-600">ID: {p.id}</span>
                                    <span className="text-sm font-bold text-green-700 bg-green-100 px-2 py-1 rounded">₹{p.sell_price}</span>
                                </div>
                                <div className="font-bold truncate">{p.name}</div>
                                <div className="text-xs text-gray-500 font-mono flex items-center gap-1">
                                    <Barcode size={12} /> {p.barcode}
                                </div>
                            </button>
                        ))}
                    </div>
                    {filteredProducts.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            <p>No products found matched your search.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: Print Queue */}
            <div className="w-1/3 border rounded p-4 flex flex-col gap-4 bg-gray-50 h-[calc(100vh-48px)]">
                <div className="flex justify-between items-center border-b pb-4">
                    <div>
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Printer size={20} className="text-blue-500" /> Print Queue
                        </h2>
                        <p className="text-xs text-gray-500">Ready to print labels</p>
                    </div>
                    <span className="text-sm font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                        {queue.reduce((a, b) => a + b.qty, 0)} Total
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto flex flex-col gap-2">
                    {queue.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <Grid size={32} className="mb-4 opacity-20" />
                            <p className="font-bold">Queue is empty</p>
                            <p className="text-xs text-center">Select products to add to queue</p>
                        </div>
                    ) : (
                        queue.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-white border rounded">
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold truncate">{item.product.name}</div>
                                    <div className="text-xs font-mono text-gray-500">{item.product.barcode}</div>
                                </div>
                                <div className="flex items-center bg-gray-100 rounded">
                                    <button onClick={() => updateQty(item.product.id, item.qty - 1)} disabled={item.qty <= 1} className="p-2 hover:bg-gray-200 disabled:opacity-50"><Minus size={14} /></button>
                                    <span className="w-8 text-center font-bold text-sm">{item.qty}</span>
                                    <button onClick={() => updateQty(item.product.id, item.qty + 1)} className="p-2 hover:bg-gray-200"><Plus size={14} /></button>
                                </div>
                                <button onClick={() => removeFromQueue(item.product.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                            </div>
                        ))
                    )}
                </div>

                <div className="hidden">
                    <div ref={componentRef} className="p-4">
                        <div className="grid grid-cols-4 gap-4">
                            {queue.flatMap(item => Array(item.qty).fill(item.product)).map((p, i) => (
                                <div key={i} className="border border-black p-2 flex flex-col items-center justify-center h-32">
                                    <div className="text-xs font-bold text-center w-full truncate">{p.name}</div>
                                    <BarcodeLabel value={p.barcode} name={p.name} price={p.sell_price} />
                                    <div className="text-xs font-black mt-1">₹{p.sell_price.toFixed(2)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="border-t pt-4">
                    <button
                        onClick={handlePrint}
                        disabled={queue.length === 0}
                        className={`w-full py-3 rounded font-bold flex items-center justify-center gap-2 ${queue.length === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                    >
                        <Printer size={20} /> Print {queue.reduce((a, b) => a + b.qty, 0)} Labels
                    </button>
                </div>
            </div>
        </div>
    );
}
