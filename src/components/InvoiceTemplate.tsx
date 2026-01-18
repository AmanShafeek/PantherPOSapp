import React from 'react';
import type { AppSettings } from '../services/settingsService';
import type { BillWithItems } from '../services/saleService';

interface InvoiceTemplateProps {
    bill: BillWithItems;
    settings: AppSettings;
}

export const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ bill, settings }) => {
    if (!bill || !settings) return <div className="p-10 text-red-500 font-bold">Error: Missing Data for Template</div>;

    // Ensure items is always an array
    const items = bill.items || [];
    const date = bill.date ? new Date(bill.date) : new Date();

    return (
        <div id="invoice-print-area" className="bg-white text-black p-10 font-sans min-h-[297mm] w-full max-w-[210mm] mx-auto shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-gray-100 pb-8">
                <div className="space-y-4">
                    {settings.store_logo ? (
                        <img src={settings.store_logo} alt="Logo" className="h-16 object-contain" />
                    ) : null}
                    <div className="space-y-1">
                        <h1 className="text-2xl font-black uppercase tracking-tighter">{settings.store_name || 'QuickPOS Store'}</h1>
                        <p className="text-[11px] text-gray-500 whitespace-pre-line leading-relaxed max-w-[300px]">
                            {settings.store_address}
                        </p>
                        <p className="text-[11px] font-bold text-gray-700">GSTIN: {settings.gst_no}</p>
                        <p className="text-[11px] font-bold text-gray-700">PH: {settings.store_phone}</p>
                    </div>
                </div>
                <div className="text-right space-y-2">
                    <h2 className="text-4xl font-black text-gray-200 uppercase tracking-widest leading-none">Invoice</h2>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Bill Number</p>
                        <p className="font-bold text-lg">{bill.bill_no}</p>
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-4">Date</p>
                        <p className="font-bold">{date.toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            {/* Content Table */}
            <div className="mt-10">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-200 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                            <th className="py-4 px-2">#</th>
                            <th className="py-4">Item Description</th>
                            <th className="py-4 text-center">HSN</th>
                            <th className="py-4 text-center">Qty</th>
                            <th className="py-4 text-right">Price</th>
                            <th className="py-4 text-center">GST%</th>
                            <th className="py-4 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="text-[12px] divide-y divide-gray-50 text-gray-700">
                        {items.length > 0 ? items.map((item, idx) => (
                            <tr key={idx}>
                                <td className="py-4 px-2 text-gray-300 font-bold">{idx + 1}</td>
                                <td className="py-4 font-bold text-gray-900">{item.productName || 'Unknown Product'}</td>
                                <td className="py-4 text-center">{(item as any).hsn_code || '---'}</td>
                                <td className="py-4 text-center">{item.quantity}</td>
                                <td className="py-4 text-right">₹{(item.price || 0).toFixed(2)}</td>
                                <td className="py-4 text-center">{item.gst_rate}%</td>
                                <td className="py-4 text-right font-bold text-gray-900">₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={7} className="py-10 text-center text-gray-400 italic">No items found in this bill</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Totals & Tax Breakup */}
            <div className="mt-10 flex border-t border-gray-100 pt-8 gap-10">
                <div className="flex-1 space-y-6">
                    <div>
                        <h3 className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-3">Tax Breakdown</h3>
                        <table className="w-full text-[10px] border border-gray-50">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-2 border border-gray-100">HSN</th>
                                    <th className="p-2 border border-gray-100">Value</th>
                                    {bill.igst > 0 ? (
                                        <th className="p-2 border border-gray-100">IGST</th>
                                    ) : (
                                        <>
                                            <th className="p-2 border border-gray-100">CGST</th>
                                            <th className="p-2 border border-gray-100">SGST</th>
                                        </>
                                    )}
                                    <th className="p-2 border border-gray-100">Total Tax</th>
                                </tr>
                            </thead>
                            <tbody className="text-center text-gray-500">
                                <tr>
                                    <td className="p-2 border border-gray-100">Summary</td>
                                    <td className="p-2 border border-gray-100">₹{(bill.subtotal || 0).toFixed(2)}</td>
                                    {bill.igst > 0 ? (
                                        <td className="p-2 border border-gray-100">₹{(bill.igst || 0).toFixed(2)}</td>
                                    ) : (
                                        <>
                                            <td className="p-2 border border-gray-100">₹{(bill.cgst || 0).toFixed(2)}</td>
                                            <td className="p-2 border border-gray-100">₹{(bill.sgst || 0).toFixed(2)}</td>
                                        </>
                                    )}
                                    <td className="p-2 border border-gray-100 font-bold text-gray-900">₹{((bill.cgst || 0) + (bill.sgst || 0) + (bill.igst || 0)).toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div>
                        <h3 className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2">Terms & Conditions</h3>
                        <p className="text-[9px] text-gray-400 italic whitespace-pre-line leading-relaxed">
                            {settings.invoice_terms}
                        </p>
                    </div>
                </div>

                <div className="w-[200px] space-y-4">
                    <div className="flex justify-between items-center text-[11px] text-gray-500">
                        <span>Subtotal</span>
                        <span>₹{(bill.subtotal || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-gray-500">
                        <span>Total Tax</span>
                        <span>₹{((bill.cgst || 0) + (bill.sgst || 0) + (bill.igst || 0)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t-2 border-gray-900 bg-gray-900 text-white p-4 rounded-xl shadow-lg">
                        <span className="text-[10px] font-black uppercase tracking-widest">Total Amount</span>
                        <span className="text-xl font-black italic underline decoration-blue-500 underline-offset-4">₹{(bill.total || 0).toFixed(2)}</span>
                    </div>

                    <div className="pt-10 text-center">
                        <div className="h-16 w-full border-b border-gray-200 mb-2"></div>
                        <p className="text-[9px] font-black uppercase text-gray-300 tracking-[0.2em]">Authorized Signature</p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-20 text-center border-t border-gray-50 pt-8">
                <p className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-1">
                    {settings.invoice_footer}
                </p>
                <p className="text-[9px] text-gray-300">
                    Generated by QuickPOS - Professional Invoice Solution
                </p>
            </div>
        </div>
    );
};
