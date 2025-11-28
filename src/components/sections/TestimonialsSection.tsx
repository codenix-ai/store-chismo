'use client';

import { Star } from 'lucide-react';
import { useStore } from '@/components/StoreProvider';

interface TestimonialsSectionProps {
  title?: string;
  subtitle?: string;
  items?: Array<{
    id: string;
    name: string;
    role?: string;
    rating: number;
    comment: string;
  }>;
}

export function TestimonialsSection({
  title = 'Lo que dicen nuestros clientes',
  subtitle = 'La confianza de empresas líderes',
  items = [],
}: TestimonialsSectionProps) {
  const { store } = useStore();

  const getColorWithOpacity = (color: string, opacity: number) => {
    if (!color) return `rgba(37, 99, 235, ${opacity})`;
    return `${color}${Math.round(opacity * 255)
      .toString(16)
      .padStart(2, '0')}`;
  };

  return (
    <section
      className="py-12 sm:py-20 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${getColorWithOpacity(
          store?.primaryColor || '#2563eb',
          0.05
        )} 0%, ${getColorWithOpacity(store?.accentColor || '#60a5fa', 0.05)} 100%)`,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 font-montserrat mb-3 sm:mb-4 px-4">
            {title}
          </h2>
          {subtitle && <p className="text-base sm:text-lg text-gray-600 px-4">{subtitle}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {items.map(testimonial => (
            <div
              key={testimonial.id}
              className="bg-white p-6 sm:p-8 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center mb-3 sm:mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6 italic leading-relaxed">
                &ldquo;{testimonial.comment}&rdquo;
              </blockquote>
              <div className="flex items-center">
                <div>
                  <div className="font-semibold text-gray-900 text-sm sm:text-base">{testimonial.name}</div>
                  {testimonial.role && <div className="text-xs sm:text-sm text-gray-500">{testimonial.role}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
