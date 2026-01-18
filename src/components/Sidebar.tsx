import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    BarChart3,
    Settings,
    Cpu,
    LogOut,
    Keyboard,
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
    FileSpreadsheet,
    ScanBarcode
} from 'lucide-react';
import { cn } from '../utils/classNames'; // Assuming you have a cn utility, if not I'll inline it or create it.
// If 'cn' is missing, I will handle it in the next step. For now, using standard template literals or a simple helper.

interface SidebarProps {
    user: any;
    onLogout: () => void;
}

export default function Sidebar({ user, onLogout }: SidebarProps) {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', shortcut: '' },
        { icon: ShoppingCart, label: 'Billing', path: '/', shortcut: 'F1' },
        { icon: Package, label: 'Products', path: '/products', shortcut: 'F2' },
        { icon: BarChart3, label: 'Sales', path: '/sales', shortcut: 'F3' },
        { icon: Users, label: 'Customers', path: '/customers', shortcut: '' },
        { icon: History, label: 'Reports', path: '/reports', shortcut: 'F4' },
        { icon: Settings, label: 'Settings', path: '/settings', shortcut: 'F5' },
        { icon: Cpu, label: 'Hardware', path: '/hardware', shortcut: 'F6' },
        // Extended Menu
        { icon: Tag, label: 'Promotions', path: '/promotions', shortcut: '' },
        { icon: Truck, label: 'Suppliers', path: '/suppliers', shortcut: '' },
        { icon: ShoppingBag, label: 'Purchases', path: '/purchases', shortcut: '' },
        { icon: Banknote, label: 'Cash Mgmt', path: '/cash', shortcut: '' },
        { icon: ClipboardCheck, label: 'Stocktake', path: '/stocktake', shortcut: '' },
        { icon: FileText, label: 'Audit Logs', path: '/audit-logs', shortcut: '' },
        { icon: Bell, label: 'Notifications', path: '/notifications', shortcut: '' },
        { icon: Bot, label: 'AI Assist', path: '/ai-assist', shortcut: '' },
        { icon: UserCircle, label: 'Staff', path: '/staff', shortcut: '' },
        { icon: FileSpreadsheet, label: 'Estimates', path: '/estimates', shortcut: '' },
        { icon: ScanBarcode, label: 'Barcodes', path: '/barcodes', shortcut: '' },
    ];

    return (
        <div className="h-full w-64 bg-background border-r border-white/10 flex flex-col flex-shrink-0">
            {/* Header / Logo */}
            <div className="p-6">
                <h1 className="text-2xl font-bold text-primary">QuickPOS</h1>
                <p className="text-xs text-muted-foreground mt-1">Offline POS System</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`
                                w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group flex-shrink-0
                                ${isActive
                                    ? 'bg-primary/20 text-primary shadow-lg shadow-primary/10'
                                    : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                                }
                            `}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon size={20} className={isActive ? 'text-primary' : 'group-hover:text-primary transition-colors'} />
                                <span className="font-medium">{item.label}</span>
                            </div>
                            {item.shortcut && (
                                <span className={`
                                    text-[10px] font-mono px-1.5 py-0.5 rounded border
                                    ${isActive
                                        ? 'bg-black/20 border-white/10 text-white/70'
                                        : 'bg-white/5 border-white/5 text-muted-foreground group-hover:border-white/10'
                                    }
                                `}>
                                    {item.shortcut}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 space-y-4">
                <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
                    <Keyboard size={14} />
                    <span>Keyboard shortcuts enabled</span>
                </div>

                <div className="text-[10px] text-white/20 px-2">
                    v1.0.0 • Offline Ready
                </div>
            </div>
        </div>
    );
}
