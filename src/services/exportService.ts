import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportService = {
    exportToCsv: (filename: string, data: any[]) => {
        if (!data || data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const val = row[header];
                return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    },

    exportToExcel: (filename: string, data: any[]) => {
        if (!data || data.length === 0) return;

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
        XLSX.writeFile(workbook, filename);
    },

    exportToPdf: (filename: string, title: string, data: any[]) => {
        if (!data || data.length === 0) return;

        const doc = new jsPDF();

        // Add Title
        doc.setFontSize(18);
        doc.text(title, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

        const headers = Object.keys(data[0]);
        const rows = data.map(item => headers.map(header => {
            const val = item[header];
            if (typeof val === 'number') return val.toFixed(2);
            return val;
        }));

        autoTable(doc, {
            startY: 40,
            head: [headers.map(h => h.toUpperCase().replace(/_/g, ' '))],
            body: rows,
            theme: 'striped',
            headStyles: { fillColor: [16, 185, 129] }, // mac-accent-emerald
            styles: { fontSize: 8 }
        });

        // Use Electron API to save
        console.log(`[exportService] Generating PDF buffer for: ${filename}`);
        const buffer = doc.output('arraybuffer');

        if (window.electronAPI) {
            window.electronAPI.saveFile(filename, buffer).then((res: any) => {
                if (res.success) {
                    // toast.success(`Saved to ${res.path}`); // If toast available
                    console.log(`[exportService] Saved to ${res.path}`);
                } else {
                    console.error('[exportService] Save failed', res.error);
                }
            });
        } else {
            // Fallback for web (if ever needed)
            doc.save(filename);
        }
    },

    generateComprehensivePdf: (filename: string, reportData: any) => {
        const doc = new jsPDF();
        const {
            period, generatedAt, salesSummary, paymentSplit, taxDetails,
            productAnalysis, timeAnalysis, profitMargins, refunds,
            discounts, customerDetails, cashReconciliation
        } = reportData;

        let yPos = 20;

        // 1. HEADER & IDENTIFICATION
        doc.setFontSize(18);
        doc.setTextColor(41, 128, 185); // Blue
        doc.text("COMBINED SALES REPORT", 14, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Period: ${period.start} to ${period.end}`, 14, yPos);
        doc.text(`Generated: ${new Date(generatedAt).toLocaleString()}`, 14, yPos + 6);
        yPos += 15;

        // 2. SALES SUMMARY
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("1. Sales Summary", 14, yPos);
        yPos += 5;

        // Calculate aggregates from the daily breakdown
        const totalSales = salesSummary.reduce((acc: number, curr: any) => acc + curr.total, 0);
        const totalTxns = salesSummary.reduce((acc: number, curr: any) => acc + curr.count, 0);
        const avgBill = totalTxns ? (totalSales / totalTxns).toFixed(2) : "0";

        autoTable(doc, {
            startY: yPos,
            head: [['Metric', 'Value']],
            body: [
                ['Total Sales', `INR ${totalSales}`],
                ['Total Bills', totalTxns],
                ['Average Bill Value', `INR ${avgBill}`],
                ['Net Sales (minus Refunds)', `INR ${totalSales - (refunds[0]?.total || 0)}`]
            ],
            theme: 'grid',
            headStyles: { fillColor: [44, 62, 80] },
            margin: { left: 14 }
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;

        // 3. PAYMENT BREAKDOWN
        doc.text("2. Payment Breakdown", 14, yPos);
        yPos += 5;
        autoTable(doc, {
            startY: yPos,
            head: [['Mode', 'Amount', 'Count']],
            body: paymentSplit.map((p: any) => [p.payment_mode, p.total, p.count]),
            theme: 'striped',
            headStyles: { fillColor: [39, 174, 96] }
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;

        // 4. TAX & GST
        doc.text("3. Tax & GST Details", 14, yPos);
        yPos += 5;
        autoTable(doc, {
            startY: yPos,
            head: [['GST Rate', 'Taxable Value', 'GST Amount']],
            body: taxDetails.map((t: any) => [`${t.gst_rate}%`, t.taxable.toFixed(2), t.gst.toFixed(2)]),
            theme: 'striped',
            headStyles: { fillColor: [230, 126, 34] }
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;

        // 5. DISCOUNT & REFUNDS
        doc.text("4. Discounts & Refunds", 14, yPos);
        yPos += 5;
        autoTable(doc, {
            startY: yPos,
            head: [['Category', 'Count', 'Value']],
            body: [
                ['Discounts Given', discounts[0]?.count || 0, discounts[0]?.total_discount || 0],
                ['Refunds/Returns', refunds[0]?.count || 0, refunds[0]?.total || 0]
            ],
            theme: 'grid',
            headStyles: { fillColor: [192, 57, 43] }
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;

        // 6. TOP PRODUCTS (Limit 5 to save space)
        doc.text("5. Top Selling Items", 14, yPos);
        yPos += 5;
        autoTable(doc, {
            startY: yPos,
            head: [['Item', 'Qty', 'Total']],
            body: productAnalysis.slice(0, 10).map((p: any) => [p.name, p.qty, p.total.toFixed(2)]), // Top 10
            headStyles: { fillColor: [142, 68, 173] }
        });
        // Check page break
        if ((doc as any).lastAutoTable.finalY > 250) {
            doc.addPage();
            yPos = 20;
        } else {
            yPos = (doc as any).lastAutoTable.finalY + 10;
        }

        // 7. CASH RECONCILIATION
        doc.text("6. Cash Drawer Sessions", 14, yPos);
        yPos += 5;
        autoTable(doc, {
            startY: yPos,
            head: [['Start Time', 'End Time', 'Start Cash', 'End Cash']],
            body: cashReconciliation.map((s: any) => [
                new Date(s.start_time).toLocaleTimeString(),
                s.end_time ? new Date(s.end_time).toLocaleTimeString() : 'OPEN',
                s.start_cash,
                s.end_cash || '-'
            ]),
            headStyles: { fillColor: [52, 73, 94] }
        });

        // Use Electron API to save
        console.log(`[exportService] Generating PDF buffer for: ${filename}`);
        const buffer = doc.output('arraybuffer');

        if (window.electronAPI) {
            console.log('[exportService] Electron API found. Calling saveFile...');
            window.electronAPI.saveFile(filename, buffer).then((res: any) => {
                if (res.success) {
                    console.log(`[exportService] Saved to ${res.path}`);
                } else {
                    console.error('[exportService] Save failed', res.error);
                }
            });
        } else {
            console.warn('[exportService] Electron API NOT found. Fallback to doc.save');
            doc.save(filename);
        }
    }
};
