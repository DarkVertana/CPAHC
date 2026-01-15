import { FastifyPluginAsync } from 'fastify';
import { getCustomerSubscriptions } from '../services/subscriptions.service.js';
import { AccessTokenPayload } from '../types/index.js';

const subscriptionsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /v1/me/subscriptions
  fastify.get('/subscriptions', async (request, reply) => {
    const user = request.user as AccessTokenPayload | undefined;
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    try {
      const subscriptions = await getCustomerSubscriptions(fastify, user.wooCustomerId);

      return reply.code(200).send({
        subscriptions,
        count: subscriptions.length,
      });
    } catch (error: unknown) {
      fastify.log.error({ err: error }, 'Error fetching subscriptions');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.code(500).send({ 
        error: 'Failed to fetch subscriptions',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      });
    }
  });
};

export default subscriptionsRoutes;
