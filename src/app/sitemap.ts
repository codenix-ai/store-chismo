import { MetadataRoute } from 'next'
import { gql } from '@apollo/client'
import { apolloClient } from '@/lib/apollo'

const GET_ALL_PRODUCTS = gql`
  query GetAllProducts {
    products {
      id
      title
      updatedAt
    }
  }
`

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://pawis.com.co'
  
  // Static routes with enhanced sitelinks data
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9, // Increased priority for main product page
    },
    {
      url: `${baseUrl}/cart`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6, // Increased for user engagement
    },
    {
      url: `${baseUrl}/favorites`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6, // Increased for user engagement
    },
    {
      url: `${baseUrl}/perfil`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7, // Increased for user accounts
    },
    {
      url: `${baseUrl}/support`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7, // Increased for customer service
    },
    {
      url: `${baseUrl}/orden`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/orden-exitosa`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/auth/signin`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5, // Slightly increased for login
    },
    {
      url: `${baseUrl}/auth/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5, // Slightly increased for registration
    },
    // Admin routes (lower priority, noindex in robots)
    {
      url: `${baseUrl}/admin`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.1,
    },
    {
      url: `${baseUrl}/admin/products`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.1,
    },
    {
      url: `${baseUrl}/admin/orders`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.1,
    },
    {
      url: `${baseUrl}/admin/store`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.1,
    },
    {
      url: `${baseUrl}/admin/usuarios`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.1,
    },
  ]

  // Dynamic product routes
  let productRoutes: MetadataRoute.Sitemap = []
  
  try {
    const { data } = await apolloClient.query({
      query: GET_ALL_PRODUCTS,
      errorPolicy: 'ignore',
      fetchPolicy: 'no-cache',
    })

    if (data?.products) {
      productRoutes = data.products.map((product: any) => ({
        url: `${baseUrl}/products/${product.id}`,
        lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
    }
  } catch (error) {
    console.error('Error fetching products for sitemap:', error)
    // Continue with static routes only if GraphQL fails
  }

  // Category-based routes (enhanced for sitelinks)
  const categoryRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/products?category=uniformes`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8, // High priority for main categories
    },
    {
      url: `${baseUrl}/products?category=dotaciones`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8, // High priority for main categories
    },
    {
      url: `${baseUrl}/products?category=textiles`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8, // High priority for main categories
    },
    {
      url: `${baseUrl}/products?category=camisetas`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/products?category=guantes`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/products?category=gorros`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/products?category=medias`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    // Additional specific product categories for better sitelinks
    {
      url: `${baseUrl}/products?category=empresarial`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/products?category=industrial`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/products?category=cuarto-frio`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ]

  return [...staticRoutes, ...productRoutes, ...categoryRoutes]
}

// Additional sitemap for images (optional)
export async function generateImageSitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://pawis.com.co'
  
  try {
    const { data } = await apolloClient.query({
      query: gql`
        query GetAllProductImages {
          products {
            id
            title
            images {
              url
            }
            updatedAt
          }
        }
      `,
      errorPolicy: 'ignore',
      fetchPolicy: 'no-cache',
    })

    if (data?.products) {
      const imageRoutes: MetadataRoute.Sitemap = []
      
      data.products.forEach((product: any) => {
        product.images?.forEach((image: any, index: number) => {
          if (image.url) {
            imageRoutes.push({
              url: `https://emprendyup-images.s3.us-east-1.amazonaws.com/${image.url}`,
              lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
              changeFrequency: 'monthly',
              priority: 0.4,
            })
          }
        })
      })
      
      return imageRoutes
    }
  } catch (error) {
    console.error('Error generating image sitemap:', error)
  }
  
  return []
}