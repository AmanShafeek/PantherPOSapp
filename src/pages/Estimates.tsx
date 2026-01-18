import { useState, useEffect } from 'react';
import { estimateService } from '../services/estimateService';
import { Table } from '../components/Table';
import { Plus, Check, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Estimates() {
    const [estimates, setEstimates] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const loadEstimates = async () => {
        setLoading(true);
        const data = await estimateService.getAll();
        setEstimates(data);
        setLoading(false);
    };

    useEffect(() => {
        loadEstimates();
    }, []);

    const handleConvertToBill = async (id: number) => {
        if (!confirm('Convert this estimate to a permanent Bill? This will deduct stock.')) return;
        try {
            await estimateService.convertToBill(id);
            alert('Converted successfully!');
            loadEstimates();
        } catch (e: any) {
            alert('Error: ' + e.message);
        }
    };

    return (
        <div className="p-4 bg-white min-h-screen text-black">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Estimates & Quotations</h1>
                    <p className="text-gray-500 text-sm">Manage quotes and convert them to bills</p>
                </div>
                <button
                    onClick={() => {
                        alert("Redirecting to POS for Estimate creation. Please add items and click the Document icon next to Pay.");
                        navigate('/');
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 font-bold flex items-center gap-2"
                >
                    <Plus size={18} /> New Estimate
                </button>
            </div>

            {loading ? (
                <div>Loading estimates...</div>
            ) : (
                <table className="w-full border-collapse border">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border p-2 text-left">Est. No</th>
                            <th className="border p-2 text-left">Date</th>
                            <th className="border p-2 text-left">Customer</th>
                            <th className="border p-2 text-left">Status</th>
                            <th className="border p-2 text-right">Amount</th>
                            <th className="border p-2 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {estimates.map(e => (
                            <tr key={e.id} className="border-b hover:bg-gray-50">
                                <td className="border p-2 font-bold">{e.estimate_no}</td>
                                <td className="border p-2">{new Date(e.date).toLocaleDateString()}</td>
                                <td className="border p-2">{e.customer_name || 'Walk-in'}</td>
                                <td className="border p-2">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${e.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800' : e.status === 'CONVERTED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {e.status}
                                    </span>
                                </td>
                                <td className="border p-2 text-right font-bold">₹{e.total_amount.toFixed(2)}</td>
                                <td className="border p-2 text-center">
                                    {e.status === 'ACTIVE' && (
                                        <button
                                            onClick={() => handleConvertToBill(e.id)}
                                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex items-center gap-1 mx-auto"
                                        >
                                            <Check size={14} /> Convert
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {estimates.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-gray-500">No estimates found.</td></tr>}
                    </tbody>
                </table>
            )}
        </div>
    );
}
