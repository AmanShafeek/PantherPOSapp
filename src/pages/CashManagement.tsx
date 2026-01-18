import { useState, useEffect } from 'react';
import { cashService } from '../services/cashService';
import type { CashDrawerSession, CashTransaction, User } from '../types/db';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Banknote, ArrowDownCircle, ArrowUpCircle, Lock, History } from 'lucide-react';
import clsx from 'clsx';
import { Table } from '../components/Table';

interface CashManagementProps {
    user: User;
}

export default function CashManagement({ user }: CashManagementProps) {
    const [currentSession, setCurrentSession] = useState<CashDrawerSession | null>(null);
    const [transactions, setTransactions] = useState<CashTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [transactionType, setTransactionType] = useState<'DROP' | 'PAYOUT'>('DROP');
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
    const [closeAmount, setCloseAmount] = useState('');

    useEffect(() => { loadSessionData(); }, []);

    const loadSessionData = async () => {
        setLoading(true);
        try { const session = await cashService.getCurrentSession(); setCurrentSession(session); if (session) { setTransactions(await cashService.getTransactions(session.id)); } } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const handleTransaction = async () => {
        if (!currentSession || !amount || !reason) return;
        try { await cashService.addTransaction(currentSession.id, transactionType, parseFloat(amount), reason); setIsTransactionModalOpen(false); setAmount(''); setReason(''); loadSessionData(); alert('Transaction Added Successfully'); } catch (error) { console.error(error); alert('Failed to add transaction'); }
    };

    const handleCloseShift = async () => {
        if (!currentSession || !closeAmount) return;
        try { await cashService.endSession(currentSession.id, parseFloat(closeAmount)); setIsCloseModalOpen(false); setCloseAmount(''); loadSessionData(); alert('Shift Closed Successfully'); } catch (error) { console.error(error); alert('Failed to close shift'); }
    };

    if (loading) return <div style={{ padding: '32px', color: 'white' }}>Loading Cash Data...</div>;

    if (!currentSession) {
        return (
            <div style={{ padding: '32px', minHeight: '100vh', background: '#09090b', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Banknote size={64} style={{ opacity: 0.2, marginBottom: '16px' }} />
                <h2 style={{ fontSize: '24px', fontWeight: 900, textTransform: 'uppercase' }}>No Active Shift</h2>
                <p style={{ opacity: 0.6, marginTop: '8px' }}>There is no open cash drawer session. Please start a new session (usually done at login).</p>
            </div>
        );
    }

    const currentBalance = currentSession.start_cash + transactions.reduce((acc, tx) => {
        if (tx.type === 'DROP' || tx.type === 'PAYOUT' || tx.type === 'CLOSING' || tx.type === 'REFUND') return acc - tx.amount;
        if (tx.type === 'SALE') return acc + tx.amount;
        if (tx.type === 'OPENING') return acc;
        return acc;
    }, 0);

    return (
        <div className="p-4 bg-white min-h-screen text-black">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Cash Management</h1>
                    {currentSession && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className={`w-2 h-2 rounded-full ${currentSession.status === 'OPEN' ? 'bg-green-500' : 'bg-red-500'}`} />
                            Session #{currentSession.id} • Started {new Date(currentSession.start_time).toLocaleString()}
                        </div>
                    )}
                </div>
                <button
                    onClick={() => setIsCloseModalOpen(true)}
                    className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded border border-red-200 hover:bg-red-200 font-bold"
                >
                    <Lock size={16} /> Close Register
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-6 border rounded bg-blue-50">
                    <div className="text-xs font-bold text-blue-600 uppercase mb-2">Opening Balance</div>
                    <div className="text-3xl font-bold text-blue-800">₹{currentSession?.start_cash.toFixed(2)}</div>
                </div>
                <div className="p-6 border rounded bg-green-50">
                    <div className="text-xs font-bold text-green-600 uppercase mb-2">Current Cash in Drawer</div>
                    <div className="text-3xl font-bold text-green-800">₹{currentBalance.toFixed(2)}</div>
                </div>
                <div className="flex flex-col gap-3 justify-center">
                    <button
                        onClick={() => { setTransactionType('DROP'); setIsTransactionModalOpen(true); }}
                        className="w-full py-3 bg-orange-100 text-orange-700 border border-orange-200 rounded font-bold flex items-center justify-center gap-2 hover:bg-orange-200"
                    >
                        <ArrowDownCircle size={18} /> Drop Cash
                    </button>
                    <button
                        onClick={() => { setTransactionType('PAYOUT'); setIsTransactionModalOpen(true); }}
                        className="w-full py-3 bg-red-100 text-red-700 border border-red-200 rounded font-bold flex items-center justify-center gap-2 hover:bg-red-200"
                    >
                        <ArrowUpCircle size={18} /> Payout / Expense
                    </button>
                </div>
            </div>

            <div className="border rounded bg-gray-50 overflow-hidden">
                <div className="p-4 border-b flex items-center gap-2">
                    <History size={20} className="text-gray-500" />
                    <h3 className="text-lg font-bold">Session History</h3>
                </div>
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-100 text-left">
                            <th className="p-3 border-b">Time</th>
                            <th className="p-3 border-b">Type</th>
                            <th className="p-3 border-b">Reason</th>
                            <th className="p-3 border-b text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map(tx => (
                            <tr key={tx.id} className="border-b hover:bg-gray-100">
                                <td className="p-3">{new Date(tx.time).toLocaleTimeString()}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${tx.type === 'OPENING' ? 'bg-blue-100 text-blue-800' :
                                            tx.type === 'DROP' ? 'bg-orange-100 text-orange-800' :
                                                tx.type === 'SALE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {tx.type}
                                    </span>
                                </td>
                                <td className="p-3 font-medium">{tx.reason}</td>
                                <td className="p-3 text-right font-bold">₹{tx.amount.toFixed(2)}</td>
                            </tr>
                        ))}
                        {transactions.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-500">No transactions yet.</td></tr>}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} title={`${transactionType} CASH`}>
                <div className="flex flex-col gap-4 p-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount</label>
                        <input
                            type="number"
                            autoFocus
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full p-3 text-2xl font-bold border rounded"
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reason / Reference</label>
                        <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full p-3 border rounded"
                            placeholder={transactionType === 'DROP' ? "e.g. Bank Deposit" : "e.g. Vendor Payment"}
                        />
                    </div>
                    <div className="flex gap-3 justify-end mt-2">
                        <Button variant="secondary" onClick={() => setIsTransactionModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleTransaction}>Save Transaction</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isCloseModalOpen} onClose={() => setIsCloseModalOpen(false)} title="CLOSE REGISTER">
                <div className="flex flex-col gap-4 p-4">
                    <div className="p-3 bg-red-100 border border-red-200 rounded text-red-700 font-bold text-sm text-center uppercase">
                        This will end the current shift.
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                            Closing Cash Count (Calculated: ₹{currentBalance.toFixed(2)})
                        </label>
                        <input
                            type="number"
                            autoFocus
                            value={closeAmount}
                            onChange={(e) => setCloseAmount(e.target.value)}
                            className="w-full p-3 text-2xl font-bold border rounded"
                            placeholder="Enter Actual Count"
                        />
                    </div>
                    <div className="flex gap-3 justify-end mt-2">
                        <Button variant="secondary" onClick={() => setIsCloseModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleCloseShift} className="bg-red-600 hover:bg-red-700 text-white">Close Shift</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
