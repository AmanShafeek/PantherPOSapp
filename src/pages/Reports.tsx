import { useState, useEffect, useMemo, useRef } from 'react';
import { reportService } from '../services/reportService';
import { exportService } from '../services/exportService';
import { Button } from '../components/Button';
import {
    FileText, FileSpreadsheet, FileJson as FilePdf, Download, Printer, Search,
    LayoutDashboard, Package, CreditCard, Banknote, Users, Tag, AlertTriangle,
    Truck, ClipboardList, ShieldAlert, History
} from 'lucide-react';

type ReportType = 'DAILY' | 'HOURLY' | 'PAYMENTS' | 'PRODUCTS' | 'PROFIT' | 'GST' | 'HSN' | 'OUTSTANDING' | 'TOP_CUSTOMERS' | 'PURCHASE_PRODUCTS' | 'SUPPLIERS' | 'UNPAID_PURCHASE' | 'PURCHASE_INVOICES' | 'LOW_STOCK' | 'REORDER_LIST' | 'LOSS_DAMAGE' | 'TRANSACTIONS';

const REPORT_GROUPS = [
    { title: 'Sales & Performance', items: [{ id: 'DAILY', label: 'Daily Sales', icon: LayoutDashboard }, { id: 'HOURLY', label: 'Hourly Heatmap', icon: LayoutDashboard }, { id: 'PAYMENTS', label: 'Payment Methods', icon: CreditCard }] },
    { title: 'Inventory & Products', items: [{ id: 'PRODUCTS', label: 'Product Sales', icon: Package }, { id: 'PROFIT', label: 'Profit & Margin', icon: Banknote }] },
    { title: 'Purchase', items: [{ id: 'PURCHASE_PRODUCTS', label: 'Products Purchased', icon: Package }, { id: 'SUPPLIERS', label: 'Suppliers List', icon: Truck }, { id: 'UNPAID_PURCHASE', label: 'Unpaid Purchases', icon: AlertTriangle }, { id: 'PURCHASE_INVOICES', label: 'Purchase Invoices', icon: FileText }] },
    { title: 'Stock Control', items: [{ id: 'LOW_STOCK', label: 'Low Stock Warning', icon: ShieldAlert }, { id: 'REORDER_LIST', label: 'Reorder List', icon: ClipboardList }, { id: 'LOSS_DAMAGE', label: 'Loss & Damage', icon: AlertTriangle }] },
    { title: 'Finance', items: [{ id: 'TRANSACTIONS', label: 'Transaction History', icon: History }, { id: 'OUTSTANDING', label: 'Outstanding Dues', icon: Banknote }] },
    { title: 'Taxation', items: [{ id: 'GST', label: 'GST Summary', icon: Tag }, { id: 'HSN', label: 'HSN Report', icon: Tag }] },
    { title: 'Customers', items: [{ id: 'TOP_CUSTOMERS', label: 'Top Customers', icon: Users }] }
];

export default function Reports() {
    const [activeReport, setActiveReport] = useState<ReportType>('DAILY');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => { window.print(); };

    const fetchData = async () => {
        setLoading(true);
        try {
            const from = dateFrom ? new Date(dateFrom).toISOString() : undefined;
            const to = dateTo ? new Date(dateTo).toISOString() : undefined;
            let result: any[] = [];
            switch (activeReport) {
                case 'DAILY': result = await reportService.getDailySales(from, to); break;
                case 'HOURLY': result = await reportService.getHourlySales(from, to); break;
                case 'PAYMENTS': result = await reportService.getPaymentSplit(from, to); break;
                case 'PRODUCTS': result = await reportService.getProductSales(from, to); break;
                case 'PROFIT': result = await reportService.getProfitMargin(from, to); break;
                case 'GST': result = await reportService.getGstSummary(from, to); break;
                case 'HSN': result = await reportService.getHsnSummary(from, to); break;
                case 'OUTSTANDING': result = await reportService.getOutstandingReceivables(from, to); break;
                case 'TOP_CUSTOMERS': result = await reportService.getTopCustomers(from, to); break;
                case 'PURCHASE_PRODUCTS': result = await reportService.getPurchaseProducts(from, to); break;
                case 'SUPPLIERS': result = await reportService.getSupplierList(); break;
                case 'UNPAID_PURCHASE': result = await reportService.getUnpaidPurchases(); break;
                case 'PURCHASE_INVOICES': result = await reportService.getPurchaseInvoiceList(from, to); break;
                case 'LOW_STOCK': result = await reportService.getLowStockWarning(); break;
                case 'REORDER_LIST': result = await reportService.getReorderList(); break;
                case 'LOSS_DAMAGE': result = await reportService.getLossAndDamage(from, to); break;
                case 'TRANSACTIONS': result = await reportService.getTransactionHistory(from, to); break;
            }
            setData(result || []);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [activeReport, dateFrom, dateTo]);

    const handleExport = (type: 'xlsx' | 'pdf' | 'csv') => {
        const fileName = `${activeReport}_Report_${new Date().toISOString().split('T')[0]}`;
        if (type === 'xlsx') exportService.exportToExcel(`${fileName}.xlsx`, data);
        if (type === 'csv') exportService.exportToCsv(`${fileName}.csv`, data);
        if (type === 'pdf') exportService.exportToPdf(`${fileName}.pdf`, activeReport.replace(/_/g, ' '), data);
        setShowExportMenu(false);
    };

    const columns = useMemo(() => {
        const formatCurrency = (val: any) => `₹${(val || 0).toFixed(2)}`;
        switch (activeReport) {
            case 'DAILY': return [
                { header: 'Date', accessor: 'day', className: 'font-mono' },
                { header: 'Transactions', accessor: 'count', className: 'center' },
                { header: 'Total Revenue', accessor: (r: any) => <span style={{ color: '#34d399', fontWeight: 'bold' }}>{formatCurrency(r.total)}</span>, className: 'right' },
            ];
            case 'HOURLY': return [
                { header: 'Time Block', accessor: 'hour', className: 'font-mono' },
                { header: 'Footfall', accessor: 'count', className: 'center' },
                { header: 'Sales Volume', accessor: (r: any) => formatCurrency(r.total), className: 'right' },
            ];
            case 'PAYMENTS': return [{ header: 'Method', accessor: 'payment_mode' }, { header: 'Txn Count', accessor: 'count', className: 'center' }, { header: 'Total', accessor: (r: any) => formatCurrency(r.total), className: 'right' }];
            case 'PRODUCTS': return [{ header: 'Product', accessor: 'name' }, { header: 'Barcode', accessor: 'barcode', className: 'font-mono' }, { header: 'Units', accessor: 'qty', className: 'center' }, { header: 'Revenue', accessor: (r: any) => formatCurrency(r.total), className: 'right' }];
            case 'PROFIT': return [{ header: 'Product', accessor: 'name' }, { header: 'Qty', accessor: 'qty_sold', className: 'center' }, { header: 'Revenue', accessor: (r: any) => formatCurrency(r.revenue), className: 'right' }, { header: 'Cost', accessor: (r: any) => formatCurrency(r.cost), className: 'right' }, { header: 'Profit', accessor: (r: any) => <span style={{ color: r.profit > 0 ? '#34d399' : '#ef4444', fontWeight: 'bold' }}>{formatCurrency(r.profit)}</span>, className: 'right' }];
            case 'GST': return [{ header: 'Tax Slab', accessor: (r: any) => `${r.gst_rate}%` }, { header: 'Taxable', accessor: (r: any) => formatCurrency(r.taxable), className: 'right' }, { header: 'GST', accessor: (r: any) => formatCurrency(r.gst), className: 'right' }];
            case 'HSN': return [{ header: 'HSN', accessor: 'hsn_code', className: 'font-mono' }, { header: 'Taxable', accessor: (r: any) => formatCurrency(r.taxable), className: 'right' }, { header: 'Tax', accessor: (r: any) => formatCurrency(r.gst), className: 'right' }];
            case 'OUTSTANDING': return [{ header: 'Customer', accessor: 'customer_name' }, { header: 'Contact', accessor: 'customer_phone', className: 'font-mono' }, { header: 'Date', accessor: (r: any) => new Date(r.date).toLocaleDateString() }, { header: 'Due', accessor: (r: any) => <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{formatCurrency(r.total)}</span>, className: 'right' }];
            case 'TOP_CUSTOMERS': return [{ header: 'Customer', accessor: 'name' }, { header: 'Phone', accessor: 'phone' }, { header: 'Visits', accessor: 'visits', className: 'center' }, { header: 'Spent', accessor: (r: any) => formatCurrency(r.total_spent), className: 'right' }];
            case 'PURCHASE_PRODUCTS': return [{ header: 'Product', accessor: 'name' }, { header: 'Barcode', accessor: 'barcode' }, { header: 'Qty', accessor: 'qty_bought', className: 'center' }, { header: 'Cost', accessor: (r: any) => formatCurrency(r.total_spent), className: 'right' }];
            case 'SUPPLIERS': return [{ header: 'Name', accessor: 'name' }, { header: 'Contact', accessor: 'phone' }, { header: 'GSTIN', accessor: 'gstin' }, { header: 'Orders', accessor: 'order_count', className: 'center' }];
            case 'UNPAID_PURCHASE': return [{ header: 'Order #', accessor: 'order_no' }, { header: 'Date', accessor: (r: any) => new Date(r.date).toLocaleDateString() }, { header: 'Amount', accessor: (r: any) => <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{formatCurrency(r.total_amount)}</span>, className: 'right' }, { header: 'Status', accessor: 'status' }];
            case 'PURCHASE_INVOICES': return [{ header: 'Inv No', accessor: 'order_no' }, { header: 'Supplier', accessor: 'supplier_name' }, { header: 'Date', accessor: (r: any) => new Date(r.date).toLocaleDateString() }, { header: 'Amount', accessor: (r: any) => formatCurrency(r.total_amount), className: 'right' }];
            case 'LOW_STOCK': return [{ header: 'Product', accessor: 'name', className: 'text-orange-400' }, { header: 'In Stock', accessor: 'stock', className: 'center' }, { header: 'Min Level', accessor: 'min_stock_level', className: 'center' }];
            case 'REORDER_LIST': return [{ header: 'Product', accessor: 'name' }, { header: 'Stock', accessor: 'stock', className: 'center' }, { header: 'Reorder', accessor: 'suggested_order', className: 'center' }];
            case 'LOSS_DAMAGE': return [{ header: 'Date', accessor: (r: any) => new Date(r.date).toLocaleDateString() }, { header: 'Product', accessor: 'product_name' }, { header: 'Type', accessor: 'type' }, { header: 'Reason', accessor: 'reason' }, { header: 'Qty', accessor: (r: any) => Math.abs(r.quantity_change), className: 'right' }];
            case 'TRANSACTIONS': return [{ header: 'Date', accessor: (r: any) => new Date(r.date).toLocaleString() }, { header: 'Type', accessor: 'type', className: (r: any) => r.type === 'SALE' ? 'text-green-400' : 'text-red-400' }, { header: 'Ref', accessor: 'ref' }, { header: 'Amount', accessor: (r: any) => formatCurrency(r.amount), className: 'right' }];
            default: return [];
        }
    }, [activeReport]);

    const activeReportLabel = useMemo(() => {
        for (const group of REPORT_GROUPS) { const item = group.items.find(i => i.id === activeReport); if (item) return item.label; }
        return activeReport;
    }, [activeReport]);

    const filteredReportGroups = useMemo(() => {
        if (!searchTerm) return REPORT_GROUPS;
        return REPORT_GROUPS.map(group => ({ ...group, items: group.items.filter(item => item.label.toLowerCase().includes(searchTerm.toLowerCase())) })).filter(group => group.items.length > 0);
    }, [searchTerm]);

    return (
        <div className="flex h-full gap-6">
            {/* Sidebar Navigation */}
            <div className="w-64 flex flex-col gap-4 bg-surface/50 backdrop-blur-md border border-white/5 rounded-2xl p-4 shadow-lg overflow-hidden shrink-0">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                    <input
                        className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                        placeholder="Search reports..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-6">
                    {filteredReportGroups.map((group, idx) => (
                        <div key={idx}>
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 px-2">{group.title}</h3>
                            <div className="flex flex-col gap-1">
                                {group.items.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveReport(item.id as ReportType)}
                                        className={`
                                            flex items-center gap-3 p-2.5 rounded-xl text-sm text-left transition-all duration-200
                                            ${activeReport === item.id
                                                ? 'bg-primary/20 text-primary font-bold shadow-glow border border-primary/20'
                                                : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                                            }
                                        `}
                                    >
                                        <item.icon size={16} strokeWidth={activeReport === item.id ? 2.5 : 2} />
                                        <span>{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col gap-6 min-w-0">
                {/* Toolbar */}
                <div className="p-4 bg-surface/50 backdrop-blur-md border border-white/5 rounded-2xl flex justify-between items-center shadow-lg">
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">{activeReportLabel}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-xs text-muted-foreground font-mono">
                                PERIOD: {dateFrom || 'ALL TIME'} — {dateTo || 'PRESENT'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-black/20 p-1 rounded-xl border border-white/10">
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-transparent text-white text-xs p-2 focus:outline-none font-mono" />
                            <span className="text-muted-foreground">→</span>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-transparent text-white text-xs p-2 focus:outline-none font-mono" />
                        </div>

                        <button onClick={handlePrint} className="p-2.5 bg-black/40 border border-white/10 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-white transition-colors">
                            <Printer size={18} />
                        </button>

                        <div className="relative">
                            <Button onClick={() => setShowExportMenu(!showExportMenu)} className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-glow">
                                <Download size={16} /> Export
                            </Button>
                            {showExportMenu && (
                                <div className="absolute right-0 top-full mt-2 w-40 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden py-1">
                                    <button onClick={() => handleExport('csv')} className="p-3 text-left hover:bg-white/5 text-sm flex gap-3 items-center text-gray-300 hover:text-white transition-colors"><FileText size={16} className="text-blue-400" /> CSV</button>
                                    <button onClick={() => handleExport('xlsx')} className="p-3 text-left hover:bg-white/5 text-sm flex gap-3 items-center text-gray-300 hover:text-white transition-colors"><FileSpreadsheet size={16} className="text-emerald-400" /> Excel</button>
                                    <button onClick={() => handleExport('pdf')} className="p-3 text-left hover:bg-white/5 text-sm flex gap-3 items-center text-gray-300 hover:text-white transition-colors"><FilePdf size={16} className="text-red-400" /> PDF</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Report Content */}
                <div className="flex-1 bg-surface/30 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative" ref={componentRef}>
                    <div className="absolute inset-0 overflow-auto custom-scrollbar">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-black/40 text-muted-foreground sticky top-0 z-10 backdrop-blur-md border-b border-white/10">
                                <tr>
                                    {columns.map((col: any, i: number) => (
                                        <th key={i} className={`p-4 font-bold whitespace-nowrap uppercase tracking-wider text-[11px] ${col.className?.includes('right') ? 'text-right' : col.className?.includes('center') ? 'text-center' : ''}`}>
                                            {col.header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {data.length > 0 ? (
                                    data.map((row, rIdx) => (
                                        <tr key={rIdx} className="hover:bg-white/5 transition-colors group">
                                            {columns.map((col: any, cIdx: number) => (
                                                <td key={cIdx} className={`p-4 text-gray-300 font-medium group-hover:text-white transition-colors ${col.className?.includes('right') ? 'text-right' : col.className?.includes('center') ? 'text-center' : ''}`}>
                                                    {typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor]}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={columns.length} className="p-20 text-center text-muted-foreground flex flex-col items-center justify-center gap-4">
                                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                                <History size={32} className="opacity-20" />
                                            </div>
                                            <p>{loading ? 'Loading report data...' : 'No records found for this period.'}</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <style>{`
                @media print {
                    @page { size: landscape; margin: 1cm; }
                    body { background: white !important; color: black !important; }
                    .no-print { display: none !important; }
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                }
            `}</style>
        </div>
    );
}
