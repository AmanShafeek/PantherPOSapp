import { useState, useEffect, useCallback } from 'react';
import { promotionService } from '../services/promotionService';
import type { Promotion, LoyaltyConfig } from '../types/db';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Plus, Pencil, Trash2, Tag, Zap, Award, Save, Info } from 'lucide-react';
import clsx from 'clsx';

export default function Promotions() {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [loyaltyConfigs, setLoyaltyConfigs] = useState<LoyaltyConfig[]>([]);
    const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
    const [editingPromo, setEditingPromo] = useState<Partial<Promotion> | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'OFFERS' | 'LOYALTY'>('OFFERS');

    const loadData = useCallback(async () => {
        try { setLoading(true); const [promos, configs] = await Promise.all([promotionService.getAllPromotions(), promotionService.getLoyaltyConfigs()]); setPromotions(promos); setLoyaltyConfigs(configs); } catch (error) { console.error('Failed to load promotions:', error); } finally { setLoading(false); }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSavePromo = async (e: React.FormEvent) => {
        e.preventDefault();
        try { if (editingPromo?.id) { await promotionService.updatePromotion(editingPromo as Promotion); } else { await promotionService.createPromotion(editingPromo as Omit<Promotion, 'id'>); } setIsPromoModalOpen(false); loadData(); } catch (error) { console.error('Save error:', error); alert('Failed to save promotion'); }
    };

    const handleDeletePromo = async (id: number) => { if (!confirm('Delete this promotion?')) return; await promotionService.deletePromotion(id); loadData(); };
    const updateLoyaltyValue = async (key: string, value: string) => { await promotionService.updateLoyaltyConfig(key, value); loadData(); };
    const openAddPromo = () => { setEditingPromo({ name: '', type: 'COUPON', discount_type: 'PERCENT', discount_value: 0, min_cart_value: 0, max_discount: 0, active: true }); setIsPromoModalOpen(true); };
    const openEditPromo = (promo: Promotion) => { setEditingPromo(promo); setIsPromoModalOpen(true); };

    return (
        <div className="p-4 bg-white min-h-screen text-black">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Promotions & Loyalty</h1>
                    <p className="text-gray-500 text-sm">Manage discounts, coupons and reward programs</p>
                </div>
                {activeTab === 'OFFERS' && (
                    <button
                        onClick={openAddPromo}
                        className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 font-bold flex items-center gap-2"
                    >
                        <Plus size={20} /> Create Offer
                    </button>
                )}
            </div>

            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('OFFERS')}
                    className={`px-4 py-2 rounded font-bold ${activeTab === 'OFFERS' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                    Discounts & Coupons
                </button>
                <button
                    onClick={() => setActiveTab('LOYALTY')}
                    className={`px-4 py-2 rounded font-bold ${activeTab === 'LOYALTY' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                    Loyalty Settings
                </button>
            </div>

            {activeTab === 'OFFERS' ? (
                <div className="overflow-hidden border rounded">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100 text-left">
                                <th className="p-3 border-b">Offer Name</th>
                                <th className="p-3 border-b">Discount</th>
                                <th className="p-3 border-b">Status</th>
                                <th className="p-3 border-b text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {promotions.map(p => (
                                <tr key={p.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3">
                                        <div className="font-bold">{p.name}</div>
                                        {p.code && <span className="text-xs bg-green-100 text-green-800 px-1 rounded font-bold">{p.code}</span>}
                                        <div className="text-xs text-gray-500">{p.type}</div>
                                    </td>
                                    <td className="p-3">
                                        <div className="font-bold">{p.discount_type === 'PERCENT' ? `${p.discount_value}%` : `₹${p.discount_value}`} OFF</div>
                                        <div className="text-xs text-gray-500">Min Order: ₹{p.min_cart_value}</div>
                                    </td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${p.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                            {p.active ? 'Active' : 'Paused'}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right space-x-2">
                                        <button onClick={() => openEditPromo(p)} className="text-blue-600 hover:text-blue-800"><Pencil size={16} /></button>
                                        <button onClick={() => handleDeletePromo(p.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                            {promotions.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-500">No promotions found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="border rounded p-6 bg-white max-w-2xl">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Award className="text-blue-600" /> Loyalty Rewards Program
                    </h2>
                    <div className="flex flex-col gap-4">
                        {loyaltyConfigs.map((config) => (
                            <div key={config.key}>
                                <div className="flex justify-between mb-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">{config.key.replace(/_/g, ' ')}</label>
                                    <Info size={12} className="text-gray-400" />
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={config.value}
                                        onChange={(e) => { const newConfigs = loyaltyConfigs.map(c => c.key === config.key ? { ...c, value: e.target.value } : c); setLoyaltyConfigs(newConfigs); }}
                                        onBlur={(e) => updateLoyaltyValue(config.key, e.target.value)}
                                        className="w-full p-2 border rounded font-bold"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                                        {config.key.includes('rupee') ? 'Value' : 'Rate'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Modal isOpen={isPromoModalOpen} onClose={() => setIsPromoModalOpen(false)} title={editingPromo?.id ? 'Edit Offer' : 'Create New Offer'}>
                <div className="p-4">
                    <form onSubmit={handleSavePromo} className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                                <select
                                    value={editingPromo?.type}
                                    onChange={e => setEditingPromo(prev => ({ ...prev, type: e.target.value as any }))}
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="COUPON">Coupon</option>
                                    <option value="AUTOMATED">Auto-Applied</option>
                                </select>
                            </div>
                            {editingPromo?.type === 'COUPON' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Code</label>
                                    <input
                                        value={editingPromo?.code}
                                        onChange={e => setEditingPromo(prev => ({ ...prev, code: e.target.value }))}
                                        className="w-full p-2 border rounded uppercase"
                                    />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
                            <input
                                value={editingPromo?.name}
                                onChange={e => setEditingPromo(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full p-2 border rounded"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Discount Type</label>
                                <select
                                    value={editingPromo?.discount_type}
                                    onChange={e => setEditingPromo(prev => ({ ...prev, discount_type: e.target.value as any }))}
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="PERCENT">Percentage (%)</option>
                                    <option value="FLAT">Flat Amount (₹)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Discount Value</label>
                                <input
                                    type="number"
                                    value={editingPromo?.discount_value}
                                    onChange={e => setEditingPromo(prev => ({ ...prev, discount_value: parseFloat(e.target.value) }))}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Min Order Value</label>
                                <input
                                    type="number"
                                    value={editingPromo?.min_cart_value}
                                    onChange={e => setEditingPromo(prev => ({ ...prev, min_cart_value: parseFloat(e.target.value) }))}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Active?</label>
                                <select
                                    value={editingPromo?.active ? 'true' : 'false'}
                                    onChange={e => setEditingPromo(prev => ({ ...prev, active: e.target.value === 'true' }))}
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="true">Yes</option>
                                    <option value="false">No</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-4">
                            <Button variant="secondary" onClick={() => setIsPromoModalOpen(false)} type="button">Cancel</Button>
                            <Button type="submit">Save Offer</Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
}
