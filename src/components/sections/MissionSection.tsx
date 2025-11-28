"use client";

import Image from "next/image";
import Link from "next/link";
import { useStore } from "@/components/StoreProvider";

interface MissionSectionProps {
  imageC: string;
}

export function MissionSection({ imageC }: MissionSectionProps) {
  const { store } = useStore();

  return (
    <section
      className="relative text-white py-16 px-6 lg:px-16 my-12"
      style={{ backgroundColor: store?.primaryColor || "#2563eb" }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Imagen */}
        <div className="overflow-hidden aspect-[4/3] rounded-3xl shadow-2xl">
          <Image
            src={imageC}
            alt="Área de trabajo industrial con cuartos fríos"
            width={600}
            height={400}
            className="object-cover object-top w-full h-full"
          />
        </div>

        {/* Texto */}
        <div>
          <h2 className="text-4xl font-extrabold mb-4">
            Nuestra{" "}
            <span
              className="text-cyan-300"
              style={{ color: store?.secondaryColor || "#60a5fa" }}
            >
              Misión
            </span>{" "}
            es tu protección
          </h2>
          <p className="text-lg mb-4">
            Desde nuestros inicios, trabajamos con pasión para ofrecer
            dotaciones industriales de la más alta calidad para cuartos fríos.
            Nos aseguramos de cuidar cada detalle en el proceso, porque la
            seguridad de tu equipo es nuestra mayor prioridad.
          </p>
          <ul className="list-disc list-inside space-y-2 mb-6">
            <li>Materiales térmicos de alta calidad</li>
            <li>Control de calidad riguroso para ambientes extremos</li>
            <li>Compromiso con la seguridad laboral</li>
          </ul>
          <Link
            href="/products"
            className="inline-block px-6 py-3 bg-white font-semibold rounded-full shadow-lg hover:bg-gray-100 transition"
            style={{ color: store?.primaryColor || "#2563eb" }}
          >
            Conoce más
          </Link>
        </div>
      </div>
    </section>
  );
}
