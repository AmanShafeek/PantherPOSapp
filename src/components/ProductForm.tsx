import React, { useEffect, useState, useCallback } from 'react';
import type { Product } from '../types/db';
import { Button } from './Button';
import { Upload, X, Copy, Tag, RefreshCw } from 'lucide-react';
import { productService } from '../services/productService';
import clsx from 'clsx';
import { Table } from './Table';

interface ProductFormProps {
    initialData?: Partial<Product>;
    onSubmit: (data: Omit<Product, 'id'>) => void;
    onCancel: () => void;
}

export function ProductForm({ initialData, onSubmit, onCancel }: ProductFormProps) {
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'VARIANTS'>('GENERAL');

    // Form State
    const [formData, setFormData] = useState<Omit<Product, 'id'>>({
        name: '',
        barcode: '',
        cost_price: 0,
        sell_price: 0,
        stock: 0,
        gst_rate: 0,
        hsn_code: '',
        min_stock_level: 5,
        image: ''
    });

    // Variants State
    const [variants, setVariants] = useState<Product[]>([]);
    const [variantAttributes, setVariantAttributes] = useState({ Size: '', Color: '' });
    const [newVariantBarcode, setNewVariantBarcode] = useState('');
    const [loadingVariants, setLoadingVariants] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                barcode: initialData.barcode || '',
                cost_price: initialData.cost_price || 0,
                sell_price: initialData.sell_price || 0,
                stock: initialData.stock || 0,
                gst_rate: initialData.gst_rate || 0,
                hsn_code: initialData.hsn_code || '',
                min_stock_level: initialData.min_stock_level || 5,
                image: initialData.image || ''
            });

            if (initialData.variant_group_id) {
                loadVariants(initialData.variant_group_id);
            }
        }
    }, [initialData]);

    const loadVariants = async (groupId: string) => {
        setLoadingVariants(true);
        try {
            const data = await productService.getVariants(groupId);
            // exclude current item if it has ID (edit mode)
            const others = initialData?.id ? data.filter(p => p.id !== initialData.id) : data;
            setVariants(others);
        } catch (e) { console.error(e); }
        finally { setLoadingVariants(false); }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleChange = (field: keyof Omit<Product, 'id'>, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, image: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCreateVariant = async () => {
        if (!initialData?.id) return;
        if (!newVariantBarcode) {
            alert('Barcode is required for new variant');
            return;
        }
        try {
            // Clean empty attrs
            const attrs: Record<string, string> = {};
            if (variantAttributes.Size) attrs.Size = variantAttributes.Size;
            if (variantAttributes.Color) attrs.Color = variantAttributes.Color;

            if (Object.keys(attrs).length === 0) {
                alert('Please specify at least one attribute (Size/Color)');
                return;
            }

            await productService.createVariant(initialData.id, attrs, newVariantBarcode);
            if (initialData.variant_group_id) loadVariants(initialData.variant_group_id);
            else {
                // We just created a group, but we don't know it here easily without refetch.
                // Ideally close modal or refetch product.
                alert('Variant created. please reopen product to see updated group.');
            }
            // Reset
            setVariantAttributes({ Size: '', Color: '' });
            setNewVariantBarcode('');
        } catch (error: any) {
            alert('Failed: ' + error.message);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* TABS */}
            <div className="flex border-b border-gray-200 mb-4 gap-4 px-1">
                <button
                    onClick={() => setActiveTab('GENERAL')}
                    className={clsx(
                        "py-2 px-4 border-b-2 text-sm font-bold transition-all",
                        activeTab === 'GENERAL' ? "border-mac-accent-blue text-mac-accent-blue" : "border-transparent text-gray-400 hover:text-gray-600"
                    )}
                >
                    General Info
                </button>
                <button
                    onClick={() => setActiveTab('VARIANTS')}
                    disabled={!initialData?.id}
                    className={clsx(
                        "py-2 px-4 border-b-2 text-sm font-bold transition-all",
                        activeTab === 'VARIANTS'
                            ? "border-mac-accent-blue text-mac-accent-blue"
                            : !initialData?.id ? "border-transparent text-gray-300 cursor-not-allowed" : "border-transparent text-gray-400 hover:text-gray-600"
                    )}
                >
                    Variants {variants.length > 0 && `(${variants.length})`}
                </button>
            </div>

            {/* TAB CONTENT: GENERAL */}
            {activeTab === 'GENERAL' && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex gap-4">
                        {/* Image Upload Section */}
                        <div className="w-1/3 space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Product Image</label>
                            <div className="relative aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50 overflow-hidden hover:bg-gray-100 transition-colors group">
                                {formData.image ? (
                                    <>
                                        <img src={formData.image} alt="Product" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </>
                                ) : (
                                    <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                        <span className="text-xs text-gray-500 font-medium">Click to upload</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Form Fields Section */}
                        <div className="flex-1 grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Product Name</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm border p-2"
                                    value={formData.name}
                                    onChange={e => handleChange('name', e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-gray-700">Barcode</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        required
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm border p-2"
                                        value={formData.barcode}
                                        onChange={e => handleChange('barcode', e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const random = Math.floor(100000000000 + Math.random() * 900000000000);
                                            handleChange('barcode', random.toString());
                                        }}
                                        className="mt-1 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md border border-slate-200 text-xs font-bold transition-all"
                                        title="Generate Unique Barcode"
                                    >
                                        GEN
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">HSN Code</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm border p-2"
                                    value={formData.hsn_code || ''}
                                    onChange={e => handleChange('hsn_code', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Cost Price</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm border p-2"
                                    value={formData.cost_price}
                                    onChange={e => handleChange('cost_price', parseFloat(e.target.value) || 0)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Selling Price</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm border p-2"
                                    value={formData.sell_price}
                                    onChange={e => handleChange('sell_price', parseFloat(e.target.value) || 0)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Stock</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm border p-2"
                                    value={formData.stock}
                                    onChange={e => handleChange('stock', parseInt(e.target.value) || 0)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">GST Rate (%)</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm border p-2"
                                    value={formData.gst_rate}
                                    onChange={e => handleChange('gst_rate', parseFloat(e.target.value))}
                                >
                                    {[0, 5, 12, 18, 28].map(rate => (
                                        <option key={rate} value={rate}>{rate}%</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Min Stock Level</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm border p-2"
                                    value={formData.min_stock_level}
                                    onChange={e => handleChange('min_stock_level', parseInt(e.target.value) || 5)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                        <Button type="submit">Save Product</Button>
                    </div>
                </form>
            )}

            {/* TAB CONTENT: VARIANTS */}
            {activeTab === 'VARIANTS' && (
                <div className="space-y-6">
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <h4 className="text-sm font-bold text-blue-800 mb-2">Create New Variant</h4>
                        <div className="grid grid-cols-4 gap-3 items-end">
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-gray-500">Size</label>
                                <input className="mac-input w-full bg-white" placeholder="S, M, L..." value={variantAttributes.Size} onChange={e => setVariantAttributes({ ...variantAttributes, Size: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-gray-500">Color</label>
                                <input className="mac-input w-full bg-white" placeholder="Red, Blue..." value={variantAttributes.Color} onChange={e => setVariantAttributes({ ...variantAttributes, Color: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-gray-500">New Barcode</label>
                                <div className="flex gap-2">
                                    <input className="mac-input w-full bg-white" placeholder="Scan or Type" value={newVariantBarcode} onChange={e => setNewVariantBarcode(e.target.value)} />
                                    <button onClick={() => setNewVariantBarcode(Math.floor(100000000000 + Math.random() * 900000000000).toString())} className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300" title="Generate">
                                        <RefreshCw className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <Button onClick={handleCreateVariant} icon={Copy} className="h-10">Add Variant</Button>
                        </div>
                    </div>

                    {/* Variant List */}
                    <div className="border rounded-xl overflow-hidden">
                        <div className="bg-gray-100 p-3 text-xs font-bold uppercase text-gray-500">Existing Variants in Group</div>
                        {loadingVariants ? (
                            <div className="p-8 text-center text-gray-400">Loading variants...</div>
                        ) : (
                            <Table
                                data={variants}
                                columns={[
                                    { header: 'Variant Name', accessor: 'name' },
                                    { header: 'Barcode', accessor: 'barcode' },
                                    { header: 'Stock', accessor: 'stock' },
                                    { header: 'Price', accessor: (p) => `₹${p.sell_price}` }
                                ]}
                                emptyMessage="No other variants found."
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
