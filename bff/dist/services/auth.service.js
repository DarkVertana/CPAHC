import { prisma } from '../lib/prisma.js';
/**
 * Validate user credentials against WordPress using JWT Auth plugin
 * Calls WordPress JWT endpoint to authenticate and get user data
 */
export async function validateWordPressCredentials(usernameOrEmail, password, wpBaseUrl) {
    try {
        // Call WordPress JWT Auth plugin endpoint
        // WordPress JWT plugin accepts either username or email in the "username" field
        const jwtUrl = `${wpBaseUrl}/wp-json/jwt-auth/v1/token`;
        const response = await fetch(jwtUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: usernameOrEmail, // Can be username or email
                password: password,
            }),
        });
        if (!response.ok) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const errorData = await response.json().catch(() => ({}));
            // eslint-disable-next-line no-console
            console.error('WordPress JWT auth failed:', errorData);
            return null;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await response.json();
        // Check for error in response
        if (data.error || data.code) {
            // eslint-disable-next-line no-console
            console.error('WordPress JWT auth error:', data.error || data.code);
            return null;
        }
        // Extract user data from JWT response
        if (data.user) {
            return {
                id: data.user.id,
                email: data.user.email || usernameOrEmail,
                name: data.user.name || data.user.display_name || data.user.nicename,
                displayName: data.user.display_name || data.user.name || data.user.nicename,
            };
        }
        return null;
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error('WordPress auth validation error:', error);
        return null;
    }
}
/**
 * Get or create WooCommerce customer ID for a user
 */
export async function getWooCommerceCustomerId(email, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
wooClient) {
    try {
        // Try to find customer by email
        const customers = await wooClient.get('/customers', { email, per_page: 1 });
        if (Array.isArray(customers) && customers.length > 0) {
            return parseInt(customers[0].id, 10);
        }
        // If single object returned
        if (customers && customers.id) {
            return parseInt(customers.id, 10);
        }
        return null;
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching WooCommerce customer:', error);
        return null;
    }
}
/**
 * Upsert AppUser from WordPress user data
 */
export async function upsertAppUser(wpUserId, email, name, displayName, _wooCustomerId) {
    const normalizedEmail = email.toLowerCase().trim();
    // Check if user exists
    const existingUser = await prisma.appUser.findUnique({
        where: { wpUserId: String(wpUserId) },
    });
    if (existingUser) {
        // Update last login
        return await prisma.appUser.update({
            where: { id: existingUser.id },
            data: {
                lastLoginAt: new Date(),
                loginCount: existingUser.loginCount + 1,
                status: 'Active',
            },
        });
    }
    // Create new user
    return await prisma.appUser.create({
        data: {
            wpUserId: String(wpUserId),
            email: normalizedEmail,
            name: name || displayName,
            displayName: displayName || name,
            lastLoginAt: new Date(),
            loginCount: 1,
            status: 'Active',
        },
    });
}
//# sourceMappingURL=auth.service.js.map