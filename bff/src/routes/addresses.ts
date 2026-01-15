import { FastifyPluginAsync } from 'fastify';
import { getCustomerAddresses, updateCustomerAddresses } from '../services/addresses.service.js';
import { AccessTokenPayload } from '../types/index.js';

const addressesRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /v1/me/addresses
  fastify.get('/addresses', async (request, reply) => {
    const user = request.user as AccessTokenPayload | undefined;
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    try {
      const addresses = await getCustomerAddresses(fastify, user.wooCustomerId);
      
      // Mask sensitive fields in response (for logging, actual response is full)
      return reply.code(200).send(addresses);
    } catch (error: unknown) {
      fastify.log.error({ err: error }, 'Error fetching addresses');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.code(500).send({ 
        error: 'Failed to fetch addresses',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      });
    }
  });

  // PATCH /v1/me/addresses
  fastify.patch<{
    Body: {
      billing?: Partial<{
        first_name: string;
        last_name: string;
        company: string;
        address_1: string;
        address_2: string;
        city: string;
        state: string;
        postcode: string;
        country: string;
        email: string;
        phone: string;
      }>;
      shipping?: Partial<{
        first_name: string;
        last_name: string;
        company: string;
        address_1: string;
        address_2: string;
        city: string;
        state: string;
        postcode: string;
        country: string;
        email: string;
        phone: string;
      }>;
    };
  }>('/addresses', async (request, reply) => {
    const user = request.user as AccessTokenPayload | undefined;
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const { billing, shipping } = request.body;

    if (!billing && !shipping) {
      return reply.code(400).send({ error: 'At least one address (billing or shipping) must be provided' });
    }

    try {
      const updated = await updateCustomerAddresses(
        fastify,
        user.wooCustomerId,
        billing,
        shipping
      );

      return reply.code(200).send(updated);
    } catch (error: unknown) {
      fastify.log.error({ err: error }, 'Error updating addresses');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.code(500).send({ 
        error: 'Failed to update addresses',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      });
    }
  });
};

export default addressesRoutes;
