import { useState, useEffect, useRef } from 'react';
import { inventoryService } from '../services/inventoryService';
import { productService } from '../services/productService';
import type { StocktakeSession, Product } from '../types/db';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { ClipboardList, Search, CheckCircle, Barcode } from 'lucide-react';
import clsx from 'clsx';
import { Table } from '../components/Table'; // Reusing Table component if possible, but matching styles manually for custom needs

export default function Stocktake() {
    const [activeSession, setActiveSession] = useState<StocktakeSession | null>(null);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [scanQuery, setScanQuery] = useState('');
    const [foundProduct, setFoundProduct] = useState<Product | null>(null);
    const [countInput, setCountInput] = useState('');
    const scanInputRef = useRef<HTMLInputElement>(null);
    const [isCountModalOpen, setIsCountModalOpen] = useState(false);

    useEffect(() => { loadSession(); }, []);

    const loadSession = async () => {
        setLoading(true);
        const session = await inventoryService.getActiveSession();
        setActiveSession(session);
        if (session) { setItems(await inventoryService.getSessionItems(session.id)); }
        setLoading(false);
    };

    const handleStartSession = async () => { await inventoryService.startStocktake('Audit started manually'); loadSession(); };

    const handleProductSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        const product = await productService.getByBarcode(scanQuery);
        if (product) {
            setFoundProduct(product); setCountInput(''); setIsCountModalOpen(true); setScanQuery('');
        } else {
            const results = await productService.search(scanQuery);
            if (results.length === 1) { setFoundProduct(results[0]); setCountInput(''); setIsCountModalOpen(true); setScanQuery(''); }
            else { alert('Product not found or multiple matches. Please use precise barcode.'); }
        }
    };

    const handleSaveCount = async () => {
        if (!activeSession || !foundProduct || countInput === '') return;
        await inventoryService.saveCount(activeSession.id, foundProduct.id, parseFloat(countInput));
        setIsCountModalOpen(false); setFoundProduct(null); setCountInput('');
        setItems(await inventoryService.getSessionItems(activeSession.id));
        setTimeout(() => scanInputRef.current?.focus(), 100);
    };

    const handleFinalize = async () => {
        if (!activeSession) return;
        if (!confirm('Are you sure? This will update ALL product stock levels to match these counts.')) return;
        setLoading(true); await inventoryService.finalizeStocktake(activeSession.id);
        loadSession(); alert('Stock Audit Completed & Inventory Updated.');
    };

    if (loading) return <div className="p-4">Loading Audit Data...</div>;

    if (!activeSession) {
        return (
            <div className="p-4 bg-white min-h-screen text-black flex flex-col items-center justify-center">
                <h2 className="text-xl font-bold mb-2">No Active Audit</h2>
                <p className="mb-4 text-gray-600">Start a stocktake session to audit inventory.</p>
                <button onClick={handleStartSession} className="bg-blue-600 text-white px-6 py-2 rounded">
                    Start New Audit
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 bg-white min-h-screen text-black">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <span className="text-green-600 font-bold text-sm uppercase">Audit In Progress</span>
                    <h1 className="text-2xl font-bold">Stock Audit #{activeSession.id}</h1>
                    <p className="text-gray-500 text-sm">Started {new Date(activeSession.created_at).toLocaleString()}</p>
                </div>
                <button onClick={handleFinalize} className="border border-green-600 text-green-600 px-4 py-2 rounded hover:bg-green-50">
                    Finalize & Update Stock
                </button>
            </div>

            <div className="mb-6 p-4 border rounded bg-gray-50">
                <form onSubmit={handleProductSearch} className="flex gap-4">
                    <input
                        ref={scanInputRef}
                        type="text"
                        value={scanQuery}
                        onChange={(e) => setScanQuery(e.target.value)}
                        className="flex-1 p-2 border rounded text-lg font-mono"
                        placeholder="Scan Barcode..."
                        autoFocus
                    />
                    <button type="submit" className="bg-gray-200 px-4 py-2 rounded border">Find</button>
                </form>
            </div>

            <table className="w-full border-collapse border">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border p-2 text-left">Product</th>
                        <th className="border p-2 text-center">System Stock</th>
                        <th className="border p-2 text-center">Counted</th>
                        <th className="border p-2 text-right">Variance</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, i) => (
                        <tr key={i} className="border-b">
                            <td className="border p-2">
                                <div className="font-bold">{item.name}</div>
                                <div className="text-sm text-gray-500 font-mono">{item.barcode}</div>
                            </td>
                            <td className="border p-2 text-center text-gray-500">{item.system_stock}</td>
                            <td className="border p-2 text-center font-bold text-blue-600">{item.counted_stock}</td>
                            <td className={`border p-2 text-right font-bold ${item.variance === 0 ? 'text-gray-400' : item.variance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {item.variance > 0 ? '+' : ''}{item.variance}
                            </td>
                        </tr>
                    ))}
                    {items.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-500">No items counted yet.</td></tr>}
                </tbody>
            </table>

            <Modal isOpen={isCountModalOpen} onClose={() => setIsCountModalOpen(false)} title="Enter Actual Count">
                {foundProduct && (
                    <div className="flex flex-col gap-4 p-2">
                        <div className="text-center p-4 bg-gray-50 border rounded">
                            <h3 className="font-bold text-lg">{foundProduct.name}</h3>
                            <p className="font-mono text-gray-500">{foundProduct.barcode}</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Actual Quantity</label>
                            <input
                                type="number"
                                value={countInput}
                                onChange={(e) => setCountInput(e.target.value)}
                                className="w-full text-3xl font-bold text-center border p-4 rounded"
                                autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveCount(); }}
                                placeholder="0"
                            />
                            <p className="text-center text-xs mt-2 text-gray-500">
                                System: {foundProduct.stock} | Variance: {parseFloat(countInput || '0') - foundProduct.stock}
                            </p>
                        </div>
                        <div className="flex gap-4 justify-end">
                            <Button variant="secondary" onClick={() => setIsCountModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleSaveCount}>Confirm</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
