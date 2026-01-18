type Events = {
    'ADD_TO_CART': { product: any; quantity: number };
    'REMOVE_FROM_CART': { productId: number };
    'CLEAR_CART': void;
    'SHOW_TOAST': { message: string; type: 'success' | 'error' | 'info' };
    'NAVIGATE': { path: string };
    'CART_UPDATED': any[]; // Payload is CartItem[]
    'OPEN_MODAL': { modal: string; data?: any };
    'APP_INIT': void;
    'THEME_CHANGE': 'light' | 'dark';
    'SALE_COMPLETED': void;
    'CUSTOMER_SELECTED': any; // Customer object
};

class EventBus {
    private listeners: { [K in keyof Events]?: ((data: Events[K]) => void)[] } = {};

    on<K extends keyof Events>(event: K, callback: (data: Events[K]) => void) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        (this.listeners[event] as any)?.push(callback);
        return () => this.off(event, callback);
    }

    off<K extends keyof Events>(event: K, callback: (data: Events[K]) => void) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event]?.filter(cb => cb !== callback);
    }

    emit<K extends keyof Events>(event: K, data: Events[K]) {
        this.listeners[event]?.forEach(cb => cb(data));
    }
}

export const eventBus = new EventBus();
