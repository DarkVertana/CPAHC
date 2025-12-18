import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateApiKey } from '@/lib/middleware';

/**
 * Get WooCommerce Orders by Customer Email Endpoint
 * 
 * This endpoint retrieves order data from WooCommerce based on the user's email.
 * 
 * Query Parameters:
 * - email: User email (required) - matches the wp_user_email from Flutter app
 * 
 * Security:
 * - Requires valid API key in request headers
 * - API key can be sent as 'X-API-Key' header or 'Authorization: Bearer <key>'
 * 
 * Returns:
 * - List of orders for the specified customer email
 */
export async function GET(request: NextRequest) {
  try {
    // Validate API key
    let apiKey;
    try {
      apiKey = await validateApiKey(request);
    } catch (apiKeyError) {
      console.error('API key validation error:', apiKeyError);
      return NextResponse.json(
        { error: 'API key validation failed', details: process.env.NODE_ENV === 'development' ? (apiKeyError instanceof Error ? apiKeyError.message : 'Unknown error') : undefined },
        { status: 500 }
      );
    }
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Unauthorized. Valid API key required.' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    // Validate email parameter
    if (!email) {
      return NextResponse.json(
        { error: 'Email query parameter is required' },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Get WooCommerce settings from database
    const settings = await prisma.settings.findUnique({
      where: { id: 'settings' },
    });

    if (!settings || !settings.woocommerceApiUrl || !settings.woocommerceApiKey || !settings.woocommerceApiSecret) {
      return NextResponse.json(
        { error: 'WooCommerce API credentials are not configured. Please configure them in the admin settings.' },
        { status: 500 }
      );
    }

    // Prepare WooCommerce API URL
    // Remove trailing slash if present and ensure proper endpoint
    const apiUrl = settings.woocommerceApiUrl.replace(/\/$/, '');

    // Create Basic Auth header for WooCommerce API
    // WooCommerce uses Consumer Key as username and Consumer Secret as password
    const authString = Buffer.from(
      `${settings.woocommerceApiKey}:${settings.woocommerceApiSecret}`
    ).toString('base64');

    const authHeaders = {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/json',
    };

    // First, try to get customer by email to get customer ID
    // This ensures we can fetch orders reliably
    const customersUrl = new URL(`${apiUrl}/customers`);
    customersUrl.searchParams.append('email', normalizedEmail);
    customersUrl.searchParams.append('per_page', '1');

    const customersResponse = await fetch(customersUrl.toString(), {
      method: 'GET',
      headers: authHeaders,
    });

    let customerId: number | null = null;

    if (customersResponse.ok) {
      const customers = await customersResponse.json();
      const customersArray = Array.isArray(customers) ? customers : [customers];
      if (customersArray.length > 0 && customersArray[0].id) {
        customerId = customersArray[0].id;
      }
    }

    // Fetch orders from WooCommerce API
    // Use customer ID if available, otherwise try with email
    const ordersUrl = new URL(`${apiUrl}/orders`);
    if (customerId) {
      ordersUrl.searchParams.append('customer', customerId.toString());
    } else {
      // Fallback: try with email (some WooCommerce versions support this)
      ordersUrl.searchParams.append('customer', normalizedEmail);
    }
    ordersUrl.searchParams.append('per_page', '100'); // Get up to 100 orders

    const woocommerceResponse = await fetch(ordersUrl.toString(), {
      method: 'GET',
      headers: authHeaders,
    });

    if (!woocommerceResponse.ok) {
      const errorText = await woocommerceResponse.text();
      console.error('WooCommerce API error:', {
        status: woocommerceResponse.status,
        statusText: woocommerceResponse.statusText,
        error: errorText,
      });

      return NextResponse.json(
        {
          error: 'Failed to fetch orders from WooCommerce',
          details: process.env.NODE_ENV === 'development' 
            ? `WooCommerce API returned ${woocommerceResponse.status}: ${woocommerceResponse.statusText}` 
            : undefined,
        },
        { status: woocommerceResponse.status || 500 }
      );
    }

    const orders = await woocommerceResponse.json();

    // Handle case where WooCommerce returns a single order object instead of array
    const ordersArray = Array.isArray(orders) ? orders : [orders];

    return NextResponse.json({
      success: true,
      email: normalizedEmail,
      count: ordersArray.length,
      orders: ordersArray,
    });
  } catch (error) {
    console.error('Get WooCommerce orders error:', error);
    
    // Return detailed error in development, generic in production
    const errorMessage = process.env.NODE_ENV === 'development' && error instanceof Error
      ? error.message
      : 'An error occurred while fetching orders from WooCommerce';

    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' && error instanceof Error
          ? error.stack
          : undefined
      },
      { status: 500 }
    );
  }
}

