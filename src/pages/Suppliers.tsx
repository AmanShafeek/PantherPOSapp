import { useState, useEffect, useCallback } from 'react';
import { supplierService } from '../services/supplierService';
import type { Supplier, SupplierLedger } from '../types/db';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Search, Plus, Pencil, Trash2, Truck, User, FileText, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useKeyboard } from '../hooks/useKeyboard';
import clsx from 'clsx';

function SupplierLedgerModal({ supplier, isOpen, onClose }: { supplier: Supplier, isOpen: boolean, onClose: () => void }) {
    const [ledger, setLedger] = useState<SupplierLedger[]>([]);
    const [loading, setLoading] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMode, setPaymentMode] = useState('CASH');
    const [paymentNote, setPaymentNote] = useState('');

    const loadLedger = useCallback(async () => { if (!supplier) return; setLoading(true); try { setLedger(await supplierService.getLedger(supplier.id)); } finally { setLoading(false); } }, [supplier]);
    useEffect(() => { if (isOpen) loadLedger(); }, [isOpen, loadLedger]);

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault(); if (!supplier || !paymentAmount) return;
        try { await supplierService.addPayment(supplier.id, parseFloat(paymentAmount), paymentMode, paymentNote); setPaymentAmount(''); setPaymentNote(''); loadLedger(); alert('Payment Recorded'); } catch (error) { alert('Failed to record payment'); }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Ledger: ${supplier?.name}`}>
            <div className="p-4 bg-white text-black h-[500px] flex flex-col gap-4">
                <div className="flex justify-between items-center p-4 border rounded bg-gray-50">
                    <span className="text-gray-600 font-bold">Current Balance</span>
                    <span className={`text-2xl font-bold ${(supplier?.balance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ₹{(supplier?.balance || 0).toFixed(2)}
                    </span>
                </div>

                <div className="flex-1 overflow-auto border rounded">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-2 border text-left">Date</th>
                                <th className="p-2 border text-left">Description</th>
                                <th className="p-2 border text-left">Type</th>
                                <th className="p-2 border text-right">Amount</th>
                                <th className="p-2 border text-right">Bal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ledger.map((l, i) => (
                                <tr key={i} className="border-b">
                                    <td className="p-2 border">{new Date(l.date).toLocaleDateString()}</td>
                                    <td className="p-2 border">{l.description}</td>
                                    <td className="p-2 border">{l.type}</td>
                                    <td className="p-2 border text-right">₹{l.amount.toFixed(2)}</td>
                                    <td className="p-2 border text-right">₹{l.balance_after.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="border p-4 rounded bg-gray-50">
                    <h3 className="font-bold mb-2">Record Payment</h3>
                    <form onSubmit={handlePayment} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <input type="number" placeholder="Amount" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="border p-2 rounded" />
                        <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} className="border p-2 rounded">
                            <option value="CASH">CASH</option><option value="BANK">BANK</option><option value="UPI">UPI</option>
                        </select>
                        <input type="text" placeholder="Notes" value={paymentNote} onChange={e => setPaymentNote(e.target.value)} className="border p-2 rounded" />
                        <Button type="submit">Pay</Button>
                    </form>
                </div>
            </div>
        </Modal>
    );
}

export default function Suppliers() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier> | null>(null);
    const [loading, setLoading] = useState(false);
    const [isLedgerOpen, setIsLedgerOpen] = useState(false);
    const [selectedLedgerSupplier, setSelectedLedgerSupplier] = useState<Supplier | null>(null);

    const loadSuppliers = useCallback(async () => { try { setLoading(true); setSuppliers(await (search.length > 0 ? supplierService.search(search) : supplierService.getAll())); } catch (error) { console.error('Failed to load suppliers:', error); } finally { setLoading(false); } }, [search]);
    useEffect(() => { const timeout = setTimeout(loadSuppliers, 300); return () => clearTimeout(timeout); }, [loadSuppliers]);
    useKeyboard({ 'f': (e) => { e.preventDefault(); document.getElementById('supplier-search')?.focus(); } });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault(); if (!editingSupplier?.name) return;
        try { if (editingSupplier.id) { await supplierService.update(editingSupplier as Supplier); } else { await supplierService.create(editingSupplier as Omit<Supplier, 'id' | 'created_at'>); } setIsModalOpen(false); setEditingSupplier(null); loadSuppliers(); } catch (error) { alert('Failed to save supplier'); }
    };

    const handleDelete = async (id: number) => { if (!confirm('Delete this supplier?')) return; try { await supplierService.delete(id); loadSuppliers(); } catch (error: any) { alert(error.message); } };
    const openLedger = (s: Supplier) => { setSelectedLedgerSupplier(s); setIsLedgerOpen(true); };

    return (
        <div className="p-4 bg-white min-h-screen text-black">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Suppliers</h1>
                <button
                    onClick={() => { setEditingSupplier({}); setIsModalOpen(true); }}
                    className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
                >
                    + Add Supplier
                </button>
            </div>

            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search suppliers..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full p-2 border rounded"
                />
            </div>

            <table className="w-full border-collapse border">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border p-2 text-left">Supplier</th>
                        <th className="border p-2 text-left">Contact</th>
                        <th className="border p-2 text-right">Balance</th>
                        <th className="border p-2 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {suppliers.map(s => (
                        <tr key={s.id} className="border-b hover:bg-gray-50">
                            <td className="border p-2 font-bold">{s.name}</td>
                            <td className="border p-2">{s.contact_person}</td>
                            <td className={`border p-2 text-right font-bold ${(s.balance || 0) > 0 ? 'text-red-500' : 'text-gray-500'}`}>
                                ₹{(s.balance || 0).toFixed(2)}
                            </td>
                            <td className="border p-2 text-center space-x-2">
                                <button onClick={() => openLedger(s)} className="text-blue-600 underline">Ledger</button>
                                <button onClick={() => { setEditingSupplier(s); setIsModalOpen(true); }} className="text-blue-600 underline">Edit</button>
                                <button onClick={() => handleDelete(s.id)} className="text-red-600 underline">Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSupplier?.id ? 'Edit Supplier' : 'Add Supplier'}>
                <form onSubmit={handleSave} className="flex flex-col gap-4 p-2">
                    <input
                        placeholder="Supplier Name"
                        required
                        value={editingSupplier?.name || ''}
                        onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                        className="border p-2 rounded"
                    />
                    <input
                        placeholder="Contact Person"
                        value={editingSupplier?.contact_person || ''}
                        onChange={(e) => setEditingSupplier({ ...editingSupplier, contact_person: e.target.value })}
                        className="border p-2 rounded"
                    />
                    <Button type="submit">Save Supplier</Button>
                </form>
            </Modal>

            {selectedLedgerSupplier && <SupplierLedgerModal supplier={selectedLedgerSupplier} isOpen={isLedgerOpen} onClose={() => setIsLedgerOpen(false)} />}
        </div>
    );
}
