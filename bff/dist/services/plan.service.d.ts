import { FastifyInstance } from 'fastify';
import { Treatment } from '../schemas/treatment.schema.js';
export interface PlanSubscription {
    subscription: {
        id: number;
        status: string;
        next_payment_date?: string;
        line_items: Array<{
            id: number;
            name: string;
            quantity: number;
            total: string;
        }>;
    };
    latest_order?: {
        id: number;
        number: string;
        status: string;
        date_created: string;
        total: string;
    };
    treatment?: Treatment | null;
}
/**
 * Get active plan with latest orders for each subscription
 */
export declare function getActivePlan(fastify: FastifyInstance, customerId: number): Promise<PlanSubscription[]>;
//# sourceMappingURL=plan.service.d.ts.map