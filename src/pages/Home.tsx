import { useState, useEffect, useRef } from 'react';
import { productService } from '../services/productService';
import { billService } from '../services/billService';
import { cartService } from '../services/cartService';
import { Button } from '../components/Button';
import { printerService } from '../services/printerService';
import { eventBus } from '../utils/EventBus';
import type { Product, Customer } from '../types/db';
import {
    Search, Plus, Trash2, CreditCard, Banknote, Smartphone,
    Printer as PrinterIcon, Minus
} from 'lucide-react';
import { Modal } from '../components/Modal';
import toast from 'react-hot-toast';
import { cn } from '../utils/classNames';

interface CartItem extends Product {
    quantity: number;
    amount: number;
}

export default function Home() {
    // --- STATE ---
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [processing, setProcessing] = useState(false);
    const [taxMode, setTaxMode] = useState<'GST' | 'SPLIT'>('GST');

    // Payment State
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentMode, setPaymentMode] = useState<'CASH' | 'CARD' | 'UPI' | 'SPLIT'>('CASH');

    const searchInputRef = useRef<HTMLInputElement>(null);

    // --- EFFECTS ---
    useEffect(() => {
        loadProducts();
        setCart(cartService.getCart());

        const removeUpdate = eventBus.on('CART_UPDATED', (items) => setCart(items));
        const removeToast = eventBus.on('SHOW_TOAST', (data) => {
            if (data.type === 'error') toast.error(data.message);
            else if (data.type === 'success') toast.success(data.message);
        });

        // Keyboard Shortcuts
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F1') { e.preventDefault(); setPaymentMode('CASH'); setPaymentModalOpen(true); }
            if (e.key === 'F2') { e.preventDefault(); setPaymentMode('CARD'); setPaymentModalOpen(true); }
            if (e.key === 'F3') { e.preventDefault(); setPaymentMode('UPI'); setPaymentModalOpen(true); }
            if (e.key === 'F10' || (e.ctrlKey && e.key === 'f')) { e.preventDefault(); searchInputRef.current?.focus(); }
            if (e.key === 'F12' && cartService.getCart().length > 0) { e.preventDefault(); setPaymentModalOpen(true); }
            if (e.key === 'Escape') { setPaymentModalOpen(false); }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            removeUpdate();
            removeToast();
        };
    }, []);

    useEffect(() => {
        const delaySearch = setTimeout(() => {
            if (searchTerm) {
                productService.search(searchTerm).then(setProducts);
            } else {
                productService.getAll().then(res => setProducts(res.slice(0, 50)));
            }
        }, 300);
        return () => clearTimeout(delaySearch);
    }, [searchTerm]);

    const loadProducts = async () => {
        try {
            const res = await productService.getAll();
            setProducts(res.slice(0, 50));
        } catch (e) {
            console.error(e);
        }
    };

    const addToCart = (product: Product) => {
        cartService.addItem(product, 1);
        toast.success(`Added ${product.name}`, { icon: '🛒', position: 'bottom-center' }); // Changed position
        setSearchTerm('');
        searchInputRef.current?.focus();
    };

    const updateQuantity = (id: number, delta: number) => cartService.updateQuantity(id, delta);

    // Calculations
    const subtotal = cart.reduce((sum, item) => sum + item.amount, 0);
    const grandTotal = subtotal; // Assuming tax inclusive for now as per mockup toggle

    // Checkout Logic (Existing)
    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setProcessing(true);
        try {
            const billNo = await billService.saveBill({
                items: cart, subtotal, totalTax: 0, grandTotal, paymentMode, tenders: [{ mode: paymentMode, amount: grandTotal }],
                taxInclusive: true, isInterState: false, customer_id: customer?.id,
                discount_amount: 0, points_redeemed: 0, points_earned: 0
            });

            try {
                const saleService = await import('../services/saleService').then(m => m.saleService);
                const details = await saleService.getBillDetailsByNo(billNo);
                await printerService.printReceipt(details);
            } catch (e) { console.error(e); }

            toast.success(`Bill Saved: ${billNo}`);
            cartService.clear();
            setCustomer(null);
            setPaymentModalOpen(false);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setProcessing(false);
        }
    };

    const footerActions = [
        { label: 'Cash', key: 'F1', icon: Banknote, action: () => { setPaymentMode('CASH'); setPaymentModalOpen(true); } },
        { label: 'Card', key: 'F2', icon: CreditCard, action: () => { setPaymentMode('CARD'); setPaymentModalOpen(true); } },
        { label: 'UPI', key: 'F3', icon: Smartphone, action: () => { setPaymentMode('UPI'); setPaymentModalOpen(true); } },
        { label: 'Complete', key: 'F12', icon: null, action: () => { if (cart.length > 0) setPaymentModalOpen(true); } }, // Special handling
        { label: 'Select', key: '⇅ Select', icon: null, action: () => { } }, // Just visual hint
        { label: 'Qty', key: '+/- Qty', icon: null, action: () => { } }, // Just visual hint
        { label: 'Remove', key: 'Del', icon: null, action: () => { } }, // Just visual hint
        { label: 'Cancel', key: 'Esc', icon: null, action: () => setPaymentModalOpen(false) },
        { label: 'Drawer', key: 'Ctrl+D', icon: null, action: () => printerService.openDrawer() },
    ];

    return (
        <div className="flex h-full bg-background text-white font-sans overflow-hidden">
            {/* === MAIN CONTENT (LEFT/CENTER) === */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-white/5">
                {/* Search Bar */}
                <div className="p-6 pb-2">
                    <div className="relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground w-6 h-6" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && products.length > 0) addToCart(products[0]); }}
                            placeholder="Scan barcode or search... (Enter to add)"
                            className="w-full bg-surface text-white text-lg placeholder:text-muted-foreground/50 rounded-2xl pl-14 pr-6 py-4 border border-transparent focus:border-primary/50 focus:ring-1 focus:ring-primary/50 focus:outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Product Grid / Empty State */}
                <div className="flex-1 p-6 overflow-y-auto no-scrollbar relative">
                    {/* Empty State / Center Logo */}
                    {cart.length === 0 && !searchTerm ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/20 pointer-events-none">
                            <Search className="w-24 h-24 mb-6 opacity-20" strokeWidth={1.5} />
                            <h2 className="text-xl font-medium text-muted-foreground/40">Scan barcode or search for products</h2>
                            <p className="mt-2 text-sm text-muted-foreground/30">Press Enter to add item</p>
                        </div>
                    ) : (
                        // If searching, show results
                        searchTerm ? (
                            <div className="grid grid-cols-4 gap-4">
                                {products.map(p => (
                                    <div
                                        key={p.id}
                                        onClick={() => addToCart(p)}
                                        className="bg-surface hover:bg-surface/80 p-4 rounded-xl cursor-pointer transition-colors border border-white/5 hover:border-primary/30 group"
                                    >
                                        <div className="text-white font-medium truncate mb-1">{p.name}</div>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded">{p.barcode}</span>
                                            <span className="text-primary font-bold">₹{p.sell_price}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : null
                    )}
                </div>

                {/* Footer Action Bar */}
                <div className=" mt-auto border-t border-white/5 p-4 mx-6 mb-4">
                    <div className="flex flex-wrap gap-2 items-center">
                        {/* Custom styled keys based on footerActions */}
                        {footerActions.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 mr-2">
                                <kbd className="hidden sm:inline-block px-2 py-1 bg-surface border border-white/10 rounded text-[10px] font-bold text-muted-foreground min-w-[2rem] text-center font-mono">
                                    {item.key}
                                </kbd>
                                <span className="text-xs text-muted-foreground font-medium">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* === RIGHT PANEL (CART) === */}
            <div className="w-[400px] bg-background/50 backdrop-blur-md flex flex-col flex-shrink-0 z-20 shadow-2xl border-l border-white/5">
                {/* Header */}
                <div className="px-6 py-6 pb-2 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white">Current Bill</h2>
                        <p className="text-sm text-muted-foreground">{cart.length} items</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="text-muted-foreground hover:text-white transition-colors"><PrinterIcon size={18} /></button>
                        <button className="text-muted-foreground hover:text-white transition-colors"><Banknote size={18} /></button>
                    </div>
                </div>

                {/* Cart Items List */}
                <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 no-scrollbar">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground/20">
                            <p>No items in cart</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 group border border-transparent hover:border-white/5 transition-all">
                                {/* Quantity Controls */}
                                <div className="flex flex-col items-center gap-1 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => updateQuantity(item.id, 1)} className="text-muted-foreground hover:text-primary transition-colors p-0.5"><Plus size={10} /></button>
                                    <span className="text-xs font-bold text-white w-5 text-center">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, -1)} className="text-muted-foreground hover:text-destructive transition-colors p-0.5"><Minus size={10} /></button>
                                </div>

                                {/* Item Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-white truncate">{item.name}</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                                        <span>₹{item.sell_price}</span>
                                        {item.gst_rate > 0 && <span className="text-[10px] bg-white/10 px-1 rounded text-white/50">{item.gst_rate}% GST</span>}
                                    </div>
                                </div>

                                {/* Amount */}
                                <div className="text-right">
                                    <div className="font-bold text-white text-sm">₹{item.amount.toFixed(2)}</div>
                                </div>

                                {/* Delete (Hover only) */}
                                <button onClick={() => cartService.removeItem(item.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all px-1">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Bottom Section */}
                <div className="mt-auto px-6 py-6 bg-background/50 border-t border-white/5 space-y-4">
                    {/* Tax Toggles */}
                    <div className="flex items-center justify-between">
                        <div className="flex gap-4">
                            <div
                                className={cn("flex items-center gap-2 cursor-pointer transition-all", taxMode === 'GST' ? 'opacity-100' : 'opacity-40 grayscale')}
                                onClick={() => setTaxMode('GST')}
                            >
                                <div className={cn("w-8 h-4 rounded-full relative transition-colors", taxMode === 'GST' ? "bg-primary/20" : "bg-white/10")}>
                                    <div className={cn("absolute top-0.5 w-3 h-3 rounded-full shadow-sm transition-all", taxMode === 'GST' ? "bg-primary right-0.5" : "bg-white/40 left-0.5")} />
                                </div>
                                <span className="text-xs font-bold text-white">GST</span>
                            </div>

                            <div
                                className={cn("flex items-center gap-2 cursor-pointer transition-all", taxMode === 'SPLIT' ? 'opacity-100' : 'opacity-40 grayscale')}
                                onClick={() => setTaxMode('SPLIT')}
                            >
                                <div className={cn("w-8 h-4 rounded-full relative transition-colors", taxMode === 'SPLIT' ? "bg-primary/20" : "bg-white/10")}>
                                    <div className={cn("absolute top-0.5 w-3 h-3 rounded-full shadow-sm transition-all", taxMode === 'SPLIT' ? "bg-primary right-0.5" : "bg-white/40 left-0.5")} />
                                </div>
                                <span className="text-xs font-bold text-white">CGST+SGST</span>
                            </div>
                        </div>
                        <span className="text-xs text-muted-foreground">Incl.</span>
                    </div>

                    {/* Summary */}
                    <div className="space-y-1 pt-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Taxable Value</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-end border-t border-white/5 pt-3 mt-2">
                            <span className="text-xl font-bold text-white">Total</span>
                            <span className="text-3xl font-black text-primary">₹{grandTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Checkout Button */}
                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || processing}
                        className="w-full bg-primary hover:bg-primary-hover text-white h-14 rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        {processing ? 'Processing...' : 'Checkout (F12)'}
                    </button>

                </div>
            </div>

            {/* Existing Payment Modal */}
            <Modal isOpen={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} title={`Collect Payment: ₹${grandTotal}`}>
                <div className="space-y-6 p-2">
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { id: 'CASH', label: 'Cash', icon: Banknote },
                            { id: 'CARD', label: 'Card', icon: CreditCard },
                            { id: 'UPI', label: 'UPI', icon: Smartphone }
                        ].map(m => (
                            <button
                                key={m.id}
                                onClick={() => setPaymentMode(m.id as any)}
                                className={cn(
                                    "flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all",
                                    paymentMode === m.id
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-white/5 bg-white/5 hover:bg-white/10 text-muted-foreground'
                                )}
                            >
                                <m.icon size={24} />
                                <span className="font-bold">{m.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex items-start gap-4">
                        <PrinterIcon className="text-yellow-500 shrink-0 mt-1" size={20} />
                        <div>
                            <h4 className="font-bold text-yellow-500 text-sm">Printing Receipt</h4>
                            <p className="text-xs text-yellow-500/80 mt-1">Receipt will be printed automatically after payment confirmation.</p>
                        </div>
                    </div>

                    <Button
                        onClick={handleCheckout}
                        disabled={processing}
                        className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary-hover shadow-lg"
                    >
                        {processing ? 'Processing Transaction...' : `Confirm Payment (₹${grandTotal})`}
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
