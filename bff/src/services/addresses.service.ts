import { FastifyInstance } from 'fastify';

export interface Address {
  first_name?: string;
  last_name?: string;
  company?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  email?: string;
  phone?: string;
}

export interface AddressesResponse {
  billing: Address;
  shipping: Address;
}

/**
 * Get customer addresses from WooCommerce
 */
export async function getCustomerAddresses(
  fastify: FastifyInstance,
  customerId: number
): Promise<AddressesResponse> {
  const customer = await fastify.woo.get(`/customers/${customerId}`) as { billing?: Address; shipping?: Address };
  
  return {
    billing: customer.billing || {},
    shipping: customer.shipping || {},
  };
}

/**
 * Update customer addresses in WooCommerce
 */
export async function updateCustomerAddresses(
  fastify: FastifyInstance,
  customerId: number,
  billing?: Partial<Address>,
  shipping?: Partial<Address>
): Promise<AddressesResponse> {
  const updateData: { billing?: Partial<Address>; shipping?: Partial<Address> } = {};
  
  if (billing) {
    updateData.billing = billing;
  }
  
  if (shipping) {
    updateData.shipping = shipping;
  }

  const updated = await fastify.woo.put(`/customers/${customerId}`, updateData) as { billing?: Address; shipping?: Address };
  
  return {
    billing: updated.billing || {},
    shipping: updated.shipping || {},
  };
}
