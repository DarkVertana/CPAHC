import { FastifyInstance } from 'fastify';
export interface OrderItem {
    id: number;
    name: string;
    quantity: number;
    price: string;
    subtotal: string;
    total: string;
    sku?: string;
    image?: string;
    product_id?: number;
    variation_id?: number;
}
export interface Order {
    id: number;
    number: string;
    status: string;
    date_created: string;
    date_modified?: string;
    date_completed?: string;
    date_paid?: string;
    total: string;
    currency: string;
    items: OrderItem[];
    billing?: any;
    shipping?: any;
}
/**
 * Get paginated orders for a customer
 */
export declare function getCustomerOrders(fastify: FastifyInstance, customerId: number, page?: number, perPage?: number, status?: string): Promise<{
    orders: Order[];
    total: number;
    pages: number;
}>;
/**
 * Get single order details
 */
export declare function getOrderDetails(fastify: FastifyInstance, orderId: number): Promise<Order | null>;
//# sourceMappingURL=orders.service.d.ts.map