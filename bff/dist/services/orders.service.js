/**
 * Get paginated orders for a customer
 */
export async function getCustomerOrders(fastify, customerId, page = 1, perPage = 20, status) {
    const params = {
        customer: customerId,
        per_page: perPage,
        page: page,
        orderby: 'date',
        order: 'desc',
    };
    if (status && status !== 'any') {
        params.status = status;
    }
    const orders = await fastify.woo.get('/orders', params);
    // Get pagination info from response headers if available
    // For now, we'll return what we got
    const ordersArray = Array.isArray(orders) ? orders : [orders];
    // Enrich orders with product images
    const enrichedOrders = await Promise.all(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ordersArray.map(async (order) => {
        const enrichedItems = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (order.line_items || []).map(async (item) => {
            let image = null;
            // Try to get product image
            if (item.product_id) {
                try {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const product = await fastify.woo.get(`/products/${item.product_id}`);
                    if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
                        image = product.images[0].src;
                    }
                }
                catch {
                    // Product not found or error - continue without image
                }
            }
            return {
                id: item.id,
                name: item.name || 'Unknown Product',
                quantity: item.quantity || 0,
                price: item.price || '0',
                subtotal: item.subtotal || '0',
                total: item.total || '0',
                sku: item.sku || '',
                image,
                product_id: item.product_id || null,
                variation_id: item.variation_id || null,
            };
        }));
        return {
            id: order.id,
            number: order.number || String(order.id),
            status: order.status || 'unknown',
            date_created: order.date_created || order.date_created_gmt || '',
            date_modified: order.date_modified || order.date_modified_gmt || null,
            date_completed: order.date_completed || order.date_completed_gmt || null,
            date_paid: order.date_paid || order.date_paid_gmt || null,
            total: order.total || '0',
            currency: order.currency || 'USD',
            items: enrichedItems,
            billing: order.billing || null,
            shipping: order.shipping || null,
        };
    }));
    return {
        orders: enrichedOrders,
        total: enrichedOrders.length,
        pages: Math.ceil(enrichedOrders.length / perPage),
    };
}
/**
 * Get single order details
 */
export async function getOrderDetails(fastify, orderId) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const order = await fastify.woo.get(`/orders/${orderId}`);
        // Enrich with product images
        const enrichedItems = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (order?.line_items || []).map(async (item) => {
            let image = null;
            if (item.product_id) {
                try {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const product = await fastify.woo.get(`/products/${item.product_id}`);
                    if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
                        image = product.images[0].src;
                    }
                }
                catch {
                    // Continue without image
                }
            }
            return {
                id: item.id,
                name: item.name || 'Unknown Product',
                quantity: item.quantity || 0,
                price: item.price || '0',
                subtotal: item.subtotal || '0',
                total: item.total || '0',
                sku: item.sku || '',
                image,
                product_id: item.product_id || null,
                variation_id: item.variation_id || null,
            };
        }));
        return {
            id: order?.id,
            number: order?.number || String(order?.id),
            status: order?.status || 'unknown',
            date_created: order?.date_created || order?.date_created_gmt || '',
            date_modified: order?.date_modified || order?.date_modified_gmt || null,
            date_completed: order?.date_completed || order?.date_completed_gmt || null,
            date_paid: order?.date_paid || order?.date_paid_gmt || null,
            total: order?.total || '0',
            currency: order?.currency || 'USD',
            items: enrichedItems,
            billing: order?.billing || null,
            shipping: order?.shipping || null,
        };
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=orders.service.js.map