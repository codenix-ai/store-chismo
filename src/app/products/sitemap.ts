import { MetadataRoute } from 'next'
import { gql } from '@apollo/client'
import { apolloClient } from '@/lib/apollo'

const GET_PRODUCTS_WITH_DETAILS = gql`
  query GetProductsForSitemap {
    products {
      id
      title
      description
      available
      updatedAt
      createdAt
      images {
        url
      }
    }
  }
`

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://pawis.com.co'
  
  try {
    const { data } = await apolloClient.query({
      query: GET_PRODUCTS_WITH_DETAILS,
      errorPolicy: 'ignore',
      fetchPolicy: 'no-cache',
    })

    if (data?.products) {
      return data.products
        .filter((product: any) => product.available !== false) // Only include available products
        .map((product: any) => ({
          url: `${baseUrl}/products/${product.id}`,
          lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(product.createdAt || Date.now()),
          changeFrequency: 'weekly' as const,
          priority: 0.8, // High priority for products
          // Additional metadata for better SEO
          images: product.images?.map((image: any) => ({
            url: `https://emprendyup-images.s3.us-east-1.amazonaws.com/${image.url}`,
            title: product.title,
            caption: product.description || `${product.title} - Tejidos de Punto Colombia`,
          })) || [],
        }))
    }
  } catch (error) {
    console.error('Error generating products sitemap:', error)
  }
  
  return []
}