import { useState, useEffect, useCallback } from 'react';
import { customerService, type Customer } from '../services/customerService';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { CustomerForm } from '../components/CustomerForm';
import { Search, Plus, Pencil, Trash2, User, ShoppingBag, Calendar } from 'lucide-react';
import { useKeyboard } from '../hooks/useKeyboard';
import clsx from 'clsx';

export default function Customers() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);
    const [viewingHistory, setViewingHistory] = useState<Customer | undefined>(undefined);
    const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [viewingLedger, setViewingLedger] = useState<Customer | undefined>(undefined);
    const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentNotes, setPaymentNotes] = useState('');

    const loadCustomers = useCallback(async () => {
        try {
            setLoading(true);
            const data = search.length > 0 ? await customerService.search(search) : await customerService.getAll();
            setCustomers(data);
        } catch (error) { console.error('Failed to load customers:', error); } finally { setLoading(false); }
    }, [search]);

    useEffect(() => { const timeout = setTimeout(loadCustomers, 300); return () => clearTimeout(timeout); }, [loadCustomers]);
    useKeyboard({ 'f': (e) => { e.preventDefault(); document.getElementById('customer-search')?.focus(); } });

    const handleSave = async (customerData: Omit<Customer, 'id' | 'total_purchases' | 'created_at'>) => {
        try { if (editingCustomer) { await customerService.update({ ...editingCustomer, ...customerData }); } else { await customerService.create(customerData); } setIsModalOpen(false); setEditingCustomer(undefined); loadCustomers(); } catch (error) { alert('Failed to save customer.'); }
    };

    const handleDelete = async (id: number) => { if (!confirm('Delete this customer?')) return; try { await customerService.delete(id); loadCustomers(); } catch (error) { alert('Failed to delete customer'); } };
    const openEdit = (c: Customer) => { setEditingCustomer(c); setIsModalOpen(true); };
    const openAdd = () => { setEditingCustomer(undefined); setIsModalOpen(true); };

    const viewHistory = async (c: Customer) => { setViewingHistory(c); setPurchaseHistory(await customerService.getPurchaseHistory(c.id)); };
    const viewLedger = async (c: Customer) => { setViewingLedger(c); handleRefreshLedger(c.id); };
    const handleRefreshLedger = async (cid: number) => { setLedgerEntries(await customerService.getLedger(cid)); };

    const handleTakePayment = async () => {
        if (!viewingLedger) return;
        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) { alert('Invalid amount'); return; }
        try { await customerService.addPayment(viewingLedger.id, amount, paymentNotes); alert('Payment Recorded'); setPaymentAmount(''); setPaymentNotes(''); handleRefreshLedger(viewingLedger.id); loadCustomers(); } catch (error) { console.error(error); alert('Failed to record payment'); }
    };

    return (
        <div className="p-4 bg-white min-h-screen text-black">
            <h1 className="text-2xl font-bold mb-4">Customers</h1>

            <div className="flex gap-4 mb-4">
                <input
                    type="text"
                    placeholder="Search..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="border p-2 rounded w-full max-w-md"
                />
                <button onClick={openAdd} className="bg-blue-500 text-white px-4 py-2 rounded">
                    + Add Customer
                </button>
            </div>

            <table className="w-full border-collapse border">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border p-2 text-left">Customer</th>
                        <th className="border p-2 text-left">Contact</th>
                        <th className="border p-2 text-right">Balance</th>
                        <th className="border p-2 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {customers.map(c => (
                        <tr key={c.id} className="border-b hover:bg-gray-50">
                            <td className="border p-2">
                                <div className="font-bold">{c.name}</div>
                                {c.phone && <div className="text-sm text-gray-500">{c.phone}</div>}
                            </td>
                            <td className="border p-2">
                                {c.email && <div>{c.email}</div>}
                                {c.address && <div className="text-sm text-gray-500">{c.address}</div>}
                            </td>
                            <td className={`border p-2 text-right font-bold ${(c.balance || 0) > 0 ? 'text-red-500' : 'text-gray-500'}`}>
                                ₹{(c.balance || 0).toFixed(2)}
                            </td>
                            <td className="border p-2 text-center">
                                <button onClick={() => viewLedger(c)} className="text-blue-600 hover:underline mr-2">Ledger</button>
                                <button onClick={() => viewHistory(c)} className="text-blue-600 hover:underline mr-2">History</button>
                                <button onClick={() => openEdit(c)} className="text-blue-600 hover:underline mr-2">Edit</button>
                                <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:underline">Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Modals - Simplified Content */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Customer">
                <CustomerForm initialData={editingCustomer} onSubmit={handleSave} onCancel={() => setIsModalOpen(false)} />
            </Modal>

            {/* Ledger Modal Placeholder Logic would go here if not handled by external component, maintaining simplified access */}
        </div>
    );
}
