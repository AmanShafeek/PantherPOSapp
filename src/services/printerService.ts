import { settingsService } from './settingsService';

export const printerService = {
    /**
     * Sends a pulse command with dynamic timing from settings.
     */
    openDrawer: async () => {
        const settings = await settingsService.getSettings();
        if (!settings.drawer_enabled) return { success: false, error: 'Drawer disabled' };

        // ESC p m t1 t2
        // t1 = ms / 2, t2 = ms / 2 approx for standard ESC/POS
        const t1 = Math.floor(settings.pulse_on / 2);
        const t2 = Math.floor(settings.pulse_off / 2);
        const pulseCommand = [0x1B, 0x70, 0x00, t1, t2];

        try {
            const result = await window.electronAPI.printRaw(pulseCommand);
            return result;
        } catch (error) {
            return { success: false, error: String(error) };
        }
    },

    /**
     * Formats and prints a receipt.
     */
    printReceipt: async (bill: any) => {
        const settings = await settingsService.getSettings();
        if (!settings.printer_enabled) return { success: false, error: 'Printer disabled' };

        console.log('[Printer] Printing bill:', bill.bill_no);

        const encoder = new TextEncoder();

        // Construct ESC/POS commands
        const commands = [
            0x1B, 0x1D, 0x61, 0x01, // Center align
            ...Array.from(encoder.encode(settings.store_name + '\n')),
            ...Array.from(encoder.encode(settings.store_address + '\n')),
            ...Array.from(encoder.encode('GSTIN: ' + settings.gst_no + '\n')),
            ...Array.from(encoder.encode('Phone: ' + settings.store_phone + '\n')),
            0x1B, 0x64, 0x01, // Feed 1 line

            0x1B, 0x1D, 0x61, 0x00, // Left align
            ...Array.from(encoder.encode('Bill No: ' + bill.bill_no + '\n')),
            ...Array.from(encoder.encode('Date: ' + new Date(bill.date).toLocaleString() + '\n')),
            ...Array.from(encoder.encode('--------------------------------\n')),

            // Item headers
            ...Array.from(encoder.encode('Item              Qty    Total\n')),
            ...Array.from(encoder.encode('--------------------------------\n')),

            // Loop through items
            ...(bill.items || []).flatMap((item: any) => [
                ...Array.from(encoder.encode(`${item.productName.substring(0, 16).padEnd(17)} ${String(item.quantity).padStart(3)} ${item.taxable_value.toFixed(2).padStart(8)}\n`)),
                ...Array.from(encoder.encode(`HSN:${(item.hsn_code || '---').padEnd(10)} GST:${String(item.gst_rate).padStart(2)}% ${item.gst_amount.toFixed(2).padStart(8)}\n`))
            ]),

            ...Array.from(encoder.encode('--------------------------------\n')),
            ...Array.from(encoder.encode(`Subtotal: ${bill.subtotal.toFixed(2).padStart(22)}\n`)),

            // Tax Breakup
            ...(bill.cgst > 0 ? [
                ...Array.from(encoder.encode(`CGST: ${bill.cgst.toFixed(2).padStart(26)}\n`)),
                ...Array.from(encoder.encode(`SGST: ${bill.sgst.toFixed(2).padStart(26)}\n`))
            ] : []),
            ...(bill.igst > 0 ? [
                ...Array.from(encoder.encode(`IGST: ${bill.igst.toFixed(2).padStart(26)}\n`))
            ] : []),

            ...Array.from(encoder.encode('--------------------------------\n')),
            0x1B, 0x21, 0x30, // Double height, double width
            ...Array.from(encoder.encode(`TOTAL: ₹${bill.total.toFixed(2)}\n`)),
            0x1B, 0x21, 0x00, // Reset formatting

            ...Array.from(encoder.encode('--------------------------------\n')),
            0x1B, 0x1D, 0x61, 0x01, // Center align
            ...Array.from(encoder.encode('Thank you for shopping!\n')),
            ...Array.from(encoder.encode('Visit again soon.\n')),
            0x1D, 0x56, 0x41, 0x03 // Cut paper
        ];

        try {
            return await window.electronAPI.printRaw(commands);
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }
};
