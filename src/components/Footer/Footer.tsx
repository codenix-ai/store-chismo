"use client";

import Link from "next/link";
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Music,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { useStore } from "@/components/StoreProvider";
import { resolveImageUrl } from "@/lib/image";
import { gql, useQuery } from "@apollo/client";

const GET_POLICIES = gql`
  query GetPolicies($storeId: String!) {
    storePolicies(storeId: $storeId) {
      id
      type
      title
      content
    }
  }
`;

const policyRoutes: Record<string, { path: string; label: string }> = {
  PRIVACY_POLICY: { path: "/privacidad", label: "Política de Privacidad" },
  TERMS_CONDITIONS: { path: "/terms", label: "Términos y Condiciones" },
  RETURN_POLICY: {
    path: "/politica-devoluciones",
    label: "Política de Devoluciones",
  },
  SHIPPING_POLICY: { path: "/politica-envios", label: "Política de Envíos" },
  COOKIE_POLICY: { path: "/politicas-cookies", label: "Políticas de Cookies" },
};

export function Footer() {
  const { store } = useStore();

  const { data } = useQuery(GET_POLICIES, {
    variables: { storeId: store?.id || "" },
    skip: !store?.id,
  });

  const policies = data?.storePolicies || [];

  const policyLinks = policies
    .filter((p: any) => policyRoutes[p.type])
    .map((p: any) => ({
      ...policyRoutes[p.type],
    }));

  const socialLinks = [
    { name: "Facebook", icon: Facebook, url: store?.facebookUrl },
    { name: "Instagram", icon: Instagram, url: store?.instagramUrl },
    { name: "Twitter", icon: Twitter, url: store?.twitterUrl },
    { name: "YouTube", icon: Youtube, url: store?.youtubeUrl },
    { name: "TikTok", icon: Music, url: store?.tiktokUrl },
  ].filter((link) => link.url);

  return (
    <footer
      className="mt-auto text-white"
      style={{ backgroundColor: store?.primaryColor || "#2563eb" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              {store?.name || "EmprendyUp Store"}
            </h3>
            <p className="text-sm opacity-80">
              {store?.description ||
                "Tu tienda de confianza para productos de calidad con el mejor servicio al cliente."}
            </p>
            {store?.logoUrl && (
              <img
                src={resolveImageUrl(store.logoUrl)}
                alt={store.name || "Logo"}
                className="h-8 w-auto"
              />
            )}
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Enlaces Rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/products"
                  className="hover:opacity-80 transition-opacity"
                >
                  Productos
                </Link>
              </li>
              <li>
                <Link
                  href="/favorites"
                  className="hover:opacity-80 transition-opacity"
                >
                  Favoritos
                </Link>
              </li>
              <li>
                <Link
                  href="/cart"
                  className="hover:opacity-80 transition-opacity"
                >
                  Carrito
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className="hover:opacity-80 transition-opacity"
                >
                  Soporte
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contacto</h3>
            <div className="space-y-2 text-sm">
              {store?.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>{store.phone}</span>
                </div>
              )}
              {store?.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>{store.email}</span>
                </div>
              )}
              {store?.address && (
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 mt-0.5" />
                  <div>
                    <div>{store.address}</div>
                    {(store.city || store.department) && (
                      <div className="opacity-80">
                        {store.city}
                        {store.city && store.department && ", "}
                        {store.department}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Síguenos</h3>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <Link
                  key={social.name}
                  href={social.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-white/20">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm opacity-80">
              © {new Date().getFullYear()}{" "}
              {store?.businessName || store?.name || "EmprendyUp Store"}. Todos
              los derechos reservados.
            </div>
            <div className="flex space-x-6 text-sm">
              {policyLinks.map((policy: any) => (
                <Link
                  key={policy.path}
                  href={policy.path}
                  className="hover:opacity-80 transition-opacity"
                >
                  {policy.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
