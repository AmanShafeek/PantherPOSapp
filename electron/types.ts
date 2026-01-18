export interface Product {
    id: number;
    name: string;
    barcode: string;
    cost_price: number;
    sell_price: number;
    stock: number;
    gst_rate: number;
    hsn_code?: string;
}

export interface Bill {
    id: number;
    bill_no: string;
    date: string;
    subtotal: number;
    cgst: number;
    sgst: number;
    igst: number;
    gst_total: number;
    total: number;
    payment_mode: 'CASH' | 'CARD' | 'UPI';
}

export interface BillItem {
    id: number;
    bill_id: number;
    product_id: number;
    quantity: number;
    price: number;
    taxable_value: number;
    gst_rate: number;
    gst_amount: number;
}
