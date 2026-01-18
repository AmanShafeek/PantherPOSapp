import { useState, useEffect } from 'react';
import type { ProductGroup } from '../services/groupService';
import { groupService } from '../services/groupService';
import { productService } from '../services/productService';
import type { Product } from '../types/db';
import { Button } from './Button';
import { Modal } from './Modal';
import { Plus, Trash2, Search, X, Folder, Package } from 'lucide-react';
import clsx from 'clsx';

interface GroupManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function GroupManager({ isOpen, onClose }: GroupManagerProps) {
    const [groups, setGroups] = useState<ProductGroup[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<ProductGroup | null>(null);
    const [groupProducts, setGroupProducts] = useState<Product[]>([]);


    // Create Group State
    const [isCreating, setIsCreating] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');

    // Add Product State
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadGroups();
        }
    }, [isOpen]);

    useEffect(() => {
        if (selectedGroup) {
            loadGroupProducts(selectedGroup.id);
        }
    }, [selectedGroup]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (search && isAddingProduct) {
                setSearchLoading(true);
                const results = await productService.search(search);
                setSearchResults(results);
                setSearchLoading(false);
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search, isAddingProduct]);

    const loadGroups = async () => {
        const data = await groupService.getAll();
        setGroups(data);
    };

    const loadGroupProducts = async (groupId: number) => {
        const prod = await groupService.getGroupProducts(groupId);
        setGroupProducts(prod);
    };

    const handleCreateGroup = async () => {
        if (!newGroupName) return;
        console.log('Creating group:', newGroupName);
        try {
            const res = await groupService.create(newGroupName, newGroupDesc);
            console.log('Group created, ID:', res);
            setNewGroupName('');
            setNewGroupDesc('');
            setIsCreating(false);
            loadGroups();
        } catch (error) {
            console.error('Failed to create group:', error);
            alert('Failed to create group. Please try restarting the app if this persists.');
        }
    };

    const handleDeleteGroup = async (id: number) => {
        if (!confirm('Delete this group? Items will not be deleted from inventory.')) return;
        await groupService.delete(id);
        if (selectedGroup?.id === id) {
            setSelectedGroup(null);
        }
        loadGroups();
    };

    const handleAddProduct = async (product: Product) => {
        if (!selectedGroup) return;
        await groupService.addProduct(selectedGroup.id, product.id);
        loadGroupProducts(selectedGroup.id);
        loadGroups(); // Update counts
        setSearch('');
    };

    const handleRemoveProduct = async (productId: number) => {
        if (!selectedGroup) return;
        if (!confirm('Remove this product from the group?')) return;
        await groupService.removeProduct(selectedGroup.id, productId);
        loadGroupProducts(selectedGroup.id);
        loadGroups(); // Update counts
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Product Groups" size="lg">
            <div className="flex h-[600px] gap-4">
                {/* Left Panel: Group List */}
                <div className="w-1/3 flex flex-col border-r border-white/10 pr-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-mac-text-secondary uppercase tracking-wider text-xs">Groups</h3>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="p-1 hover:bg-white/10 rounded-lg transition-colors text-mac-accent-emerald"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>

                    {isCreating && (
                        <div className="bg-white/5 rounded-xl p-3 mb-3 space-y-2 animate-in fade-in slide-in-from-top-2">
                            <input
                                autoFocus
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-mac-text-primary"
                                placeholder="Group Name"
                                value={newGroupName}
                                onChange={e => setNewGroupName(e.target.value)}
                            />
                            <input
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-mac-text-primary"
                                placeholder="Description (Optional)"
                                value={newGroupDesc}
                                onChange={e => setNewGroupDesc(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <Button size="sm" className="flex-1" onClick={handleCreateGroup}>Save</Button>
                                <Button size="sm" variant="secondary" onClick={() => setIsCreating(false)}>Cancel</Button>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto space-y-2">
                        {groups.map(group => (
                            <button
                                key={group.id}
                                onClick={() => setSelectedGroup(group)}
                                className={clsx(
                                    "w-full text-left p-3 rounded-xl transition-all flex items-start justify-between group",
                                    selectedGroup?.id === group.id
                                        ? "bg-mac-accent-emerald/10 border border-mac-accent-emerald/20 shadow-lg"
                                        : "hover:bg-white/5 border border-transparent"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <Folder className={clsx("w-5 h-5", selectedGroup?.id === group.id ? "text-mac-accent-emerald" : "text-mac-text-secondary opacity-50")} />
                                    <div>
                                        <div className={clsx("font-bold text-sm", selectedGroup?.id === group.id ? "text-mac-accent-emerald" : "text-mac-text-primary")}>{group.name}</div>
                                        <div className="text-[10px] text-mac-text-secondary opacity-60 font-mono">{group.item_count || 0} items</div>
                                    </div>
                                </div>
                                <div
                                    onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all text-mac-text-secondary"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Panel: Group Details */}
                <div className="flex-1 flex flex-col">
                    {selectedGroup ? (
                        <>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-xl font-black text-mac-text-primary">{selectedGroup.name}</h2>
                                    <p className="text-xs text-mac-text-secondary opacity-60 mt-1">{selectedGroup.description || "No description"}</p>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => { setIsAddingProduct(!isAddingProduct); setSearch(''); }}
                                    className={clsx(isAddingProduct ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" : "")}
                                >
                                    {isAddingProduct ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                    {isAddingProduct ? 'Cancel' : 'Add Items'}
                                </Button>
                            </div>

                            {isAddingProduct ? (
                                <div className="flex-1 flex flex-col min-h-0 bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
                                    <div className="p-4 border-b border-white/5">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mac-text-secondary opacity-50" />
                                            <input
                                                autoFocus
                                                value={search}
                                                onChange={e => setSearch(e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-mac-text-primary focus:border-mac-accent-emerald/50 outline-none"
                                                placeholder="Search products to add..."
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                        {searchResults.map(p => {
                                            const isAlreadyIn = groupProducts.some(gp => gp.id === p.id);
                                            return (
                                                <button
                                                    key={p.id}
                                                    disabled={isAlreadyIn}
                                                    onClick={() => handleAddProduct(p)}
                                                    className="w-full flex items-center justify-between p-3 hover:bg-white/5 disabled:opacity-50 disabled:hover:bg-transparent rounded-lg transition-colors group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                                            <Package className="w-4 h-4 text-mac-text-secondary" />
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="font-bold text-sm text-mac-text-primary">{p.name}</div>
                                                            <div className="text-[10px] font-mono text-mac-text-secondary opacity-60">{p.barcode}</div>
                                                        </div>
                                                    </div>
                                                    {!isAlreadyIn && (
                                                        <span className="text-xs font-bold text-mac-accent-emerald opacity-0 group-hover:opacity-100 transition-opacity">
                                                            Add
                                                        </span>
                                                    )}
                                                    {isAlreadyIn && <span className="text-[10px] font-bold text-mac-text-secondary opacity-40">Added</span>}
                                                </button>
                                            );
                                        })}
                                        {search && searchResults.length === 0 && !searchLoading && (
                                            <div className="text-center p-8 opacity-40 text-xs">No products found</div>
                                        )}
                                        {!search && (
                                            <div className="text-center p-8 opacity-40 text-xs">Type to search...</div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pr-2">
                                    {groupProducts.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center opacity-30">
                                            <Folder className="w-12 h-12 mb-2" />
                                            <p className="text-sm font-bold">This group is empty</p>
                                        </div>
                                    ) : (
                                        groupProducts.map(p => (
                                            <div key={p.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl group border border-transparent hover:border-white/5 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-black/20 flex items-center justify-center text-xs font-bold text-mac-text-secondary">
                                                        {p.stock}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-mac-text-primary text-sm">{p.name}</div>
                                                        <div className="text-[10px] font-mono opacity-50">{p.barcode} • ₹{p.sell_price}</div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveProduct(p.id)}
                                                    className="p-2 text-mac-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-20">
                            <Folder className="w-16 h-16 mb-4" />
                            <p className="font-bold uppercase tracking-widest">Select a Group</p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
