import { useMemo } from 'react';
import type { Product } from '../types/db';
import { Package, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';

interface StatsProps {
    products: Product[];
}

export function InventoryStats({ products }: StatsProps) {
    const stats = useMemo(() => {
        const totalItems = products.length;
        const outOfStock = products.filter(p => p.stock <= 0).length;
        const lowStock = products.filter(p => p.stock > 0 && p.stock <= (p.min_stock_level || 5)).length;

        const totalCostValue = products.reduce((acc, p) => p.stock > 0 ? acc + (p.stock * (p.cost_price || 0)) : acc, 0);
        const totalSellValue = products.reduce((acc, p) => p.stock > 0 ? acc + (p.stock * p.sell_price) : acc, 0);
        const potentialProfit = totalSellValue - totalCostValue;

        return { totalItems, lowStock, outOfStock, totalCostValue, totalSellValue, potentialProfit };
    }, [products]);

    const statCards = [
        { label: "Total Products", value: stats.totalItems, icon: Package, color: "#60a5fa", bg: "rgba(96, 165, 250, 0.1)", border: "rgba(96, 165, 250, 0.2)" },
        { label: "Low Stock Alerts", value: stats.lowStock, icon: TrendingUp, color: "#fb923c", bg: "rgba(251, 146, 60, 0.1)", border: "rgba(251, 146, 60, 0.2)" },
        { label: "Out of Stock", value: stats.outOfStock, icon: AlertTriangle, color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)", border: "rgba(239, 68, 68, 0.2)" },
        { label: "Inventory Cost", value: `₹${stats.totalCostValue.toLocaleString('en-IN')}`, icon: DollarSign, color: "#facc15", bg: "rgba(250, 204, 21, 0.1)", border: "rgba(250, 204, 21, 0.2)" },
        { label: "Retail Value", value: `₹${stats.totalSellValue.toLocaleString('en-IN')}`, icon: TrendingUp, color: "#c084fc", bg: "rgba(192, 132, 252, 0.1)", border: "rgba(192, 132, 252, 0.2)" },
        { label: "Est. Profit", value: `₹${stats.potentialProfit.toLocaleString('en-IN')}`, icon: DollarSign, color: "#34d399", bg: "rgba(52, 211, 153, 0.1)", border: "rgba(52, 211, 153, 0.2)" }
    ];

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {statCards.map((stat, i) => (
                <div key={i} style={{ position: 'relative', overflow: 'hidden', borderRadius: '16px', padding: '16px', border: `1px solid ${stat.border}`, background: 'rgba(255, 255, 255, 0.02)', backdropFilter: 'blur(10px)', transition: 'transform 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>{stat.label}</p>
                            <h3 style={{ fontSize: '24px', fontWeight: 900, color: 'white', margin: 0 }}>{stat.value}</h3>
                        </div>
                        <div style={{ padding: '8px', borderRadius: '12px', background: stat.bg }}>
                            <stat.icon size={20} color={stat.color} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
