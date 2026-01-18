import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Bill, BillItem, Product } from '../types/db';
import JsBarcode from 'jsbarcode';

interface BillWithItems extends Bill {
    items: (BillItem & { productName: string })[];
}

export const receiptService = {
    generatePDF: (bill: BillWithItems, type: 'THERMAL' | 'A4' | 'CHALLAN' = 'THERMAL') => {
        if (type === 'A4') return receiptService.generateA4(bill);
        if (type === 'CHALLAN') return receiptService.generateChallan(bill);

        // ... Thermal Logic (Existing) ...
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [80, 200]
        });

        const storeName = localStorage.getItem('storeName') || 'QuickPOS Store';
        const storeGSTIN = localStorage.getItem('storeGSTIN') || '';

        let yPos = 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(storeName, 40, yPos, { align: 'center' });
        yPos += 5;

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        if (storeGSTIN) {
            doc.text(`GSTIN: ${storeGSTIN}`, 40, yPos, { align: 'center' });
            yPos += 4;
        }
        doc.text(`Bill No: ${bill.bill_no}`, 40, yPos, { align: 'center' });
        yPos += 4;
        doc.text(`Date: ${new Date(bill.date).toLocaleString()}`, 40, yPos, { align: 'center' });
        yPos += 6;
        doc.line(2, yPos, 78, yPos);
        yPos += 2;

        const tableData = bill.items?.map(item => [
            item.productName,
            item.quantity.toString(),
            (item.price * item.quantity).toFixed(2)
        ]) || [];

        autoTable(doc, {
            startY: yPos,
            head: [['Item', 'Qty', 'Amt']],
            body: tableData,
            theme: 'plain',
            styles: { fontSize: 8, cellPadding: 1, overflow: 'linebreak' },
            headStyles: { fontStyle: 'bold' },
            columnStyles: {
                0: { cellWidth: 40 },
                1: { cellWidth: 10, halign: 'center' },
                2: { cellWidth: 20, halign: 'right' }
            },
            margin: { left: 2, right: 2 },
            didDrawPage: (data) => {
                yPos = data.cursor?.y || yPos;
            }
        });

        yPos = (doc as any).lastAutoTable.finalY + 4;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        const rightAlign = 75;
        doc.text(`Subtotal: ${bill.subtotal.toFixed(2)}`, rightAlign, yPos, { align: 'right' });
        yPos += 4;
        if (bill.discount_amount > 0) {
            doc.text(`Discount: -${bill.discount_amount.toFixed(2)}`, rightAlign, yPos, { align: 'right' });
            yPos += 4;
        }
        if (bill.gst_total > 0) {
            doc.text(`GST: ${bill.gst_total.toFixed(2)}`, rightAlign, yPos, { align: 'right' });
            yPos += 4;
        }
        doc.setFontSize(10);
        doc.text(`Total: ${bill.total.toFixed(2)}`, rightAlign, yPos, { align: 'right' });
        yPos += 6;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Thank you for shopping!', 40, yPos, { align: 'center' });
        doc.save(`Receipt_${bill.bill_no}.pdf`);
    },

    generateA4: (bill: BillWithItems) => {
        const doc = new jsPDF();
        const storeName = localStorage.getItem('storeName') || 'QuickPOS Store';
        const address = localStorage.getItem('storeAddress') || 'Store Address City, State';

        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text("TAX INVOICE", 105, 15, { align: 'center' });

        doc.setFontSize(14);
        doc.text(storeName, 14, 25);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(address, 14, 30);
        doc.text(`GSTIN: ${localStorage.getItem('storeGSTIN') || 'N/A'}`, 14, 35);

        doc.setFontSize(10);
        doc.text(`Invoice No: ${bill.bill_no}`, 140, 25);
        doc.text(`Date: ${new Date(bill.date).toLocaleString()}`, 140, 30);
        doc.text(`Customer: ${bill.customer_id ? 'Registered' : 'Store Walk-in'}`, 140, 35);

        const tableData = bill.items?.map(item => [
            item.productName,
            item.quantity,
            `₹${item.price.toFixed(2)}`,
            `₹${(item.taxable_value || 0).toFixed(2)}`,
            `₹${(item.gst_amount || 0).toFixed(2)}`,
            `₹${(item.price * item.quantity).toFixed(2)}`
        ]);

        autoTable(doc, {
            startY: 45,
            head: [['Description', 'Qty', 'Unit Price', 'Taxable', 'GST', 'Total']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [40, 40, 40] }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.text(`Subtotal: ₹${bill.subtotal.toFixed(2)}`, 140, finalY);
        doc.text(`Tax Total: ₹${bill.gst_total.toFixed(2)}`, 140, finalY + 5);
        doc.setFont('helvetica', 'bold');
        doc.text(`Grand Total: ₹${bill.total.toFixed(2)}`, 140, finalY + 12);

        doc.save(`Invoice_${bill.bill_no}.pdf`);
    },

    generateChallan: (bill: BillWithItems) => {
        const doc = new jsPDF();
        const storeName = localStorage.getItem('storeName') || 'QuickPOS Store';

        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text("DELIVERY CHALLAN", 105, 15, { align: 'center' });
        doc.setFontSize(12);
        doc.text("(Not for Sale / Transport Document)", 105, 22, { align: 'center' });

        doc.setFontSize(14);
        doc.text(storeName, 14, 35);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Challan Ref: DC/${bill.bill_no}`, 140, 35);
        doc.text(`Date: ${new Date(bill.date).toLocaleString()}`, 140, 40);

        const tableData = bill.items?.map((item, index) => [
            index + 1,
            item.productName,
            item.quantity,
            'Unit'
        ]);

        autoTable(doc, {
            startY: 50,
            head: [['#', 'Description of Goods', 'Quantity', 'UOM']],
            body: tableData,
            theme: 'striped'
        });

        const finalY = (doc as any).lastAutoTable.finalY + 20;
        doc.text("Received in good condition:", 14, finalY);
        doc.line(14, finalY + 15, 80, finalY + 15);
        doc.text("Receiver's Signature", 14, finalY + 20);

        doc.text("For " + storeName, 140, finalY);
        doc.line(140, finalY + 15, 190, finalY + 15);
        doc.text("Authorized Signatory", 140, finalY + 20);

        doc.save(`Challan_${bill.bill_no}.pdf`);
    },

    generateLabel: (product: Product) => {
        // Standard Label Size 50mm x 25mm
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: [50, 25]
        });

        const canvas = document.createElement('canvas');
        JsBarcode(canvas, product.barcode, {
            format: "CODE128",
            displayValue: false,
            height: 40,
            margin: 0
        });
        const img = canvas.toDataURL("image/png");

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(product.name.substring(0, 20), 25, 4, { align: 'center' });

        doc.addImage(img, 'PNG', 5, 6, 40, 10);

        doc.setFontSize(7);
        doc.text(product.barcode, 25, 19, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Rs. ${product.sell_price}`, 25, 23, { align: 'center' });

        doc.save(`Label_${product.barcode}.pdf`);
    },

    shareReceipt: (bill: Bill) => {
        alert('Sharing feature coming soon!');
    }
};
