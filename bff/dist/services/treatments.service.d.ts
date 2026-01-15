import { FastifyInstance } from 'fastify';
import { Treatment } from '../schemas/treatment.schema.js';
interface WooCommerceOrder {
    id: number;
    date_created?: string;
    date_created_gmt?: string;
    meta_data?: Array<{
        key?: string;
        value?: unknown;
    }>;
}
/**
 * Parse treatment data from WooCommerce order meta_data
 * Maps ACF meta keys to stable treatment schema
 */
export declare function parseTreatmentFromOrder(order: WooCommerceOrder): Treatment | null;
/**
 * Get treatment for a specific order
 */
export declare function getOrderTreatment(fastify: FastifyInstance, orderId: number): Promise<Treatment | null>;
/**
 * Get all orders with treatments
 */
export declare function getOrdersWithTreatments(fastify: FastifyInstance, customerId: number, page?: number, perPage?: number): Promise<{
    orders: Array<{
        order: {
            id: number;
            number: string;
            status: string;
            date_created: string;
            total: string;
        };
        treatment: Treatment | null;
    }>;
    total: number;
    pages: number;
}>;
export {};
//# sourceMappingURL=treatments.service.d.ts.map