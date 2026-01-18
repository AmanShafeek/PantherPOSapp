import { useMemo, useEffect, useState } from 'react';
import type { Product } from '../types/db';
import { InventoryStats } from './InventoryStats';
import { auditService, type AuditLogEntry } from '../services/auditService';
import { TrendingUp, AlertTriangle, Package, Activity, Clock, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

interface InventoryDashboardProps {
    products: Product[];
}

export function InventoryDashboard({ products }: InventoryDashboardProps) {
    const [recentActivity, setRecentActivity] = useState<AuditLogEntry[]>([]);

    useEffect(() => {
        // Fetch recent inventory-related logs
        const loadLogs = async () => {
            const logs = await auditService.getLogs(20);
            // Filter for relevant actions
            const inventoryLogs = logs.filter(l =>
                ['PRODUCT_CREATE', 'PRODUCT_UPDATE', 'PRODUCT_DELETE', 'SHRINKAGE_REPORT', 'BILL_GENERATE'].includes(l.action)
            ).slice(0, 7);
            setRecentActivity(inventoryLogs);
        };
        loadLogs();

        // Poll for updates every 10s
        const interval = setInterval(loadLogs, 10000);
        return () => clearInterval(interval);
    }, []);

    // Analytics: Top 5 Products by Value
    const topValueProducts = useMemo(() => {
        return [...products]
            .sort((a, b) => (b.sell_price * b.stock) - (a.sell_price * a.stock))
            .slice(0, 5);
    }, [products]);

    // Analytics: Stock Status Distribution
    const stockStatus = useMemo(() => {
        const total = products.length || 1;
        const out = products.filter(p => p.stock <= 0).length;
        const low = products.filter(p => p.stock > 0 && p.stock <= (p.min_stock_level || 5)).length;
        const good = products.length - out - low;

        return {
            out: { count: out, pct: (out / total) * 100 },
            low: { count: low, pct: (low / total) * 100 },
            good: { count: good, pct: (good / total) * 100 }
        };
    }, [products]);

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            {/* 1. High-Level Stats (Reused) */}
            <InventoryStats products={products} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 2. Value Distribution Chart */}
                <div className="lg:col-span-2 bg-black/20 border border-white/5 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-32 bg-mac-accent-blue/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-xl">
                                <TrendingUp className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-wider text-mac-text-primary">Top Assets</h3>
                                <p className="text-[10px] text-mac-text-secondary opacity-60">Highest value inventory items</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {topValueProducts.map((product, i) => {
                            const value = product.sell_price * product.stock;
                            const maxValue = (topValueProducts[0]?.sell_price || 0) * (topValueProducts[0]?.stock || 0);
                            const widthPct = maxValue ? (value / maxValue) * 100 : 0;

                            return (
                                <div key={product.id} className="relative">
                                    <div className="flex justify-between text-xs font-bold mb-1 z-10 relative">
                                        <span className="text-white flex items-center gap-2">
                                            <span className="opacity-40 font-mono">0{i + 1}</span>
                                            {product.name}
                                        </span>
                                        <span className="text-emerald-400">₹{value.toLocaleString()}</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${widthPct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 3. Stock Health & Activity Feed */}
                <div className="space-y-6">

                    {/* Stock Health Widget */}
                    <div className="bg-black/20 border border-white/5 rounded-3xl p-6 backdrop-blur-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-500/10 rounded-xl">
                                <Package className="w-5 h-5 text-emerald-400" />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-wider text-mac-text-primary">Health</h3>
                        </div>

                        <div className="flex h-4 w-full rounded-full overflow-hidden mb-4">
                            <div className="bg-emerald-500" style={{ width: `${stockStatus.good.pct}%` }} />
                            <div className="bg-orange-500" style={{ width: `${stockStatus.low.pct}%` }} />
                            <div className="bg-red-500" style={{ width: `${stockStatus.out.pct}%` }} />
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-white/5 rounded-xl p-2">
                                <div className="text-emerald-400 font-black text-lg">{stockStatus.good.count}</div>
                                <div className="text-[9px] uppercase tracking-wider opacity-60">Good</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-2">
                                <div className="text-orange-400 font-black text-lg">{stockStatus.low.count}</div>
                                <div className="text-[9px] uppercase tracking-wider opacity-60">Low</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-2">
                                <div className="text-red-400 font-black text-lg">{stockStatus.out.count}</div>
                                <div className="text-[9px] uppercase tracking-wider opacity-60">Out</div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity Feed */}
                    <div className="bg-black/20 border border-white/5 rounded-3xl p-6 backdrop-blur-xl flex-1 min-h-[300px]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-purple-500/10 rounded-xl">
                                <Activity className="w-5 h-5 text-purple-400" />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-wider text-mac-text-primary">Live Activity</h3>
                        </div>

                        <div className="space-y-4">
                            {recentActivity.length === 0 ? (
                                <div className="text-center opacity-30 text-xs py-8">No recent activity</div>
                            ) : (
                                recentActivity.map((log) => (
                                    <div key={log.id} className="flex gap-3 items-start group">
                                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-purple-500/50 group-hover:bg-purple-400 transition-colors" />
                                        <div className="flex-1">
                                            <p className="text-xs font-medium text-white group-hover:text-purple-200 transition-colors">
                                                {log.action.replace('_', ' ')}
                                            </p>
                                            <div className="flex justify-between items-center mt-0.5">
                                                <span className="text-[10px] text-mac-text-secondary opacity-50 truncate max-w-[120px]">{log.user_name}</span>
                                                <div className="flex items-center text-[10px] text-mac-text-secondary opacity-40">
                                                    <Clock className="w-2.5 h-2.5 mr-1" />
                                                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
