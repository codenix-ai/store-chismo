import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://pawis.com.co'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/products',
          '/products/*',
          '/cart',
          '/favorites',
          '/perfil',
          '/support',
          '/auth/*',
        ],
        disallow: [
          '/admin/*',
          '/api/*',
          '/usuarios/*',
          '/*?*', // Query parameters
          '/orden-exitosa', // Private success pages
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/products',
          '/products/*',
          '/cart',
          '/favorites',
          '/perfil',
          '/support',
        ],
        disallow: [
          '/admin/*',
          '/api/*',
          '/usuarios/*',
          '/auth/*',
          '/orden-exitosa',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: [
          '/',
          '/products',
          '/products/*',
        ],
        disallow: [
          '/admin/*',
          '/api/*',
          '/usuarios/*',
          '/auth/*',
          '/cart',
          '/favorites',
          '/perfil',
          '/support',
          '/orden-exitosa',
        ],
      },
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
    ],
    host: baseUrl,
  }
}