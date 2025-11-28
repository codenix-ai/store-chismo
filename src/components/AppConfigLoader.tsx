'use client';

import { gql, useQuery } from '@apollo/client';
import { ReactNode } from 'react';
import { StoreProvider } from './StoreProvider';

const GET_STORE_CONFIG = gql`
  query GetStore($storeId: String!) {
    store(storeId: $storeId) {
      id
      storeId
      name
      primaryColor
      secondaryColor
      accentColor
      backgroundColor
      textColor
      description
      logoUrl
      email
      phone
      address
      city
      department
      country
      businessType
      taxId
      businessName
      facebookUrl
      instagramUrl
      twitterUrl
      youtubeUrl
      tiktokUrl
      whatsappNumber
      platform
      shopUrl
      status
      currency
      language
      timezone
      isActive
      maintenanceMode
      metaTitle
      metaDescription
      metaKeywords
      createdAt
      updatedAt
    }
  }
`;

export function AppConfigLoader({ children }: { children: ReactNode }) {
  const { loading, error, data } = useQuery(GET_STORE_CONFIG, {
    variables: { storeId: process.env.NEXT_PUBLIC_STORE_ID },
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          {/* Modern spinning loader */}
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <div
              className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto"
              style={{
                animationDirection: 'reverse',
                animationDuration: '1.5s',
              }}
            ></div>
          </div>

          {/* Loading text with pulse animation */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-800 animate-pulse">Cargando tienda...</h2>
            <p className="text-gray-600 text-sm">Configurando tu experiencia personalizada</p>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center space-x-1 mt-6">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }
  if (error || !data?.store) {
    console.error('Error fetching store config:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error al cargar la configuración</h2>
          <p className="text-gray-600 text-sm mb-4">
            No pudimos cargar la configuración de la tienda. Por favor, intenta recargar la página.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Recargar página
          </button>
        </div>
      </div>
    );
  }

  return <StoreProvider initialStore={data.store}>{children}</StoreProvider>;
}
