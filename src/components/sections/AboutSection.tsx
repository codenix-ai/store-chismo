'use client';

import Image from 'next/image';
import { useStore } from '@/components/StoreProvider';

interface AboutSectionProps {
  imageA: string;
  imageB: string;
  title?: string;
  paragraphs?: string[];
  stats?: Array<{
    value: string;
    label: string;
  }>;
}

export function AboutSection({ imageA, imageB, title, paragraphs, stats }: AboutSectionProps) {
  const { store } = useStore();

  // Default content if not provided
  const defaultTitle = 'Especialistas en Dotaciones Industriales';
  const defaultParagraphs = [
    'Durante más de 5 años, hemos sido pioneros en ofrecer dotaciones industriales de alta calidad para cuartos fríos, combinando protección térmica, durabilidad y comodidad laboral.',
    'Cada prenda es cuidadosamente seleccionada pensando en el trabajador que necesita protección óptima en ambientes de baja temperatura, desde buzos térmicos hasta guantes y gorros de lana especializados.',
  ];

  const getColorWithOpacity = (color: string, opacity: number) => {
    if (!color) return `rgba(37, 99, 235, ${opacity})`;
    return `${color}${Math.round(opacity * 255)
      .toString(16)
      .padStart(2, '0')}`;
  };

  return (
    <section className="py-12 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center mb-16 lg:mb-24">
          <div className="relative group aspect-[4/3] overflow-hidden rounded-3xl shadow-2xl">
            <Image
              src={imageA}
              alt="Dotaciones industriales para cuartos fríos"
              fill
              className="object-cover object-top group-hover:scale-105 transition-transform duration-700 rounded-3xl"
            />
            <div
              className="absolute -bottom-6 -right-6 w-24 h-24 rounded-3xl opacity-20 blur-xl"
              style={{ backgroundColor: store?.primaryColor || '#2563eb' }}
            />
          </div>

          <div className="space-y-6">
            <div>
              <span
                className="inline-block px-4 py-2 rounded-full text-sm font-medium mb-4"
                style={{
                  backgroundColor: getColorWithOpacity(store?.primaryColor || '#2563eb', 0.1),
                  color: store?.primaryColor || '#2563eb',
                }}
              >
                Nuestra Historia
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 font-montserrat mb-6">
                {title || defaultTitle}
              </h2>
            </div>

            {(paragraphs || defaultParagraphs).map((paragraph, index) => (
              <p key={index} className={`${index === 0 ? 'text-lg' : ''} text-gray-600 leading-relaxed`}>
                {paragraph}
              </p>
            ))}

            {stats && stats.length > 0 && (
              <div className="grid grid-cols-3 gap-4 pt-6">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div
                      className="text-2xl sm:text-3xl font-bold mb-1"
                      style={{ color: store?.primaryColor || '#2563eb' }}
                    >
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div className="space-y-6 order-2 lg:order-1">
            <div>
              <span
                className="inline-block px-4 py-2 rounded-full text-sm font-medium mb-4"
                style={{
                  backgroundColor: getColorWithOpacity(store?.accentColor || '#60a5fa', 0.1),
                  color: store?.accentColor || '#60a5fa',
                }}
              >
                Compromiso Industrial
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 font-montserrat mb-6">
                Protección que Marca la Diferencia
              </h2>
            </div>

            <p className="text-lg text-gray-600 leading-relaxed">
              Trabajamos directamente con los mejores fabricantes de equipos industriales para garantizar que cada
              dotación cumpla con los más altos estándares de protección térmica y durabilidad.
            </p>
          </div>

          <div className="relative group order-1 lg:order-2">
            <div className="aspect-[4/3] overflow-hidden rounded-3xl shadow-2xl">
              <Image
                src={imageB}
                alt="Equipos de protección industrial"
                fill
                className="object-cover object-bottom rounded-3xl group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div
              className="absolute -bottom-6 -left-6 w-24 h-24 rounded-3xl opacity-20 blur-xl"
              style={{ backgroundColor: store?.accentColor || '#60a5fa' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
