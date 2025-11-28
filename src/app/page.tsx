import { Metadata } from 'next';
import Layout from '@/components/Layout/Layout';
import { HeroBanner } from '@/components/HeroBanner';
import {
  AboutSection,
  MissionSection,
  FeaturedProductsSection,
  FeaturesSection,
  TestimonialsSection,
  ContactSection,
} from '@/components/sections';
import { getStoreData } from '@/lib/getStoreData';

export async function generateMetadata(): Promise<Metadata> {
  const storeId = process.env.NEXT_PUBLIC_STORE_ID || 'default-store';
  const { store, siteConfig } = await getStoreData(storeId);

  const title = siteConfig?.seo?.title || store?.metaTitle || store?.name || 'EmprendyUp Store';
  const description = siteConfig?.seo?.description || store?.metaDescription || 'Dotaciones industriales de calidad';
  const keywords = siteConfig?.seo?.keywords?.join(', ') || store?.metaKeywords;

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      images: [
        {
          url: siteConfig?.branding?.logo?.url || '/assets/default-og-image.jpg',
          width: 1200,
          height: 630,
          alt: siteConfig?.branding?.name || store?.name || 'EmprendyUp Store',
        },
      ],
    },
  };
}

export default async function HomePage() {
  const storeId = process.env.NEXT_PUBLIC_STORE_ID || 'default-store';
  const { siteConfig } = await getStoreData(storeId);

  // Get images from siteConfig gallery or use fallback images
  const imageA = siteConfig?.gallery?.images?.[0]?.id || '/assets/img2.png';
  const imageB = siteConfig?.gallery?.images?.[1]?.id || '/assets/img1.png';
  const imageC = siteConfig?.gallery?.images?.[2]?.id || '/assets/img3.png';
  const imageD = siteConfig?.gallery?.images?.[3]?.id || '/assets/img4.png';

  // Prepare hero title and subtitle from siteConfig
  const heroTitle = siteConfig?.hero?.title ? (
    <>
      {siteConfig.hero.title.split('\n').map((line, i) => (
        <span key={i}>
          {line}
          {i < siteConfig.hero.title.split('\n').length - 1 && <br />}
        </span>
      ))}
    </>
  ) : undefined;

  const heroSubtitle = siteConfig?.hero?.subtitle ? (
    <>
      {siteConfig.hero.subtitle.split('\n').map((line, i, arr) => (
        <span key={i}>
          {line}
          {i < arr.length - 1 && <br />}
        </span>
      ))}
    </>
  ) : undefined;

  return (
    <Layout>
      <div className="space-y-12">
        {/* Hero Section - use siteConfig hero data */}
        <HeroBanner
          title={heroTitle}
          subtitle={heroSubtitle}
          imageA={siteConfig?.hero?.backgroundImage?.id || imageA}
          imageAlt={siteConfig?.hero?.backgroundImage?.alt}
          buttonText={siteConfig?.hero?.buttons?.[0]?.text}
          buttonAction={siteConfig?.hero?.buttons?.[0]?.action}
        />

        {/* About Section - use siteConfig about data */}
        <AboutSection
          imageA={imageA}
          imageB={imageB}
          title={siteConfig?.about?.title}
          paragraphs={siteConfig?.about?.paragraphs}
          stats={siteConfig?.about?.stats}
        />

        {/* Mission Section */}
        <MissionSection imageC={imageC} />

        {/* Featured Products Section */}
        <FeaturedProductsSection />

        {/* Features Section */}
        <FeaturesSection />

        {/* Testimonials Section - use siteConfig testimonials data */}
        <TestimonialsSection
          title={siteConfig?.testimonials?.title}
          subtitle={siteConfig?.testimonials?.subtitle}
          items={siteConfig?.testimonials?.items}
        />

        {/* Contact Section - use siteConfig contact data */}
        <ContactSection
          imageD={imageD}
          title={siteConfig?.contact?.title}
          subtitle={siteConfig?.contact?.subtitle}
          address={siteConfig?.contact?.address}
          phone={siteConfig?.contact?.phone}
          email={siteConfig?.contact?.email}
          hours={siteConfig?.contact?.hours}
          social={siteConfig?.contact?.social}
        />
      </div>
    </Layout>
  );
}
