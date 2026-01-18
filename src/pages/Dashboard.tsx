import { useState, useEffect } from 'react';
import { reportService } from '../services/reportService';
import {
    TrendingUp,
    AlertTriangle,
    IndianRupee,
    ShoppingCart,
    Clock,
    PackagePlus,
    UserPlus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            const [dashboardStats, activity] = await Promise.all([
                reportService.getDashboardStats(),
                reportService.getRecentActivity()
            ]);
            setStats(dashboardStats);
            setRecentActivity(activity);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !stats) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span className="text-sm font-bold text-muted-foreground animate-pulse">LOADING ANALYTICS...</span>
            </div>
        );
    }

    return (
        <div className="p-2 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-end bg-surface/50 backdrop-blur-lg p-6 rounded-2xl border border-white/5 shadow-lg">
                <div>
                    <h1 className="text-3xl font-bold mb-2 tracking-tight">Dashboard Overview</h1>
                    <p className="text-sm text-emerald-500 font-bold flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full w-fit">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        System Operational
                    </p>
                </div>
                <div className="text-xs font-mono bg-black/40 px-4 py-2 rounded-lg border border-white/10 flex items-center gap-2 text-muted-foreground shadow-inner">
                    <Clock size={14} className="text-primary" />
                    <span>UPDATED: {new Date().toLocaleTimeString()}</span>
                </div>
            </div>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard
                    title="Today's Sales"
                    value={`₹${stats.todaySales.toFixed(2)}`}
                    icon={IndianRupee}
                    color="text-blue-400"
                    bg="bg-blue-400/10"
                    subtext={`${stats.billCount} transactions`}
                />
                <StatCard
                    title="Net Profit (Est.)"
                    value={`₹${(stats.todaySales * 0.2).toFixed(2)}`}
                    icon={TrendingUp}
                    color="text-emerald-400"
                    bg="bg-emerald-400/10"
                    subtext="~20% Margin"
                />
                <StatCard
                    title="Low Stock Items"
                    value={stats.lowStockCount}
                    icon={AlertTriangle}
                    color="text-orange-400"
                    bg="bg-orange-400/10"
                    subtext="Action Required"
                    onClick={() => navigate('/products')}
                />
                <StatCard
                    title="Inventory Value"
                    value={`₹${(stats.totalStockValue / 1000).toFixed(1)}k`}
                    icon={PackagePlus}
                    color="text-purple-400"
                    bg="bg-purple-400/10"
                    subtext="Cost Price"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT: Sales Trend (Visual) */}
                <div className="bg-surface/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 lg:col-span-2 shadow-lg h-[400px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold flex items-center gap-3">
                            <TrendingUp size={20} className="text-primary" />
                            Weekly Trend
                        </h3>
                        <button onClick={() => navigate('/reports')} className="text-primary text-xs font-bold hover:underline bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                            VIEW FULL REPORT
                        </button>
                    </div>

                    <div className="flex items-end justify-between gap-4 flex-1 pb-2">
                        {stats.salesTrend && stats.salesTrend.map((day: any, idx: number) => {
                            const maxVal = Math.max(...stats.salesTrend.map((d: any) => d.total));
                            const heightPercent = maxVal > 0 ? (day.total / maxVal) * 100 : 0;
                            return (
                                <div key={idx} className="flex flex-col items-center gap-4 flex-1 h-full justify-end group">
                                    <div className="w-full bg-white/5 rounded-xl overflow-hidden flex items-end h-full relative group-hover:bg-white/10 transition-colors">
                                        <div
                                            style={{ height: `${Math.max(heightPercent, 5)}%` }}
                                            className="w-full bg-gradient-to-t from-primary/50 to-primary transition-all duration-500 rounded-xl relative group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                                        >
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold whitespace-nowrap border border-white/10">
                                                ₹{day.total}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        {new Date(day.day).toLocaleDateString('en-US', { weekday: 'short' })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT: Recent Activity */}
                <div className="bg-surface/50 backdrop-blur-md border border-white/5 rounded-2xl flex flex-col shadow-lg h-[400px]">
                    <div className="p-6 border-b border-white/5">
                        <h3 className="text-xl font-bold flex items-center gap-3">
                            <Clock size={20} className="text-purple-400" />
                            Live Feed
                        </h3>
                    </div>

                    <div className="flex-1 overflow-auto p-4 flex flex-col gap-3 relative no-scrollbar">
                        {recentActivity.map((item) => (
                            <div key={item.id} className="p-4 rounded-xl bg-black/20 border border-white/5 flex justify-between items-center hover:bg-white/5 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                        <ShoppingCart size={16} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">{item.customer_name || 'Walk-in Customer'}</div>
                                        <div className="text-[10px] text-muted-foreground font-mono bg-white/5 px-1.5 rounded w-fit mt-1">{item.bill_no}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-emerald-400">₹{item.total.toFixed(2)}</div>
                                    <div className="text-[10px] text-muted-foreground">{new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Quick Actions Footer */}
                    <div className="p-4 border-t border-white/5 grid grid-cols-2 gap-3 bg-black/20">
                        <button onClick={() => navigate('/products')} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center gap-2 hover:bg-white/10 hover:border-primary/30 hover:text-primary transition-all group">
                            <PackagePlus size={16} className="group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold uppercase tracking-wide">Add Item</span>
                        </button>
                        <button onClick={() => navigate('/customers')} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center gap-2 hover:bg-white/10 hover:border-primary/30 hover:text-primary transition-all group">
                            <UserPlus size={16} className="group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold uppercase tracking-wide">Add User</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, bg, subtext, onClick }: any) {
    return (
        <div
            onClick={onClick}
            className={`
                bg-surface/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 flex flex-col justify-between h-40 
                transition-all duration-300 group
                ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-glow hover:border-primary/30' : 'hover:border-white/10'}
            `}
        >
            <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</span>
                <div className={`p-3 rounded-xl ${bg} ${color} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={20} className="drop-shadow-lg" />
                </div>
            </div>

            <div className="mt-4">
                <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
                {subtext && (
                    <div className="mt-2 flex items-center">
                        <p className={`text-xs font-bold ${color} bg-black/20 px-2 py-0.5 rounded-md`}>{subtext}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
