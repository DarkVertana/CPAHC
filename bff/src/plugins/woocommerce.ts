import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

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

const woocommercePlugin: FastifyPluginAsync<WooCommercePluginOptions> = async (
  fastify,
  options
) => {
  const { baseUrl, consumerKey, consumerSecret } = options;

  // Validate configuration
  if (!baseUrl || !consumerKey || !consumerSecret) {
    throw new Error('WooCommerce API credentials are not configured');
  }

  // Prepare WooCommerce API URL
  let apiUrl = baseUrl.replace(/\/$/, '');
  
  if (!apiUrl.includes('/wp-json/wc/')) {
    const base = apiUrl.replace(/\/wp-json.*$/, '');
    apiUrl = `${base}/wp-json/wc/v3`;
  }
  
  if (!apiUrl.includes('/wp-json/wc/')) {
    throw new Error('Invalid WooCommerce API URL format');
  }

  // Create Basic Auth header
  const authString = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  
  const defaultHeaders = {
    'Authorization': `Basic ${authString}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Helper function to build URL with query params
  function buildUrl(endpoint: string, params?: Record<string, string | number>): string {
    const url = new URL(`${apiUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }
    
    return url.toString();
  }

  // Decorate Fastify with WooCommerce client
  fastify.decorate('woo', {
    async get(endpoint: string, params?: Record<string, string | number>): Promise<unknown> {
      const url = buildUrl(endpoint, params);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: defaultHeaders,
      });

      if (!response.ok) {
        // Try v1 endpoint if v3 fails
        if (response.status === 404 && apiUrl.includes('/wc/v3')) {
          const v1Url = url.replace('/wc/v3', '/wc/v1');
          const v1Response = await fetch(v1Url, {
            method: 'GET',
            headers: defaultHeaders,
          });
          
          if (!v1Response.ok) {
            throw new Error(`WooCommerce API returned ${v1Response.status}: ${v1Response.statusText}`);
          }
          
          const contentType = v1Response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            return await v1Response.json();
          }
        }
        
        const errorText = await response.text();
        throw new Error(`WooCommerce API returned ${response.status}: ${errorText.substring(0, 200)}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('WooCommerce API returned invalid response format');
      }

      return await response.json();
    },

    async put(endpoint: string, data: unknown): Promise<unknown> {
      const url = buildUrl(endpoint);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: defaultHeaders,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        // Try v1 endpoint if v3 fails
        if (response.status === 404 && apiUrl.includes('/wc/v3')) {
          const v1Url = url.replace('/wc/v3', '/wc/v1');
          const v1Response = await fetch(v1Url, {
            method: 'PUT',
            headers: defaultHeaders,
            body: JSON.stringify(data),
          });
          
          if (!v1Response.ok) {
            const errorText = await v1Response.text();
            throw new Error(`WooCommerce API returned ${v1Response.status}: ${errorText.substring(0, 200)}`);
          }
          
          const contentType = v1Response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            return await v1Response.json();
          }
        }
        
        const errorText = await response.text();
        throw new Error(`WooCommerce API returned ${response.status}: ${errorText.substring(0, 200)}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('WooCommerce API returned invalid response format');
      }

      return await response.json();
    },

    async post(endpoint: string, data: unknown): Promise<unknown> {
      const url = buildUrl(endpoint);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`WooCommerce API returned ${response.status}: ${errorText.substring(0, 200)}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('WooCommerce API returned invalid response format');
      }

      return await response.json();
    },
  });
};

export default fp(woocommercePlugin, {
  name: 'woocommerce',
});
