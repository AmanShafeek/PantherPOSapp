import { useState, useEffect } from 'react';
import { settingsService, type AppSettings } from '../services/settingsService';
import { databaseService } from '../services/databaseService';
import { Receipt, Database, Percent, Trash2, Plus, Printer, Store, Check } from 'lucide-react';
import { Button } from '../components/Button';
import { Table } from '../components/Table';
import { Modal } from '../components/Modal';
import clsx from 'clsx';

export default function Settings() {
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'TAXES' | 'RECEIPT' | 'DATA'>('GENERAL');
    const [taxRates, setTaxRates] = useState<any[]>([]);
    const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
    const [editingTax, setEditingTax] = useState<any>(null);

    useEffect(() => { loadSettings(); loadTaxRates(); }, []);

    const loadSettings = async () => { setSettings(await settingsService.getSettings()); };
    const loadTaxRates = async () => { setTaxRates(await settingsService.getTaxRates()); };

    const handleSaveSetting = async (key: keyof AppSettings, value: any) => {
        if (!settings) return;
        setSettings({ ...settings, [key]: value });
        await settingsService.updateSetting(key, value);
    };

    const handleSaveTax = async (e: React.FormEvent) => {
        e.preventDefault();
        try { await settingsService.saveTaxRate(editingTax); setIsTaxModalOpen(false); loadTaxRates(); } catch (error) { console.error(error); alert('Failed to save tax rate'); }
    };

    const handleDeleteTax = async (id: number) => { if (confirm('Delete this tax rate?')) { await settingsService.deleteTaxRate(id); loadTaxRates(); } };
    const handleBackup = async () => { try { const msg = await databaseService.createBackup(); alert(msg); } catch (error) { alert('Backup failed'); } };

    if (!settings) return <div style={{ padding: '32px', color: 'white' }}>Loading...</div>;

    const InputGroup = ({ label, value, field, type = "text", placeholder = "" }: any) => (
        <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase">{label}</label>
            <input
                type={type}
                className="w-full p-2 border rounded"
                value={value || ''}
                onChange={(e) => handleSaveSetting(field, type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                placeholder={placeholder}
            />
        </div>
    );

    return (
        <div className="p-4 bg-white min-h-screen text-black">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-gray-500 text-sm">System Configuration & Preferences</p>
            </div>

            <div className="flex gap-6">
                {/* Sidebar Navigation */}
                <div className="w-64 flex flex-col gap-2">
                    {[
                        { id: 'GENERAL', label: 'Store General', icon: Store },
                        { id: 'TAXES', label: 'Tax Rules', icon: Percent },
                        { id: 'RECEIPT', label: 'Receipt Template', icon: Receipt },
                        { id: 'DATA', label: 'Backup & Data', icon: Database },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-3 p-3 rounded text-left transition-colors ${activeTab === tab.id ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-gray-100 text-gray-700'
                                }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 p-6 border rounded bg-gray-50">

                    {/* GENERAL SETTINGS */}
                    {activeTab === 'GENERAL' && (
                        <div className="max-w-xl flex flex-col gap-8">
                            <div className="flex flex-col gap-4">
                                <h2 className="text-lg font-bold border-b pb-2">Visual Preferences</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => { document.body.classList.remove('light-mode'); localStorage.setItem('theme', 'dark'); localStorage.removeItem('lightMode'); }}
                                        className="p-4 border rounded bg-gray-900 text-white text-left hover:opacity-90"
                                    >
                                        <div className="font-bold">Obsidian Dark</div>
                                        <div className="text-xs text-gray-400">High contrast, neon accents.</div>
                                    </button>

                                    <button
                                        onClick={() => { document.body.classList.add('light-mode'); localStorage.setItem('theme', 'light'); localStorage.setItem('lightMode', 'true'); }}
                                        className="p-4 border rounded bg-white text-gray-900 text-left hover:bg-gray-50"
                                    >
                                        <div className="font-bold">Bubblegum Light</div>
                                        <div className="text-xs text-gray-500">Clean, airy aesthetic.</div>
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <h2 className="text-lg font-bold border-b pb-2">Store Details</h2>
                                <InputGroup label="Store Name" value={settings.store_name} field="store_name" />
                                <InputGroup label="Address Line 1" value={settings.store_address} field="store_address" />
                                <InputGroup label="Phone Number" value={settings.store_phone} field="store_phone" />
                                <InputGroup label="GSTIN / Tax ID" value={settings.gst_no} field="gst_no" />
                            </div>
                        </div>
                    )}

                    {/* TAX SETTINGS */}
                    {activeTab === 'TAXES' && (
                        <div className="flex flex-col gap-6">
                            <div className="flex justify-between items-center border-b pb-4">
                                <h2 className="text-lg font-bold">Tax Rates</h2>
                                <button
                                    onClick={() => { setEditingTax({ name: '', rate: 0 }); setIsTaxModalOpen(true); }}
                                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-bold"
                                >
                                    <Plus size={16} /> Add Tax Rate
                                </button>
                            </div>

                            <div className="border rounded overflow-hidden bg-white">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100 text-left">
                                            <th className="p-3 border-b">Name</th>
                                            <th className="p-3 border-b">Rate (%)</th>
                                            <th className="p-3 border-b">Default</th>
                                            <th className="p-3 border-b">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {taxRates.map((r) => (
                                            <tr key={r.id} className="border-b hover:bg-gray-50">
                                                <td className="p-3 font-medium">{r.name}</td>
                                                <td className="p-3">{r.rate}%</td>
                                                <td className="p-3">
                                                    {r.is_default && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-bold">Default</span>}
                                                </td>
                                                <td className="p-3 flex gap-2">
                                                    <button onClick={() => { setEditingTax(r); setIsTaxModalOpen(true); }} className="text-blue-600 hover:text-blue-800 text-sm underline">Edit</button>
                                                    <button onClick={() => handleDeleteTax(r.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                        {taxRates.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-500">No tax rates defined.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* RECEIPT SETTINGS */}
                    {activeTab === 'RECEIPT' && (
                        <div className="max-w-xl flex flex-col gap-6">
                            <h2 className="text-lg font-bold border-b pb-2">Receipt Customization</h2>
                            <InputGroup label="Receipt Header (Welcome Message)" value={settings.receipt_header} field="receipt_header" />
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Receipt Footer / Terms</label>
                                <textarea
                                    className="w-full h-32 p-2 border rounded resize-none"
                                    value={settings.invoice_footer || ''}
                                    onChange={(e) => handleSaveSetting('invoice_footer', e.target.value)}
                                />
                            </div>

                            <div className="p-4 bg-gray-100 rounded border flex items-center gap-4">
                                <Printer size={24} className="text-gray-500" />
                                <div>
                                    <div className="font-bold">Printer Configuration</div>
                                    <div className="text-xs text-gray-500">System default printer will be used</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DATA BACKUP */}
                    {activeTab === 'DATA' && (
                        <div className="max-w-xl flex flex-col gap-6">
                            <h2 className="text-lg font-bold border-b pb-2">Data Management</h2>

                            <div className="p-6 bg-blue-50 border border-blue-200 rounded flex flex-col gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center text-blue-600">
                                        <Database size={24} />
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-blue-900">Database Backup</div>
                                        <div className="text-sm text-blue-700">Create a local copy of your entire database.</div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleBackup}
                                    className="w-full py-3 bg-blue-600 text-white rounded font-bold hover:bg-blue-700"
                                >
                                    Create Backup Now
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Tax Rate Modal */}
            <Modal isOpen={isTaxModalOpen} onClose={() => setIsTaxModalOpen(false)} title={editingTax?.id ? "Edit Tax Rate" : "Add Tax Rate"}>
                <form onSubmit={handleSaveTax} className="flex flex-col gap-4 p-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Name</label>
                        <input className="w-full p-2 border rounded" value={editingTax?.name || ''} onChange={e => setEditingTax({ ...editingTax, name: e.target.value })} placeholder="e.g. GST 18%" required />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Rate (%)</label>
                        <input type="number" step="0.01" className="w-full p-2 border rounded" value={editingTax?.rate || ''} onChange={e => setEditingTax({ ...editingTax, rate: parseFloat(e.target.value) })} placeholder="18.0" required />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                        <input type="checkbox" className="w-5 h-5" checked={editingTax?.is_default || false} onChange={e => setEditingTax({ ...editingTax, is_default: e.target.checked })} />
                        <label className="font-bold">Set as Default Rate</label>
                    </div>
                    <div className="flex gap-2 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsTaxModalOpen(false)} className="flex-1">Cancel</Button>
                        <Button type="submit" className="flex-1">Save Tax Rate</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
