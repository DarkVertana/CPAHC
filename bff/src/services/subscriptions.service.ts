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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  billing?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shipping?: any;
  payment_method?: string;
  payment_method_title?: string;
  related_orders?: number[];
}

/**
 * Get all subscriptions for a customer
 */
export async function getCustomerSubscriptions(
  fastify: FastifyInstance,
  customerId: number
): Promise<Subscription[]> {
  try {
    const subscriptions = await fastify.woo.get('/subscriptions', {
      customer: customerId,
      per_page: 50,
      orderby: 'date',
      order: 'desc',
    });

    const subscriptionsArray = Array.isArray(subscriptions) ? subscriptions : [subscriptions];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return subscriptionsArray.map((sub: any) => ({
      id: sub.id,
      status: sub.status || 'unknown',
      date_created: sub.date_created || sub.date_created_gmt || '',
      date_modified: sub.date_modified || sub.date_modified_gmt || null,
      next_payment_date: sub.next_payment_date || sub.next_payment_date_gmt || null,
      end_date: sub.end_date || sub.end_date_gmt || null,
      billing_period: sub.billing_period || null,
      billing_interval: sub.billing_interval || null,
      total: sub.total || '0',
      currency: sub.currency || 'USD',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      line_items: (sub.line_items || []).map((item: any) => ({
        id: item.id,
        name: item.name || 'Unknown',
        quantity: item.quantity || 0,
        total: item.total || '0',
      })),
      billing: sub.billing || null,
      shipping: sub.shipping || null,
      payment_method: sub.payment_method || null,
      payment_method_title: sub.payment_method_title || null,
      related_orders: sub.related_orders || [],
    }));
  } catch (error) {
    // If subscriptions endpoint doesn't exist, return empty array
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any).message?.includes('404')) {
      return [];
    }
    throw error;
  }
}

/**
 * Get active subscriptions for a customer
 */
export async function getActiveSubscriptions(
  fastify: FastifyInstance,
  customerId: number
): Promise<Subscription[]> {
  try {
    const subscriptions = await fastify.woo.get('/subscriptions', {
      customer: customerId,
      status: 'active',
      per_page: 50,
    });

    const subscriptionsArray = Array.isArray(subscriptions) ? subscriptions : [subscriptions];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return subscriptionsArray.map((sub: any) => ({
      id: sub.id,
      status: sub.status || 'active',
      date_created: sub.date_created || sub.date_created_gmt || '',
      date_modified: sub.date_modified || sub.date_modified_gmt || null,
      next_payment_date: sub.next_payment_date || sub.next_payment_date_gmt || null,
      end_date: sub.end_date || sub.end_date_gmt || null,
      billing_period: sub.billing_period || null,
      billing_interval: sub.billing_interval || null,
      total: sub.total || '0',
      currency: sub.currency || 'USD',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      line_items: (sub.line_items || []).map((item: any) => ({
        id: item.id,
        name: item.name || 'Unknown',
        quantity: item.quantity || 0,
        total: item.total || '0',
      })),
      billing: sub.billing || null,
      shipping: sub.shipping || null,
      payment_method: sub.payment_method || null,
      payment_method_title: sub.payment_method_title || null,
      related_orders: sub.related_orders || [],
    }));
  } catch (error) {
    // If subscriptions endpoint doesn't exist, return empty array
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any).message?.includes('404')) {
      return [];
    }
    throw error;
  }
}
