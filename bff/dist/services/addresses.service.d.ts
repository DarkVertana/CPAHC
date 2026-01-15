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
export declare function getCustomerAddresses(fastify: FastifyInstance, customerId: number): Promise<AddressesResponse>;
/**
 * Update customer addresses in WooCommerce
 */
export declare function updateCustomerAddresses(fastify: FastifyInstance, customerId: number, billing?: Partial<Address>, shipping?: Partial<Address>): Promise<AddressesResponse>;
//# sourceMappingURL=addresses.service.d.ts.map