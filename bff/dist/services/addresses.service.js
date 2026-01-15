/**
 * Get customer addresses from WooCommerce
 */
export async function getCustomerAddresses(fastify, customerId) {
    const customer = await fastify.woo.get(`/customers/${customerId}`);
    return {
        billing: customer.billing || {},
        shipping: customer.shipping || {},
    };
}
/**
 * Update customer addresses in WooCommerce
 */
export async function updateCustomerAddresses(fastify, customerId, billing, shipping) {
    const updateData = {};
    if (billing) {
        updateData.billing = billing;
    }
    if (shipping) {
        updateData.shipping = shipping;
    }
    const updated = await fastify.woo.put(`/customers/${customerId}`, updateData);
    return {
        billing: updated.billing || {},
        shipping: updated.shipping || {},
    };
}
//# sourceMappingURL=addresses.service.js.map