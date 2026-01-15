import { FastifyInstance } from 'fastify';
export interface Subscription {
    id: number;
    status: string;
    date_created: string;
    date_modified?: string;
    next_payment_date?: string;
    end_date?: string;
    billing_period?: string;
    billing_interval?: string;
    total?: string;
    currency?: string;
    line_items?: Array<{
        id: number;
        name: string;
        quantity: number;
        total: string;
    }>;
    billing?: any;
    shipping?: any;
    payment_method?: string;
    payment_method_title?: string;
    related_orders?: number[];
}
/**
 * Get all subscriptions for a customer
 */
export declare function getCustomerSubscriptions(fastify: FastifyInstance, customerId: number): Promise<Subscription[]>;
/**
 * Get active subscriptions for a customer
 */
export declare function getActiveSubscriptions(fastify: FastifyInstance, customerId: number): Promise<Subscription[]>;
//# sourceMappingURL=subscriptions.service.d.ts.map