export interface User {
    id: number;
    name: string;
    email: string;
}

export interface AdminProps {
    auth: { user: User | null };
    flash: { success: string | null; error: string | null };
    counts: { orders: number; inquiries: number } | null;
    shopUrl: string;
    errors: Record<string, string>;
    [key: string]: unknown;
}

/** Laravel's paginator, as Inertia sends it. */
export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

export type OrderStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface OrderRow {
    id: number;
    reference: string;
    status: OrderStatus;
    is_read: boolean;
    customer_name: string;
    phone: string;
    subtotal: number;
    item_count: number;
    created_at: string;
    fulfilment?: string;
    shipping?: string | null;
    payment?: string;
}
