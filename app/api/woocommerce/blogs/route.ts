import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/middleware';

/**
 * WooCommerce Blogs API Endpoint
 * 
 * GET: Retrieves the latest 2 blog posts from WordPress REST API.
 * 
 * Security:
 * - Requires valid API key in request headers
 * - API key can be sent as 'X-API-Key' header or 'Authorization: Bearer <key>'
 * - Fetches from WordPress REST API: https://alternatehealthclub.com/wp-json/wp/v2/posts
 * - Always returns the 2 most recent blogs ordered by date
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

    // WordPress REST API endpoint
    const WORDPRESS_API_URL = 'https://alternatehealthclub.com/wp-json/wp/v2/posts';
    
    // Fetch latest 2 posts from WordPress
    // WordPress API parameters:
    // - per_page: number of posts to retrieve (2)
    // - orderby: order by date
    // - order: descending (newest first)
    // - status: only published posts
    // - _embed: include embedded resources (featured media, author, etc.)
    const wordpressUrl = new URL(WORDPRESS_API_URL);
    wordpressUrl.searchParams.append('per_page', '2');
    wordpressUrl.searchParams.append('orderby', 'date');
    wordpressUrl.searchParams.append('order', 'desc');
    wordpressUrl.searchParams.append('status', 'publish');
    wordpressUrl.searchParams.append('_embed', '1');

    const wordpressResponse = await fetch(wordpressUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!wordpressResponse.ok) {
      const errorText = await wordpressResponse.text();
      console.error('WordPress API error:', {
        status: wordpressResponse.status,
        statusText: wordpressResponse.statusText,
        error: errorText.substring(0, 500),
      });

      return NextResponse.json(
        {
          error: 'Failed to fetch blogs from WordPress',
          details: process.env.NODE_ENV === 'development' 
            ? `WordPress API returned ${wordpressResponse.status}: ${wordpressResponse.statusText}` 
            : undefined,
        },
        { status: wordpressResponse.status || 500 }
      );
    }

    // Parse WordPress response
    let wordpressPosts;
    try {
      wordpressPosts = await wordpressResponse.json();
    } catch (parseError) {
      console.error('Failed to parse WordPress response:', parseError);
      return NextResponse.json(
        {
          error: 'Failed to parse response from WordPress API',
          details: process.env.NODE_ENV === 'development' && parseError instanceof Error
            ? parseError.message
            : undefined,
        },
        { status: 500 }
      );
    }

    // Handle case where WordPress returns a single post object instead of array
    const postsArray = Array.isArray(wordpressPosts) ? wordpressPosts : [wordpressPosts];

    // Transform WordPress posts to match expected format
    const blogs = postsArray.map((post: any) => {
      // Extract excerpt from WordPress post
      // WordPress provides excerpt.rendered which may contain HTML
      const excerpt = post.excerpt?.rendered || '';
      // Strip HTML tags from excerpt for tagline
      const tagline = excerpt.replace(/<[^>]*>/g, '').trim().substring(0, 200) || '';
      
      // Extract description from content
      // WordPress provides content.rendered which contains full HTML
      const content = post.content?.rendered || '';
      // Strip HTML and get first paragraph or first 500 chars
      const description = content.replace(/<[^>]*>/g, '').trim().substring(0, 500) || '';
      
      // Get featured image URL from embedded media
      let featuredImage = '';
      if (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'][0]) {
        const featuredMedia = post._embedded['wp:featuredmedia'][0];
        featuredImage = featuredMedia.source_url || featuredMedia.media_details?.sizes?.full?.source_url || featuredMedia.media_details?.sizes?.large?.source_url || '';
      }
      
      // Extract tags - WordPress provides tag IDs
      // If _embed is used, tags might be in _embedded['wp:term']
      const tags = post.tags || [];
      
      // Extract tag names from embedded terms if available
      let tagNames: string[] = [];
      if (post._embedded && post._embedded['wp:term']) {
        // wp:term contains both categories and tags
        const allTerms = post._embedded['wp:term'].flat();
        tagNames = allTerms
          .filter((term: any) => term.taxonomy === 'post_tag')
          .map((term: any) => term.name || term.slug);
      }

      return {
        id: post.id?.toString() || '',
        title: post.title?.rendered || post.title || '',
        tagline: tagline,
        description: description,
        tags: tagNames.length > 0 ? tagNames : tags,
        featuredImage: featuredImage,
        createdAt: post.date || post.date_gmt || new Date().toISOString(),
        updatedAt: post.modified || post.modified_gmt || new Date().toISOString(),
        link: post.link || '',
        slug: post.slug || '',
      };
    });

    return NextResponse.json({
      success: true,
      count: blogs.length,
      blogs: blogs,
    });
  } catch (error) {
    console.error('Get WooCommerce blogs error:', error);
    return NextResponse.json(
      { 
        error: 'An error occurred while fetching blogs from WordPress',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500 }
    );
  }
}
