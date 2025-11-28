import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { SiteConfig } from '@/types/siteConfig';

const GET_STORE_CONFIG = gql`
  query GetStore($storeId: String!) {
    store(storeId: $storeId) {
      id
      storeId
      name
      primaryColor
      secondaryColor
      accentColor
      isActive
      maintenanceMode
      metaTitle
      metaDescription
      metaKeywords
      createdAt
      updatedAt
      siteConfig
    }
  }
`;

export async function getStoreData(storeId: string) {
  const client = new ApolloClient({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'YOUR_GRAPHQL_ENDPOINT',
    cache: new InMemoryCache(),
  });

  try {
    const { data } = await client.query({
      query: GET_STORE_CONFIG,
      variables: { storeId },
    });

    const store = data?.store;
    let siteConfig: SiteConfig | null = null;

    // Parse siteConfig if it exists
    if (store?.siteConfig) {
      try {
        siteConfig = typeof store.siteConfig === 'string' ? JSON.parse(store.siteConfig) : store.siteConfig;
      } catch (error) {
        console.error('Error parsing siteConfig:', error);
      }
    }

    return { store, siteConfig };
  } catch (error) {
    console.error('Error fetching store data:', error);
    return { store: null, siteConfig: null };
  }
}
