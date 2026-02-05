import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    BarChart3,
    Settings,
    Calculator,
    Cpu,
    History,
    Users,
    Tag,
    Truck,
    ShoppingBag,
    Banknote,
    ClipboardCheck,
    FileText,
    Bell,
    Bot,
    UserCircle,
    ScanBarcode,
    Building,
    LogOut,
    ChevronLeft,
    Megaphone,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { databaseService } from '../services/databaseService';
import { platformService } from '../services/platformService';
import { useKeyboard } from '../hooks/useKeyboard';

interface SidebarProps {
    user: any;
    onLogout: () => void;
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ user, onLogout, isOpen = false, onClose }: SidebarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [isConnected, setIsConnected] = useState(false);

    // Handle initial remote status
    useEffect(() => {
        if (platformService.isElectron()) {
            setIsConnected(true);
            return;
        }

        const unsubscribe = databaseService.onRemoteStatusChange((connected) => {
            setIsConnected(connected);
        });
        setIsConnected(databaseService.isRemoteConnected());
        return unsubscribe;
    }, []);

    const menuItems = [
        { icon: ShoppingCart, label: 'Billing', path: '/' },
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Package, label: 'Products', path: '/products' },
        { icon: BarChart3, label: 'Sales', path: '/sales' },
        { icon: Megaphone, label: 'Marketing', path: '/marketing' },
        { icon: Users, label: 'Customers', path: '/customers' },
        { icon: History, label: 'Reports', path: '/reports' },
        { icon: Tag, label: 'Taxation', path: '/taxation' },
        { icon: Settings, label: 'Settings', path: '/settings' },
        { icon: Cpu, label: 'Hardware', path: '/hardware' },
        { icon: Tag, label: 'Promotions', path: '/promotions' },
        { icon: Truck, label: 'Suppliers', path: '/suppliers' },
        { icon: ShoppingBag, label: 'Purchases', path: '/purchases' },
        { icon: Calculator, label: 'Accounting', path: '/accounting' },
        { icon: Banknote, label: 'Cash Mgmt', path: '/cash' },
        { icon: ClipboardCheck, label: 'Stocktake', path: '/stocktake' },
        { icon: FileText, label: 'Audit Logs', path: '/audit-logs' },
        { icon: Bell, label: 'Notifications', path: '/notifications' },
        { icon: UserCircle, label: 'Staff', path: '/staff' },
        { icon: ScanBarcode, label: 'Barcodes', path: '/barcodes' },
        { icon: Building, label: 'Company', path: '/my-company' },
        { icon: LogOut, label: 'End of Day', path: '/end-of-day' },
    ];

    // Keyboard shortcuts for sidebar tabs starting from the letter "q"
    const shortcutKeys = [
        'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p',
        'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'z',
        'x', 'c', 'v', 'b', 'n', 'm',
    ];

    const menuItemsWithShortcuts = menuItems.map((item, index) => ({
        ...item,
        shortcut: shortcutKeys[index],
    }));

    // Register global keyboard shortcuts for quick tab navigation
    const keyboardMap: Record<string, (e: KeyboardEvent) => void> = {};

    // Letter shortcuts (q, w, e, ...)
    menuItemsWithShortcuts.forEach((item) => {
        if (!item.shortcut) return;

        keyboardMap[item.shortcut] = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            const tag = target?.tagName.toLowerCase();
            const isEditable =
                tag === 'input' ||
                tag === 'textarea' ||
                (target != null && target.isContentEditable);

            if (isEditable) return;

            e.preventDefault();
            navigate(item.path);
            if (onClose) onClose();
        };
    });

    // Helper to move between tabs with arrow keys
    const navigateRelative = (direction: -1 | 1, e: KeyboardEvent) => {
        const target = (e.target as HTMLElement | null) ?? (document.activeElement as HTMLElement | null);
        const tag = target?.tagName.toLowerCase();
        const isEditable =
            tag === 'textarea' ||
            (target != null && target.isContentEditable);

        // Allow arrow navigation even when an <input> has focus,
        // but still avoid hijacking textareas / rich text editors.
        if (isEditable) return;

        const total = menuItemsWithShortcuts.length;
        if (total === 0) return;

        // Try exact match first, then prefix match for nested routes (e.g. /reports/sales)
        let currentIndex = menuItemsWithShortcuts.findIndex((item) => item.path === location.pathname);
        if (currentIndex === -1) {
            currentIndex = menuItemsWithShortcuts.findIndex((item) =>
                location.pathname.startsWith(item.path) && item.path !== '/'
            );
        }

        const baseIndex = currentIndex === -1 ? 0 : currentIndex;
        const nextIndex = (baseIndex + direction + total) % total;
        const nextItem = menuItemsWithShortcuts[nextIndex];

        e.preventDefault();
        navigate(nextItem.path);
        if (onClose) onClose();
    };

    // Left / Right (and Up/Down) arrows move between tabs
    keyboardMap['ArrowLeft'] = (e) => navigateRelative(-1, e);
    keyboardMap['ArrowUp'] = (e) => navigateRelative(-1, e);
    keyboardMap['ArrowRight'] = (e) => navigateRelative(1, e);
    keyboardMap['ArrowDown'] = (e) => navigateRelative(1, e);

    useKeyboard(keyboardMap);

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={onClose}
                />
            )}

            <div
                className={`
                    flex flex-col h-full bg-background text-foreground border-r border-border
                    transition-all duration-300 ease-in-out w-64
                    ${isOpen ? 'fixed inset-y-0 left-0 z-50 shadow-2xl translate-x-0' : 'hidden md:flex md:relative md:translate-x-0'}
                `}
            >
                {/* Logo Section */}
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-16 h-16 flex items-center justify-center -ml-2">
                            <img src="/pantherpos_logo.png" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg tracking-tight text-foreground">
                                PantherPOS
                            </h1>
                            <p className="text-[10px] text-primary font-bold tracking-widest uppercase">Management</p>
                        </div>
                    </div>

                    {/* Mobile Close Button */}
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground md:hidden"
                    >
                        <ChevronLeft size={20} />
                    </button>
                </div>

                {/* AI Primary Feature */}
                <div className="px-4 py-2">
                    <button
                        onClick={() => {
                            navigate('/ai-assist');
                            if (onClose) onClose();
                        }}
                        className={`
                            w-full group relative overflow-hidden rounded-2xl p-4 transition-all duration-300
                            ${location.pathname === '/ai-assist'
                                ? 'bg-primary text-primary-foreground shadow-[0_0_20px_rgba(34,211,238,0.4)]'
                                : 'bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20'
                            }
                        `}
                    >
                        <div className="flex items-center gap-4 relative z-10">
                            <div className={`p-2 rounded-xl ${location.pathname === '/ai-assist' ? 'bg-white/20' : 'bg-primary/10'}`}>
                                <Bot size={28} className="animate-pulse" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-black tracking-tight uppercase">AI Assist</p>
                                <p className={`text-[10px] font-bold opacity-70 ${location.pathname === '/ai-assist' ? 'text-primary-foreground/80' : 'text-primary'}`}>Intelligence Engine</p>
                            </div>
                        </div>
                        {/* Glow and Pulse effects */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto no-scrollbar">
                    {menuItemsWithShortcuts.map((item) => {
                        const isActive = location.pathname === item.path;

                        return (
                            <button
                                key={item.path}
                                onClick={() => {
                                    navigate(item.path);
                                    if (onClose) onClose();
                                }}
                                className={`
                                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                                    ${isActive
                                        ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }
                                `}
                            >
                                <item.icon size={18} className={`${isActive ? 'text-primary' : 'group-hover:text-primary transition-colors'}`} />
                                <span className="text-sm font-medium tracking-wide">
                                    {item.label}
                                </span>
                                {item.shortcut && (
                                    <span className="ml-auto text-[10px] font-mono uppercase text-muted-foreground/60">
                                        {item.shortcut}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Footer / Status */}
                <div className="p-4 mt-auto">
                    <div className="rounded-2xl bg-muted/50 border border-border p-4 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                                {user?.name?.[0] || 'A'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate text-foreground">{user?.name || 'Administrator'}</p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{user?.role || 'Admin'}</p>
                            </div>
                            <button onClick={onLogout} className="text-muted-foreground hover:text-destructive transition-colors">
                                <LogOut size={16} />
                            </button>
                        </div>

                        <div className="pt-3 border-t border-border flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-destructive'}`} />
                                <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
                                    {isConnected ? 'Live System' : 'Offline'}
                                </span>
                            </div>
                            <span className="text-[9px] text-muted-foreground/60 font-mono">v1.0.0</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
