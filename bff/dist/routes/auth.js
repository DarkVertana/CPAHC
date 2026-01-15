import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { validateWordPressCredentials, getWooCommerceCustomerId, upsertAppUser, } from '../services/auth.service.js';
import { generateAccessToken } from '../plugins/auth.js';
const authRoutes = async (fastify) => {
    const wpBaseUrl = process.env.WP_BASE_URL || '';
    const refreshTokenExpiresIn = process.env.BFF_JWT_REFRESH_EXPIRES || '30d';
    // POST /v1/auth/login
    fastify.post('/login', async (request, reply) => {
        const { email, username, password, deviceId } = request.body;
        // Accept either email or username (WordPress JWT plugin accepts both)
        const loginIdentifier = email || username;
        if (!loginIdentifier || !password) {
            return reply.code(400).send({ error: 'Email/username and password are required' });
        }
        // Validate WordPress credentials via JWT endpoint
        const wpUser = await validateWordPressCredentials(loginIdentifier, password, wpBaseUrl);
        if (!wpUser) {
            return reply.code(401).send({ error: 'Invalid credentials' });
        }
        // Get WooCommerce customer ID
        const wooCustomerId = await getWooCommerceCustomerId(wpUser.email, fastify.woo);
        if (!wooCustomerId) {
            return reply.code(500).send({ error: 'Unable to find WooCommerce customer' });
        }
        // Upsert AppUser
        const appUser = await upsertAppUser(String(wpUser.id), wpUser.email, wpUser.name, wpUser.displayName, wooCustomerId);
        // Generate access token
        const accessTokenPayload = {
            sub: appUser.id,
            email: appUser.email,
            wooCustomerId: wooCustomerId,
        };
        const accessToken = generateAccessToken(fastify, accessTokenPayload);
        // Generate refresh token (store hashed in DB)
        const refreshTokenPlain = fastify.jwt.sign({ sub: appUser.id, type: 'refresh' }, { expiresIn: refreshTokenExpiresIn });
        const refreshTokenHash = await bcrypt.hash(refreshTokenPlain, 10);
        // Calculate expiration date
        const expiresAt = new Date();
        const days = parseInt(refreshTokenExpiresIn.replace('d', '')) || 30;
        expiresAt.setDate(expiresAt.getDate() + days);
        // Store refresh token
        await prisma.mobileRefreshToken.create({
            data: {
                token: refreshTokenHash,
                appUserId: appUser.id,
                wooCustomerId: wooCustomerId,
                userEmail: appUser.email,
                deviceId: deviceId || null,
                expiresAt: expiresAt,
            },
        });
        const response = {
            accessToken,
            refreshToken: refreshTokenPlain,
            user: {
                id: appUser.id,
                email: appUser.email,
                name: appUser.name || undefined,
                displayName: appUser.displayName || undefined,
            },
        };
        return reply.code(200).send(response);
    });
    // POST /v1/auth/refresh
    fastify.post('/refresh', async (request, reply) => {
        const { refreshToken } = request.body;
        if (!refreshToken) {
            return reply.code(400).send({ error: 'Refresh token is required' });
        }
        // Verify JWT structure (but we'll validate against DB)
        let decoded;
        try {
            decoded = fastify.jwt.verify(refreshToken);
            if (decoded.type !== 'refresh') {
                return reply.code(401).send({ error: 'Invalid token type' });
            }
        }
        catch {
            return reply.code(401).send({ error: 'Invalid or expired refresh token' });
        }
        // Find refresh token in database
        const tokens = await prisma.mobileRefreshToken.findMany({
            where: {
                appUserId: decoded.sub,
                revokedAt: null,
                expiresAt: {
                    gt: new Date(),
                },
            },
            include: {
                appUser: true,
            },
        });
        // Check if any token matches (bcrypt compare)
        let validToken = null;
        for (const tokenRecord of tokens) {
            const isMatch = await bcrypt.compare(refreshToken, tokenRecord.token);
            if (isMatch) {
                validToken = tokenRecord;
                break;
            }
        }
        if (!validToken) {
            return reply.code(401).send({ error: 'Invalid or expired refresh token' });
        }
        // Generate new access token
        const accessTokenPayload = {
            sub: validToken.appUser.id,
            email: validToken.appUser.email,
            wooCustomerId: validToken.wooCustomerId,
        };
        const newAccessToken = generateAccessToken(fastify, accessTokenPayload);
        return reply.code(200).send({
            accessToken: newAccessToken,
        });
    });
    // POST /v1/auth/logout
    fastify.post('/logout', async (request, reply) => {
        const { refreshToken } = request.body;
        if (!refreshToken) {
            return reply.code(400).send({ error: 'Refresh token is required' });
        }
        // Find and revoke refresh token
        const tokens = await prisma.mobileRefreshToken.findMany({
            where: {
                revokedAt: null,
            },
        });
        for (const tokenRecord of tokens) {
            const isMatch = await bcrypt.compare(refreshToken, tokenRecord.token);
            if (isMatch) {
                await prisma.mobileRefreshToken.update({
                    where: { id: tokenRecord.id },
                    data: { revokedAt: new Date() },
                });
                return reply.code(200).send({ success: true, message: 'Logged out successfully' });
            }
        }
        return reply.code(200).send({ success: true, message: 'Token not found or already revoked' });
    });
};
export default authRoutes;
//# sourceMappingURL=auth.js.map