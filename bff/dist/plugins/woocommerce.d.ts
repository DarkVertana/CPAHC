import { FastifyPluginAsync } from 'fastify';
declare module 'fastify' {
    interface FastifyInstance {
        woo: {
            get: (endpoint: string, params?: Record<string, string | number>) => Promise<unknown>;
            put: (endpoint: string, data: unknown) => Promise<unknown>;
            post: (endpoint: string, data: unknown) => Promise<unknown>;
        };
    }
}
interface WooCommercePluginOptions {
    baseUrl: string;
    consumerKey: string;
    consumerSecret: string;
}
declare const _default: FastifyPluginAsync<WooCommercePluginOptions>;
export default _default;
//# sourceMappingURL=woocommerce.d.ts.map