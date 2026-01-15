import { FastifyPluginAsync } from 'fastify';
import { AccessTokenPayload } from '../types/index.js';
interface AuthPluginOptions {
    jwtSecret: string;
    accessTokenExpiresIn: string;
}
declare const _default: FastifyPluginAsync<AuthPluginOptions>;
export default _default;
export declare function generateAccessToken(fastify: {
    jwt: {
        sign: (payload: string | object | Buffer, options?: {
            expiresIn?: string;
        }) => string;
    };
}, payload: Omit<AccessTokenPayload, 'iat' | 'exp'>): string;
//# sourceMappingURL=auth.d.ts.map