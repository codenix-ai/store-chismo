"use client";
import Link from "next/link";
import { useStore } from "./StoreProvider";

export default function CookieConsentModal({
  onAccept,
}: {
  onAccept: () => void;
}) {
  const { store } = useStore();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 p-4 md:p-5 rounded-xl shadow-md w-80">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Cookies & Privacidad
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Usamos cookies para mejorar tu experiencia. Al continuar, aceptas
          nuestra{" "}
          <Link
            href="/politica-de-privacidad"
            className="font-medium"
            style={{ color: store?.primaryColor || "#2563eb" }}
          >
            política de privacidad
          </Link>
          .
        </p>
        <button
          onClick={onAccept}
          className="px-4 py-2 text-white rounded-lg transition-colors w-full"
          style={{
            backgroundColor: store?.primaryColor || "#2563eb",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.9";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}
