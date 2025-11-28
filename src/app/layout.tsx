import type { Metadata } from 'next';
import { Roboto, Montserrat } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Navbar } from '@/components/Navbar/Navbar';
import { Footer } from '@/components/Footer/Footer';
import { Toaster } from 'react-hot-toast';
import CookieWrapper from '@/components/CookieWrapper';
import { WhatsAppWrapper } from '@/components/WhatsAppWrapper';
import Script from 'next/script';
import { getStoreData } from '@/lib/getStoreData';

const roboto = Roboto({
  variable: '--font-roboto',
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
});

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

export async function generateMetadata(): Promise<Metadata> {
  const storeId = process.env.NEXT_PUBLIC_STORE_ID || 'default-store';
  const { store, siteConfig } = await getStoreData(storeId);

  const title = siteConfig?.seo?.title || store?.metaTitle || store?.name || 'Store';
  const description = siteConfig?.seo?.description || store?.metaDescription || 'Tienda en línea';
  const keywords = siteConfig?.seo?.keywords || [];
  const brandingName = siteConfig?.branding?.name || store?.name || 'Store';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  return {
    title,
    description,
    keywords,
    authors: [{ name: brandingName }],
    creator: brandingName,
    publisher: brandingName,
    category: 'Textiles y Confección',
    classification: 'Business',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: 'es_CO',
      url: siteUrl,
      title,
      description,
      siteName: brandingName,
      images: [
        {
          url: siteConfig?.branding?.logo?.url || '/assets/og-image.png',
          width: 1200,
          height: 630,
          alt: brandingName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [siteConfig?.branding?.logo?.url || '/assets/og-image.png'],
    },
    verification: {
      google: 'your-google-verification-code',
    },
    alternates: {
      canonical: siteUrl,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const storeId = process.env.NEXT_PUBLIC_STORE_ID || 'default-store';
  const { store, siteConfig } = await getStoreData(storeId);

  const brandingName = siteConfig?.branding?.name || store?.name || 'Store';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const logoUrl = siteConfig?.branding?.logo?.url || '/assets/logo.svg';
  const description = siteConfig?.branding?.description || siteConfig?.seo?.description || 'Tienda en línea';
  const phone = siteConfig?.contact?.phone || store?.phone || '';
  const address = siteConfig?.contact?.address;
  const social = siteConfig?.contact?.social;

  const socialLinks = [];
  if (social?.facebook) socialLinks.push(social.facebook);
  if (social?.instagram) socialLinks.push(social.instagram);
  if (social?.twitter) socialLinks.push(social.twitter);
  if (social?.youtube) socialLinks.push(social.youtube);
  if (social?.tiktok) socialLinks.push(social.tiktok);

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: brandingName,
        url: siteUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${siteUrl}${logoUrl}`,
          width: 300,
          height: 100,
        },
        description,
        address: {
          '@type': 'PostalAddress',
          addressCountry: address?.country || 'CO',
          addressLocality: address?.city || 'Colombia',
          addressRegion: address?.state,
          streetAddress: address?.street,
          postalCode: address?.zip,
        },
        contactPoint: [
          {
            '@type': 'ContactPoint',
            telephone: phone,
            contactType: 'sales',
            areaServed: address?.country || 'CO',
            availableLanguage: 'Spanish',
          },
          {
            '@type': 'ContactPoint',
            telephone: phone,
            contactType: 'customer service',
            areaServed: address?.country || 'CO',
            availableLanguage: 'Spanish',
          },
        ],
        sameAs: socialLinks,
      },
      {
        '@type': 'LocalBusiness',
        '@id': `${siteUrl}/#localbusiness`,
        name: brandingName,
        image: `${siteUrl}${siteConfig?.hero?.backgroundImage?.id || '/assets/banner.webp'}`,
        description: description,
        priceRange: '$$',
        servesCuisine: 'Textil',
        address: {
          '@type': 'PostalAddress',
          addressCountry: address?.country || 'CO',
          addressLocality: address?.city,
          addressRegion: address?.state,
          streetAddress: address?.street,
          postalCode: address?.zip,
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: '4.7110',
          longitude: '-74.0721',
        },
        url: siteUrl,
        telephone: phone,
        openingHoursSpecification: siteConfig?.contact?.hours
          ? Object.entries(siteConfig.contact.hours).map(([day, hours]) => ({
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: day.includes('-') ? day.split('-').map(d => d.trim()) : [day],
              opens: hours.split('-')[0]?.trim() || '08:00',
              closes: hours.split('-')[1]?.trim() || '18:00',
            }))
          : [
              {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                opens: '08:00',
                closes: '18:00',
              },
            ],
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: brandingName,
        description: description,
        publisher: {
          '@id': `${siteUrl}/#organization`,
        },
        potentialAction: [
          {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${siteUrl}/products?search={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
          },
        ],
        mainEntity: {
          '@type': 'ItemList',
          '@id': `${siteUrl}/#sitelinks`,
          name: 'Navegación Principal',
          description: 'Enlaces principales del sitio web',
          itemListElement: siteConfig?.navigation?.items?.map((item, index) => ({
            '@type': 'SiteNavigationElement',
            '@id': `${siteUrl}/#nav-${index}`,
            name: item.label,
            description: `Navegar a ${item.label}`,
            url: `${siteUrl}${item.href}`,
            position: index + 1,
          })) || [
            {
              '@type': 'SiteNavigationElement',
              '@id': `${siteUrl}/#nav-products`,
              name: 'Productos',
              description: 'Catálogo completo de productos',
              url: `${siteUrl}/products`,
              position: 1,
            },
            {
              '@type': 'SiteNavigationElement',
              '@id': `${siteUrl}/#nav-contact`,
              name: 'Contacto',
              description: 'Información de contacto',
              url: `${siteUrl}/support`,
              position: 2,
            },
          ],
        },
      },
      {
        '@type': 'ItemList',
        '@id': `${siteUrl}/#products`,
        name: siteConfig?.menu?.title || 'Productos de Confección',
        description: siteConfig?.menu?.subtitle || 'Catálogo de productos textiles y confección',
        itemListElement: siteConfig?.menu?.items?.map((item, index) => ({
          '@type': 'Product',
          name: item.name,
          description: item.description,
          category: item.category,
          position: index + 1,
          offers: {
            '@type': 'Offer',
            price: item.price,
            priceCurrency: 'COP',
          },
        })) || [
          {
            '@type': 'Product',
            name: 'Uniformes Empresariales',
            description: 'Uniformes de alta calidad para empresas',
            category: 'Textiles',
            position: 1,
          },
          {
            '@type': 'Product',
            name: 'Dotaciones Laborales',
            description: 'Dotaciones completas para trabajadores',
            category: 'Textiles',
            position: 2,
          },
        ],
      },
    ],
  };

  // Additional structured data specifically for sitelinks
  const sitelinksData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${siteUrl}/#breadcrumbs`,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: siteUrl,
      },
      ...(siteConfig?.navigation?.items?.slice(1).map((item, index) => ({
        '@type': 'ListItem',
        position: index + 2,
        name: item.label,
        item: `${siteUrl}${item.href}`,
      })) || [
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Productos',
          item: `${siteUrl}/products`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Soporte',
          item: `${siteUrl}/support`,
        },
      ]),
    ],
  };

  return (
    <html lang="es">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(sitelinksData) }} />
        <meta name="geo.region" content={address?.country || 'CO'} />
        <meta name="geo.placename" content={address?.city || 'Colombia'} />
        <meta name="ICBM" content="4.7110, -74.0721" />
        <meta name="business.contact_data.country" content={address?.country || 'Colombia'} />
        <meta name="business.contact_data.region" content={address?.state || 'Cundinamarca'} />
        {/* ePayco Standard Checkout Script */}
        <Script src="https://checkout.epayco.co/checkout.js" strategy="beforeInteractive" />
      </head>
      <body
        className={`${roboto.variable} ${montserrat.variable} font-roboto antialiased min-h-screen flex flex-col text-gray-900 bg-white dark:text-gray-100 dark:bg-slate-900`}
      >
        <Providers>
          <Toaster position="bottom-right" toastOptions={{ duration: 3400 }} />
          {/* <Navbar /> */}
          <main className="flex-1">{children}</main>
          <WhatsAppWrapper />
          {/* <Footer /> */}
          <CookieWrapper />
        </Providers>
      </body>
    </html>
  );
}
