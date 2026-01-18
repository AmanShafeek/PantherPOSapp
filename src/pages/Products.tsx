import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productService } from '../services/productService';
import type { Product } from '../types/db';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { ProductForm } from '../components/ProductForm';
import { Plus, Pencil, Trash2, Barcode, ExternalLink, TrendingDown, Folder, Package, Search } from 'lucide-react';
import { useKeyboard } from '../hooks/useKeyboard';
import { BarcodeLabel } from '../components/BarcodeLabel';
import { auditService } from '../services/auditService';
import { notificationService } from '../services/notificationService';
import { inventoryService } from '../services/inventoryService';
import { GroupManager } from '../components/GroupManager';
import { groupService, type ProductGroup } from '../services/groupService';
import { InventoryStats } from '../components/InventoryStats';
import { InventoryDashboard } from '../components/InventoryDashboard';
import { FilterBar } from '../components/FilterBar';
import type { FilterType, SortType } from '../components/FilterBar';

export default function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
    const [viewingBarcode, setViewingBarcode] = useState<Product | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [groups, setGroups] = useState<ProductGroup[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<number | 'all'>('all');
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [sortType, setSortType] = useState<SortType>('name_asc');
    const [isShrinkageModalOpen, setIsShrinkageModalOpen] = useState(false);
    const [shrinkageProduct, setShrinkageProduct] = useState<Product | undefined>(undefined);
    const [shrinkageQty, setShrinkageQty] = useState('');
    const [shrinkageReason, setShrinkageReason] = useState('Damaged');
    const [isGroupManagerOpen, setIsGroupManagerOpen] = useState(false);
    const [searchParams] = useSearchParams();
    const isStandalone = searchParams.get('standalone') === 'true';

    const loadProducts = useCallback(async () => {
        setLoading(true);
        try {
            let data: Product[] = [];
            if (selectedGroupId === 'all') { data = await productService.getAll(); } else { data = await groupService.getGroupProducts(selectedGroupId); }
            setProducts(data);
        } catch (error) { console.error('Failed to load products:', error); } finally { setLoading(false); }
    }, [selectedGroupId]);

    const loadGroups = useCallback(async () => { try { const data = await groupService.getAll(); setGroups(data); } catch (error) { console.error('Failed to load groups:', error); } }, []);

    useEffect(() => { loadProducts(); loadGroups(); const interval = setInterval(() => { loadProducts(); }, 5000); return () => clearInterval(interval); }, [loadProducts, loadGroups]);

    const processedProducts = useMemo(() => {
        let result = [...products];
        if (search) { const q = search.toLowerCase(); result = result.filter(p => p.name.toLowerCase().includes(q) || p.barcode.includes(q) || (p.hsn_code && p.hsn_code.includes(q))); }
        if (filterType === 'low_stock') { result = result.filter(p => p.stock <= (p.min_stock_level || 5) && p.stock > 0); } else if (filterType === 'out_of_stock') { result = result.filter(p => p.stock <= 0); }
        result.sort((a, b) => {
            if (sortType === 'name_asc') return a.name.localeCompare(b.name);
            if (sortType === 'price_desc') return b.sell_price - a.sell_price;
            if (sortType === 'stock_asc') return a.stock - b.stock;
            if (sortType === 'stock_desc') return b.stock - a.stock;
            return 0;
        });
        return result;
    }, [products, search, filterType, sortType]);

    useKeyboard({ 'f': (e) => { if (e.ctrlKey) { e.preventDefault(); (document.querySelector('input[placeholder="Search products..."]') as HTMLInputElement)?.focus(); } } });

    const handleSave = async (data: Omit<Product, 'id'>) => {
        try { if (editingProduct) { await productService.update({ ...data, id: editingProduct.id }); } else { await productService.create(data); } setIsModalOpen(false); setEditingProduct(undefined); loadProducts(); } catch (error) { alert('Failed to save product.'); console.error(error); }
    };
    const handleDelete = async (id: number) => { if (!confirm('Are you sure you want to delete this product?')) return; try { await productService.delete(id); await auditService.log('PRODUCT_DELETE', { id }); loadProducts(); } catch (error) { console.error(error); } };
    const openEdit = (product: Product) => { setEditingProduct(product); setIsModalOpen(true); };
    const openAdd = () => { setEditingProduct(undefined); setIsModalOpen(true); };
    const handleReportShrinkage = async () => {
        if (!shrinkageProduct || !shrinkageQty) return;
        try { await inventoryService.reportShrinkage(shrinkageProduct.id, parseFloat(shrinkageQty), shrinkageReason); setIsShrinkageModalOpen(false); setShrinkageQty(''); loadProducts(); await auditService.log('SHRINKAGE_REPORT', { product: shrinkageProduct.name, qty: parseFloat(shrinkageQty), reason: shrinkageReason }); notificationService.checkStockLevels(); alert('Shrinkage reported successfully.'); } catch (error) { console.error(error); alert('Failed to report shrinkage.'); }
    };
    const openShrinkage = (product: Product) => { setShrinkageProduct(product); setIsShrinkageModalOpen(true); };

    return (
        <div className="h-full flex flex-col bg-background text-white p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Products</h1>
                    <p className="text-muted-foreground">Manage your inventory and pricing</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => setIsShrinkageModalOpen(true)} variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10">
                        <TrendingDown size={18} className="mr-2" />
                        Report Shrinkage
                    </Button>
                    <Button onClick={() => setIsGroupManagerOpen(true)} variant="outline">
                        <Folder size={18} className="mr-2" />
                        Manage Groups
                    </Button>
                    <Button onClick={openAdd} className="bg-primary hover:bg-primary-hover text-white shadow-glow">
                        <Plus size={20} className="mr-2" />
                        Add Product
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="mb-6">
                <InventoryStats products={products} />
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-start md:items-center bg-surface p-4 rounded-xl border border-white/5">
                <div className="w-full md:w-96 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-black/20 text-white pl-10 pr-4 py-2.5 rounded-lg border border-white/10 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                    <button
                        onClick={() => setSelectedGroupId('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap border ${selectedGroupId === 'all' ? 'bg-primary text-white border-primary shadow-glow' : 'bg-surface hover:bg-white/5 text-muted-foreground border-white/10'}`}
                    >
                        All Products
                    </button>
                    {groups.map(g => (
                        <button
                            key={g.id}
                            onClick={() => setSelectedGroupId(g.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap border ${selectedGroupId === g.id ? 'bg-primary text-white border-primary shadow-glow' : 'bg-surface hover:bg-white/5 text-muted-foreground border-white/10'}`}
                        >
                            {g.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area - Split View (Table + Dashboard) */}
            <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
                {/* Product Table */}
                <div className="flex-1 bg-surface rounded-xl border border-white/5 flex flex-col overflow-hidden shadow-xl">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Package size={16} />
                            <span>{processedProducts.length} Products Found</span>
                        </div>
                        <div className="flex gap-2">
                            {/* Small filters could go here */}
                            <select
                                value={sortType}
                                onChange={(e) => setSortType(e.target.value as SortType)}
                                className="bg-black/20 border border-white/10 rounded-lg text-sm px-3 py-1.5 text-white focus:outline-none"
                            >
                                <option value="name_asc">Name (A-Z)</option>
                                <option value="price_desc">Price (High-Low)</option>
                                <option value="stock_asc">Stock (Low-High)</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto no-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-black/20 sticky top-0 z-10 backdrop-blur-md">
                                <tr>
                                    <th className="p-4 font-medium text-muted-foreground border-b border-white/10 w-[40%]">Product Details</th>
                                    <th className="p-4 font-medium text-muted-foreground border-b border-white/10">Price (₹)</th>
                                    <th className="p-4 font-medium text-muted-foreground border-b border-white/10">Stock</th>
                                    <th className="p-4 font-medium text-muted-foreground border-b border-white/10 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {processedProducts.map(p => (
                                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-lg font-bold text-muted-foreground group-hover:text-primary transition-colors">
                                                        {p.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white group-hover:text-primary transition-colors">{p.name}</div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs bg-white/5 text-muted-foreground px-1.5 py-0.5 rounded border border-white/5 font-mono">
                                                            {p.barcode}
                                                        </span>
                                                        {p.group_id && (
                                                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/10">
                                                                {groups.find(g => g.id === p.group_id)?.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-emerald-400">₹{p.sell_price.toFixed(2)}</div>
                                            <div className="text-xs text-muted-foreground">Cost: ₹{p.purchase_price}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className={`font-bold ${p.stock <= (p.min_stock_level || 5) ? 'text-destructive' : 'text-white'}`}>
                                                {p.stock}
                                            </div>
                                            {p.stock <= (p.min_stock_level || 5) && (
                                                <span className="text-[10px] text-destructive animate-pulse font-medium">Low Stock</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setViewingBarcode(p)}
                                                    className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white transition-colors"
                                                    title="Print Barcode"
                                                >
                                                    <Barcode size={16} />
                                                </button>
                                                <button
                                                    onClick={() => openEdit(p)}
                                                    className="p-2 hover:bg-blue-500/10 rounded-lg text-muted-foreground hover:text-blue-400 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(p.id)}
                                                    className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {processedProducts.length === 0 && (
                            <div className="flex flex-col items-center justify-center p-20 text-muted-foreground/30">
                                <Package size={48} className="mb-4 opacity-50" />
                                <p>No products found matched your criteria</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? 'Edit Product' : 'Add New Product'}>
                <ProductForm initialData={editingProduct} onSubmit={handleSave} onCancel={() => setIsModalOpen(false)} groups={groups} />
            </Modal>

            <Modal isOpen={!!viewingBarcode} onClose={() => setViewingBarcode(undefined)} title="Product Barcode">
                {viewingBarcode && <BarcodeLabel product={viewingBarcode} onClose={() => setViewingBarcode(undefined)} />}
            </Modal>

            <Modal isOpen={isGroupManagerOpen} onClose={() => setIsGroupManagerOpen(false)} title="Manage Product Groups">
                <GroupManager onClose={() => setIsGroupManagerOpen(false)} />
            </Modal>

            <Modal isOpen={isShrinkageModalOpen} onClose={() => setIsShrinkageModalOpen(false)} title="Report Shrinkage">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-muted-foreground mb-1">Select Product</label>
                        <select
                            className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                            onChange={e => {
                                const p = products.find(prod => prod.id === parseInt(e.target.value));
                                setShrinkageProduct(p);
                            }}
                            value={shrinkageProduct?.id || ''}
                        >
                            <option value="">Select a product...</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-muted-foreground mb-1">Quantity Lost</label>
                        <input
                            type="number"
                            className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                            value={shrinkageQty}
                            onChange={e => setShrinkageQty(e.target.value)}
                            placeholder="e.g. 1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-muted-foreground mb-1">Reason</label>
                        <select
                            className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                            value={shrinkageReason}
                            onChange={e => setShrinkageReason(e.target.value)}
                        >
                            <option value="Damaged">Damaged</option>
                            <option value="Expired">Expired</option>
                            <option value="Theft">Theft</option>
                            <option value="Consumed">Internal Consumption</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="ghost" onClick={() => setIsShrinkageModalOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReportShrinkage}>Report Loss</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
