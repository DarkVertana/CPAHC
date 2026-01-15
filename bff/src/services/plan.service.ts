import { FastifyInstance } from 'fastify';
import { getActiveSubscriptions } from './subscriptions.service';
import { getOrderDetails } from './orders.service';
import { Treatment } from '../schemas/treatment.schema';

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
  treatment?: Treatment | null; // Will be populated by treatment service
}

/**
 * Get active plan with latest orders for each subscription
 */
export async function getActivePlan(
  fastify: FastifyInstance,
  customerId: number
): Promise<PlanSubscription[]> {
  // Get active subscriptions
  const activeSubs = await getActiveSubscriptions(fastify, customerId);

  // For each subscription, get the latest related order
  const planItems = await Promise.all(
    activeSubs.map(async (sub) => {
      const planItem: PlanSubscription = {
        subscription: {
          id: sub.id,
          status: sub.status,
          next_payment_date: sub.next_payment_date || undefined,
          line_items: sub.line_items || [],
        },
      };

      // Get latest related order if available
      if (sub.related_orders && sub.related_orders.length > 0) {
        // Get the most recent order ID (assuming they're sorted)
        const latestOrderId = sub.related_orders[sub.related_orders.length - 1];
        
        try {
          const order = await getOrderDetails(fastify, latestOrderId);
          if (order) {
            planItem.latest_order = {
              id: order.id,
              number: order.number,
              status: order.status,
              date_created: order.date_created,
              total: order.total,
            };
          }
        } catch {
          // Order not found or error - continue without it
          fastify.log.warn({ orderId: latestOrderId, subscriptionId: sub.id }, 'Order not found for subscription');
        }
      }

      return planItem;
    })
  );

  return planItems;
}
