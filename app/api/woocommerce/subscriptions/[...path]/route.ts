import { NextRequest } from 'next/server';

/**
 * Catch-all route for incorrect subscription API paths
 * 
 * This handles cases where the Flutter app incorrectly appends paths like /wp-json/wc/v3
 * to the subscriptions endpoint. It redirects to the correct endpoint while preserving query parameters.
 */
export async function GET(request: NextRequest) {
  // Extract query parameters (especially email) from the original request
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  
  // Build the correct URL path
  const baseUrl = url.origin;
  const correctPath = '/api/woocommerce/subscriptions';
  
  // Preserve all query parameters
  const correctUrl = new URL(correctPath, baseUrl);
  searchParams.forEach((value, key) => {
    correctUrl.searchParams.set(key, value);
  });
  
  // Use Next.js rewrite to internally forward to the correct route
  // This preserves headers and doesn't expose the redirect to the client
  const rewriteUrl = new URL(correctPath + correctUrl.search, request.url);
  const rewriteRequest = new NextRequest(rewriteUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });
  
  // Import and call the main route handler
  const { GET: mainGetHandler } = await import('../route');
  return mainGetHandler(rewriteRequest);
}

