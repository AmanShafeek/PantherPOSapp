export interface User {
    id: number;
    name: string;
    role: 'ADMIN' | 'CASHIER' | 'MANAGER';
    pin: string;
    created_at: string;
}

export interface Product {
    id: number;
    name: string;
    barcode: string;
    cost_price: number;
    sell_price: number;
    stock: number;
    gst_rate: number;
    hsn_code?: string;
    min_stock_level: number;
    image?: string;
    variant_group_id?: string;
    attributes?: string; // JSON string
}

export interface Customer {
    id: number;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    created_at: string;
    total_purchases: number;
    last_visit?: string;
    points: number;
    balance: number;
}

export interface CustomerLedger {
    id: number;
    customer_id: number;
    type: 'DEBIT' | 'CREDIT';
    amount: number;
    balance_after: number;
    description?: string;
    reference_id?: number;
    date: string;
}

export interface Promotion {
    id: number;
    name: string;
    type: 'COUPON' | 'AUTOMATED' | 'LOYALTY';
    code?: string;
    discount_type: 'PERCENT' | 'FIXED';
    discount_value: number;
    min_cart_value: number;
    max_discount: number;
    start_date?: string;
    end_date?: string;
    active: boolean;
    description?: string;
}

export interface LoyaltyConfig {
    id: number;
    key: string;
    value: string;
}

export interface Supplier {
    id: number;
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    gstin?: string;
    created_at: string;
    balance: number;
}

export interface SupplierLedger {
    id: number;
    supplier_id: number;
    type: 'DEBIT' | 'CREDIT';
    amount: number;
    balance_after: number;
    description?: string;
    reference_id?: number;
    date: string;
}

export interface PurchaseOrder {
    id: number;
    order_no: string;
    supplier_id: number;
    date: string;
    total_amount: number;
    status: 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
    notes?: string;
    receive_date?: string;
}

export interface PurchaseOrderItem {
    id: number;
    purchase_order_id: number;
    product_id: number;
    quantity: number;
    cost_price: number;
    total_amount: number;
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
    status: 'PAID' | 'CANCELLED' | 'REFUNDED' | 'PARTIAL_RETURN' | 'RETURNED';
    customer_id?: number;
    discount_amount: number;
    points_redeemed: number;
    points_earned: number;
    promotion_id?: number;
}

export interface BillItem {
    id: number;
    bill_id: number;
    product_id: number;
    quantity: number;
    returned_quantity?: number;
    price: number;
    taxable_value: number;
    gst_rate: number;
    gst_amount: number;
}

export interface CashDrawerSession {
    id: number;
    user_id: number;
    start_time: string;
    end_time?: string;
    start_cash: number;
    end_cash?: number;
    status: 'OPEN' | 'CLOSED';
}

export interface CashTransaction {
    id: number;
    session_id: number;
    type: 'OPENING' | 'DROP' | 'PAYOUT' | 'CLOSING' | 'SALE' | 'REFUND';
    amount: number;
    reason: string;
    time: string;
}

export interface StocktakeSession {
    id: number;
    created_at: string;
    status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    notes?: string;
    finalized_at?: string;
}

export interface StocktakeItem {
    id: number;
    session_id: number;
    product_id: number;
    system_stock: number;
    counted_stock: number;
    variance: number;
}

export interface InventoryLog {
    id: number;
    product_id: number;
    type: 'SALE' | 'RETURN' | 'RESTOCK' | 'SHRINKAGE' | 'STOCKTAKE_ADJUSTMENT';
    quantity_change: number;
    reason?: string;
    date: string;
    user_id?: number;
}
