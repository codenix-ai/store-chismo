import { Metadata } from "next";
import { ApolloClient, InMemoryCache, gql } from "@apollo/client";

const GET_PRODUCTS_BY_STORE = gql`
  query GetProductsByStore($storeId: String!, $page: Int, $pageSize: Int) {
    productsByStore(storeId: $storeId, page: $page, pageSize: $pageSize) {
      items {
        id
        name
        title
        description
        price
        currency
        available
        inStock
        stock
        images {
          id
          url
          order
        }
        colors {
          id
          color
          colorHex
        }
        categories {
          category {
            id
            name
            slug
          }
        }
      }
      total
      page
      pageSize
    }
  }
`;

export async function generateMetadata(): Promise<Metadata> {
  const storeId = process.env.NEXT_PUBLIC_STORE_ID || "default-store";
  const client = new ApolloClient({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "YOUR_GRAPHQL_ENDPOINT",
    cache: new InMemoryCache(),
  });

  try {
    const { data } = await client.query({
      query: GET_PRODUCTS_BY_STORE,
      variables: {
        storeId,
        page: 1,
        pageSize: 20,
      },
      errorPolicy: "ignore",
      fetchPolicy: "no-cache",
    });

    const products = data?.productsByStore?.items || [];
    const totalProducts = data?.productsByStore?.total || 0;

    // Generate keywords from multiple products
    const keywordsGenerated: string[] = [];
    const categoriesSet = new Set<string>();
    const colorsSet = new Set<string>();

    // Extract keywords from all products
    products.forEach((product: any) => {
      // Add title words
      if (product.title || product.name) {
        const title = product.title || product.name;
        const titleWords = title
          .split(/\s+/)
          .map((word: string) => word.toLowerCase().replace(/[^\w\s]/g, ""))
          .filter((word: string) => word.length > 2);
        keywordsGenerated.push(...titleWords);
      }

      // Collect categories
      if (product.categories) {
        product.categories.forEach((cat: any) => {
          if (cat.category?.name) {
            categoriesSet.add(cat.category.name);
          }
        });
      }

      // Collect colors
      if (product.colors) {
        product.colors.forEach((color: any) => {
          if (color.color) {
            colorsSet.add(color.color);
          }
        });
      }
    });

    // Add categories and colors to keywords
    categoriesSet.forEach((category) => keywordsGenerated.push(category));
    colorsSet.forEach((color) => keywordsGenerated.push(`color ${color}`));
    // Remove duplicates and add base keywords
    const uniqueKeywords = [...new Set(keywordsGenerated)];

    const allKeywords = [...uniqueKeywords.slice(0, 15)];

    // Price range calculation
    const prices = products
      .filter((p: any) => p.price && p.price > 0)
      .map((p: any) => p.price);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    // Main image from first product with image
    const productWithImage = products.find(
      (p: any) => p.images && p.images.length > 0
    );
    const imageUrl = productWithImage?.images?.[0]?.url
      ? `https://emprendyup-images.s3.us-east-1.amazonaws.com/${productWithImage.images[0].url}`
      : "/assets/default-products.jpg";

    const title = `Dotaciones Industriales y EPP - ${totalProducts} Productos | EmprendyUp Store`;
    const description = `Descubre nuestro catálogo completo de ${totalProducts} dotaciones industriales y equipos de protección personal. ${
      prices.length > 0
        ? `Precios desde $${minPrice.toLocaleString()} hasta $${maxPrice.toLocaleString()}.`
        : ""
    } Calidad garantizada para tu seguridad laboral.`;
    return {
      title,
      description,
      keywords: allKeywords.join(", "),
      openGraph: {
        title,
        description,
        type: "website",
        url: "https://emprendyup.com/products",
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: "Catálogo de dotaciones industriales y EPP",
          },
        ],
        siteName: "EmprendyUp Store",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [imageUrl],
      },
      alternates: {
        canonical: "https://emprendyup.com/products",
      },
      robots: {
        index: true,
        follow: true,
      },
      other: {
        "product:category": "Dotaciones Industriales",
        "product:availability": "in stock",
        "product:brand": "EmprendyUp",
        "product:retailer": "EmprendyUp Store",
        "product:count": totalProducts.toString(),
        ...(prices.length > 0 && {
          "product:price:range": `${minPrice}-${maxPrice}`,
          "product:price:currency": "COP",
        }),
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Dotaciones Industriales y EPP | EmprendyUp Store",
      description:
        "Catálogo completo de dotaciones industriales y equipos de protección personal. Calidad garantizada para tu seguridad laboral.",
      keywords:
        "dotaciones industriales, EPP, equipos de protección, ropa de trabajo, seguridad industrial, Colombia",
    };
  }
}

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
