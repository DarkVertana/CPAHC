import { FastifyPluginAsync } from 'fastify';
import { getCustomerOrders, getOrderDetails } from '../services/orders.service.js';
import { AccessTokenPayload } from '../types/index.js';

const ordersRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /v1/me/orders
  fastify.get<{
    Querystring: {
      page?: string;
      per_page?: string;
      status?: string;
    };
  }>('/orders', async (request, reply) => {
    const user = request.user as AccessTokenPayload | undefined;
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const page = parseInt(request.query.page || '1', 10);
    const perPage = Math.min(parseInt(request.query.per_page || '20', 10), 100); // Max 100
    const status = request.query.status || 'any';

    try {
      const result = await getCustomerOrders(
        fastify,
        user.wooCustomerId,
        page,
        perPage,
        status
      );

      return reply.code(200).send({
        orders: result.orders,
        pagination: {
          page,
          per_page: perPage,
          total: result.total,
          pages: result.pages,
        },
      });
    } catch (error: unknown) {
      fastify.log.error({ err: error }, 'Error fetching orders');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.code(500).send({ 
        error: 'Failed to fetch orders',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      });
    }
  });

  // GET /v1/me/orders/:orderId
  fastify.get<{
    Params: {
      orderId: string;
    };
  }>('/orders/:orderId', async (request, reply) => {
    const user = request.user as AccessTokenPayload | undefined;
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const orderId = parseInt(request.params.orderId, 10);
    if (isNaN(orderId)) {
      return reply.code(400).send({ error: 'Invalid order ID' });
    }

    try {
      const order = await getOrderDetails(fastify, orderId);

      if (!order) {
        return reply.code(404).send({ error: 'Order not found' });
      }

      // Verify order belongs to user (check customer ID or email)
      // Note: WooCommerce order might not have direct customer ID, so we check email
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orderEmail = (order.billing as any)?.email || '';
      if (orderEmail.toLowerCase() !== user.email.toLowerCase()) {
        return reply.code(403).send({ error: 'Order does not belong to this user' });
      }

      return reply.code(200).send(order);
    } catch (error: unknown) {
      fastify.log.error({ err: error }, 'Error fetching order details');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.code(500).send({ 
        error: 'Failed to fetch order details',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      });
    }
  });
};

export default ordersRoutes;
