import { FastifyPluginAsync } from 'fastify';

const webhooksRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /v1/webhooks/woocommerce
  fastify.post<{
    Body: {
      id?: number;
      customer_id?: number;
      status?: string;
      billing?: unknown;
      shipping?: unknown;
    };
    Headers: {
      'x-wc-webhook-topic'?: string;
      'x-wc-webhook-source'?: string;
    };
  }>('/woocommerce', async (request, reply) => {
    const topic = request.headers['x-wc-webhook-topic'] || '';
    const body = request.body;

    // Validate webhook (in production, verify signature)
    // For now, we'll accept all webhooks from WooCommerce

    fastify.log.info({ topic, resourceId: body.id }, 'WooCommerce webhook received');

    // Handle different webhook events
    if (topic.includes('order') || body.id && body.status) {
      // Order created or updated
      const orderId = body.id;
      const customerId = body.customer_id;

      if (customerId) {
        // Invalidate cache for this customer
        await fastify.cache.invalidatePattern(`plan:${customerId}`);
        await fastify.cache.invalidatePattern(`subs:${customerId}`);
        await fastify.cache.invalidatePattern(`orders:${customerId}:*`);
        await fastify.cache.invalidate(`order:${orderId}`);
        await fastify.cache.invalidate(`treatment:${orderId}`);
      }

      fastify.log.info(`Cache invalidated for order ${orderId}, customer ${customerId}`);
    } else if (topic.includes('subscription') || body.id && body.status && body.customer_id) {
      // Subscription updated
      const subscriptionId = body.id;
      const customerId = body.customer_id;

      if (customerId) {
        // Invalidate cache for this customer
        await fastify.cache.invalidatePattern(`plan:${customerId}`);
        await fastify.cache.invalidatePattern(`subs:${customerId}`);
      }

      fastify.log.info(`Cache invalidated for subscription ${subscriptionId}, customer ${customerId}`);
    } else if (body.billing || body.shipping) {
      // Customer updated (addresses changed)
      const customerId = body.id;

      if (customerId) {
        // Invalidate all customer-related cache
        await fastify.cache.invalidatePattern(`plan:${customerId}`);
        await fastify.cache.invalidatePattern(`subs:${customerId}`);
        await fastify.cache.invalidatePattern(`orders:${customerId}:*`);
      }

      fastify.log.info(`Cache invalidated for customer ${customerId}`);
    }

    return reply.code(200).send({ success: true, message: 'Webhook processed' });
  });
};

export default webhooksRoutes;
