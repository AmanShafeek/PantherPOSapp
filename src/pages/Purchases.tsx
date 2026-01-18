import { useState, useEffect, useCallback } from 'react';
import { purchaseService } from '../services/purchaseService';
import { supplierService } from '../services/supplierService';
import { productService } from '../services/productService';
import type { PurchaseOrder, Supplier, Product } from '../types/db';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Search, Plus, Receipt, Truck, Calendar, CheckCircle2, Trash2, Package, Info, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

interface POItem {
    product_id: number;
    name: string;
    barcode: string;
    quantity: number;
    cost_price: number;
    total_amount: number;
}

export default function Purchases() {
    const [orders, setOrders] = useState<(PurchaseOrder & { supplier_name: string })[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedOrderData, setSelectedOrderData] = useState<{ order: any, items: any[] } | null>(null);
    const [loading, setLoading] = useState(false);
    const [productSearch, setProductSearch] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [newPO, setNewPO] = useState<{ supplier_id: number; notes: string; items: POItem[]; }>({ supplier_id: 0, notes: '', items: [] });

    const loadData = useCallback(async () => {
        try { setLoading(true); const [orderData, supplierData, productData] = await Promise.all([purchaseService.getAll(), supplierService.getAll(), productService.getAll()]); setOrders(orderData); setSuppliers(supplierData); setProducts(productData); } catch (error) { console.error('Failed to load purchase data:', error); } finally { setLoading(false); }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleCreatePO = async () => {
        if (newPO.supplier_id === 0 || newPO.items.length === 0) { alert('Please select a supplier and add at least one item.'); return; }
        try { const total = newPO.items.reduce((sum, item) => sum + item.total_amount, 0); await purchaseService.create({ supplier_id: newPO.supplier_id, total_amount: total, status: 'DRAFT', notes: newPO.notes }, newPO.items); setIsCreateModalOpen(false); setNewPO({ supplier_id: 0, notes: '', items: [] }); loadData(); } catch (error) { console.error(error); alert('Failed to create purchase order'); }
    };

    const handleReceiveOrder = async (id: number) => { if (!confirm('Are you sure you want to receive this order? This will increase product stock levels.')) return; try { await purchaseService.receiveOrder(id); if (isViewModalOpen) setIsViewModalOpen(false); loadData(); } catch (error: any) { alert(error.message || 'Failed to receive order'); } };
    const deleteDraft = async (id: number) => { if (!confirm('Delete this draft order?')) return; try { await purchaseService.deleteDraft(id); loadData(); } catch (error: any) { alert(error.message || 'Failed to delete order'); } };
    const viewOrder = async (id: number) => { const data = await purchaseService.getById(id); setSelectedOrderData(data); setIsViewModalOpen(true); };

    const addItem = (product: Product) => {
        const existing = newPO.items.find(i => i.product_id === product.id);
        if (existing) {
            setNewPO({ ...newPO, items: newPO.items.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1, total_amount: (i.quantity + 1) * i.cost_price } : i) });
        } else {
            setNewPO({ ...newPO, items: [...newPO.items, { product_id: product.id, name: product.name, barcode: product.barcode, quantity: 1, cost_price: product.cost_price, total_amount: product.cost_price }] });
        }
        setProductSearch(''); setShowSuggestions(false);
    };

    const removeItem = (id: number) => { setNewPO({ ...newPO, items: newPO.items.filter(i => i.product_id !== id) }); };
    const updateItem = (id: number, field: keyof POItem, value: any) => {
        setNewPO({ ...newPO, items: newPO.items.map(i => { if (i.product_id === id) { const updated = { ...i, [field]: value }; updated.total_amount = updated.quantity * updated.cost_price; return updated; } return i; }) });
    };

    const filteredProducts = productSearch.length > 0 ? products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.barcode.includes(productSearch)) : [];

    return (
        <div className="p-4 bg-white min-h-screen text-black">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Purchase Orders</h1>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
                >
                    + New Purchase Order
                </button>
            </div>

            <table className="w-full border-collapse border">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border p-2 text-left">Order #</th>
                        <th className="border p-2 text-left">Date</th>
                        <th className="border p-2 text-left">Supplier</th>
                        <th className="border p-2 text-right">Amount</th>
                        <th className="border p-2 text-center">Status</th>
                        <th className="border p-2 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(o => (
                        <tr key={o.id} className="border-b hover:bg-gray-50">
                            <td className="border p-2 font-bold">{o.order_no}</td>
                            <td className="border p-2">{new Date(o.date).toLocaleDateString()}</td>
                            <td className="border p-2">{o.supplier_name}</td>
                            <td className="border p-2 text-right font-bold">₹{o.total_amount.toFixed(2)}</td>
                            <td className="border p-2 text-center">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${o.status === 'RECEIVED' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                    {o.status}
                                </span>
                            </td>
                            <td className="border p-2 text-center space-x-2">
                                <button onClick={() => viewOrder(o.id)} className="text-blue-600 underline">View</button>
                                {o.status === 'DRAFT' && <button onClick={() => deleteDraft(o.id)} className="text-red-600 underline">Delete</button>}
                            </td>
                        </tr>
                    ))}
                    {orders.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-gray-500">No purchase orders found.</td></tr>}
                </tbody>
            </table>

            {/* CREATE MODAL */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Purchase Order">
                <div className="flex flex-col gap-4 p-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Supplier</label>
                            <select
                                value={newPO.supplier_id}
                                onChange={(e) => setNewPO({ ...newPO, supplier_id: Number(e.target.value) })}
                                className="w-full border p-2 rounded"
                            >
                                <option value={0}>Select a Supplier...</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="relative">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Add Product</label>
                            <input
                                type="text"
                                placeholder="Search product..."
                                value={productSearch}
                                onChange={(e) => { setProductSearch(e.target.value); setShowSuggestions(true); }}
                                className="w-full border p-2 rounded"
                            />
                            {showSuggestions && filteredProducts.length > 0 && (
                                <div className="absolute top-full left-0 right-0 bg-white border shadow-lg z-10 max-h-48 overflow-y-auto">
                                    {filteredProducts.map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => addItem(p)}
                                            className="p-2 hover:bg-gray-100 cursor-pointer border-b"
                                        >
                                            {p.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-50 border rounded p-4">
                        <table className="w-full text-sm mb-4">
                            <thead><tr className="border-b"><th className="text-left pb-2">Item</th><th className="text-left pb-2">Qty</th><th className="text-right pb-2">Total</th><th className="text-right pb-2"></th></tr></thead>
                            <tbody>
                                {newPO.items.map(item => (
                                    <tr key={item.product_id} className="border-b">
                                        <td className="py-2">{item.name}</td>
                                        <td className="py-2">
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={e => updateItem(item.product_id, 'quantity', Number(e.target.value))}
                                                className="w-16 border rounded p-1"
                                            />
                                        </td>
                                        <td className="py-2 text-right">₹{item.total_amount.toFixed(2)}</td>
                                        <td className="py-2 text-right">
                                            <button onClick={() => removeItem(item.product_id)} className="text-red-600"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="text-right text-xl font-bold">Total: ₹{newPO.items.reduce((sum, i) => sum + i.total_amount, 0).toFixed(2)}</div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>Discard</Button>
                        <Button onClick={handleCreatePO}>Place Order</Button>
                    </div>
                </div>
            </Modal>

            {/* VIEW MODAL */}
            {selectedOrderData && (
                <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={`PO #${selectedOrderData.order.order_no}`}>
                    <div className="p-4 flex flex-col gap-4">
                        <div className="flex justify-between items-center bg-gray-50 p-4 rounded border">
                            <div>
                                <h2 className="font-bold text-lg">Supplier: {(selectedOrderData.order as any).supplier_name}</h2>
                                <p className="text-gray-500">Date: {new Date(selectedOrderData.order.date).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold">₹{selectedOrderData.order.total_amount.toFixed(2)}</div>
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-bold text-xs">{selectedOrderData.order.status}</span>
                            </div>
                        </div>

                        <table className="w-full border-collapse border text-sm">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border p-2 text-left">Product</th>
                                    <th className="border p-2 text-right">Qty</th>
                                    <th className="border p-2 text-right">Cost</th>
                                    <th className="border p-2 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedOrderData.items.map((item: any, i: number) => (
                                    <tr key={i} className="border-b">
                                        <td className="border p-2">{item.product_name}</td>
                                        <td className="border p-2 text-right">{item.quantity}</td>
                                        <td className="border p-2 text-right">₹{item.cost_price.toFixed(2)}</td>
                                        <td className="border p-2 text-right">₹{item.total_amount.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {selectedOrderData.order.status === 'DRAFT' && (
                            <div className="flex justify-end mt-4">
                                <Button onClick={() => handleReceiveOrder(selectedOrderData.order.id)}>Receive Order & Update Stock</Button>
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
}
