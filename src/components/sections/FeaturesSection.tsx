"use client";

import { Truck, Shield, CreditCard, Headphones } from "lucide-react";
import { useStore } from "@/components/StoreProvider";

const features = [
  {
    icon: Truck,
    title: "Envío Express",
    description: "Entrega en 24-48h en principales ciudades",
    highlight: "Gratis desde $150.000",
  },
  {
    icon: Shield,
    title: "Garantía Total",
    description: "30 días para cambios y devoluciones",
    highlight: "100% Seguro",
  },
  {
    icon: CreditCard,
    title: "Pago Flexible",
    description: "Hasta 12 cuotas sin interés",
    highlight: "Todos los medios",
  },
  {
    icon: Headphones,
    title: "Asesoría Técnica",
    description: "Expertos en dotaciones industriales",
    highlight: "Chat 24/7",
  },
];

export function FeaturesSection() {
  const { store } = useStore();

  const getColorWithOpacity = (color: string, opacity: number) => {
    if (!color) return `rgba(37, 99, 235, ${opacity})`;
    return `${color}${Math.round(opacity * 255)
      .toString(16)
      .padStart(2, "0")}`;
  };

  return (
    <section className="py-12 sm:py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 font-montserrat mb-3 sm:mb-4">
            ¿Por qué Elegir Nuestras Dotaciones?
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            Más que un proveedor, somos tu aliado en protección industrial
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group text-center p-6 sm:p-8 rounded-2xl bg-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
            >
              <div
                className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300"
                style={{
                  backgroundColor: getColorWithOpacity(
                    store?.primaryColor || "#2563eb",
                    0.1
                  ),
                  color: store?.primaryColor || "#2563eb",
                }}
              >
                <feature.icon className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                {feature.title}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-2">
                {feature.description}
              </p>
              <p
                className="text-xs sm:text-sm font-medium"
                style={{ color: store?.primaryColor || "#2563eb" }}
              >
                {feature.highlight}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
