/**
 * Hook para ePayco Standard Checkout
 * Utiliza el checkout estándar de ePayco que es más estable y robusto
 */

"use client";

import { useState, useCallback } from "react";

// Extender la interfaz Window para incluir ePayco
declare global {
  interface Window {
    ePayco: {
      checkout: {
        configure: (config: { key: string; test: boolean }) => {
          open: (data: EpaycoCheckoutData) => void;
        };
      };
    };
  }
}

export interface EpaycoCheckoutData {
  // Parámetros obligatorios
  name: string;
  description: string;
  invoice: string;
  currency: string;
  amount: string;
  country: string;
  test: boolean | string; // Permitir string para forzar sandbox

  // Parámetros opcionales de compra
  tax_base?: string;
  tax?: string;
  tax_ico?: string;
  lang?: string;
  external?: string;
  extra1?: string;
  extra2?: string;
  extra3?: string;

  // URLs de respuesta
  response?: string;
  confirmation?: string;
  accepted?: string;
  rejected?: string;
  pending?: string;

  // Datos del cliente
  name_billing?: string;
  address_billing?: string;
  type_doc_billing?: string;
  mobilephone_billing?: string;
  number_doc_billing?: string;
  email_billing?: string;

  // Métodos de pago deshabilitados
  methodsDisable?: string[];
}

export const useEpaycoStandardCheckout = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCheckout = useCallback(async (checkoutData: EpaycoCheckoutData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Verificar que estamos en el browser
      if (typeof window === "undefined") {
        throw new Error("Este método debe ejecutarse en el navegador");
      }

      // Esperar a que el script de ePayco se cargue (hasta 10 segundos)
      let attempts = 0;
      const maxAttempts = 50; // 10 segundos

      while (!window.ePayco && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        attempts++;
      }

      if (!window.ePayco) {
        throw new Error(
          "El script de ePayco no se cargó correctamente. Verifica tu conexión a internet."
        );
      }

      console.log("✅ Script de ePayco cargado correctamente");

      // USAR TUS CREDENCIALES DE TEST (ahora correctas en .env)
      const publicKey =
        process.env.NEXT_PUBLIC_EPAYCO_PUBLIC_KEY ||
        "57eed8088d6cc4cca90e0b9e6c439124";
      const testMode = true;

      console.log("🧪 CREDENCIALES DE TEST CORRECTAS:");
      console.log("📋 Public Key:", publicKey);
      console.log("✅ Test Mode:", testMode);
      console.log("🎯 Debería ir a SANDBOX ahora");

      // Configuración del handler FORZANDO SANDBOX
      const handler = window.ePayco.checkout.configure({
        key: publicKey, // Credencial SANDBOX específica
        test: true, // SANDBOX FORZADO
      });

      // Datos por defecto
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;

      const defaultData: Partial<EpaycoCheckoutData> = {
        currency: "cop",
        country: "co",
        lang: "es",
        external: "true",
        test: "true", // Como STRING para forzar sandbox
        response: `${baseUrl}/orden-exitosa`,
        confirmation: `${baseUrl}/api/epayco/confirmation`,
        // Parámetros adicionales para forzar sandbox
        extra1: "FORCE_SANDBOX",
        extra2: "TEST_MODE_ENABLED",
        extra3: "SANDBOX_ENVIRONMENT",
      };

      // Combinar datos por defecto con los proporcionados
      const finalData = { ...defaultData, ...checkoutData };

      // Validar y ajustar monto para testing
      const amount = parseInt(finalData.amount || "0");
      if (amount > 100000) {
        console.warn(
          `⚠️ Monto ${amount} muy alto para test, ajustando a 50000`
        );
        finalData.amount = "50000";
        finalData.tax_base = "50000";
        finalData.name = `${finalData.name} (TEST: $50,000)`;
      }

      // FORZAR sandbox mode en múltiples formas
      finalData.test = "true"; // Como string

      console.log("🚀 DATOS ENVIADOS AL SANDBOX:");
      console.log("� Monto:", finalData.amount);
      console.log("🏷️ Nombre:", finalData.name);
      console.log("�📦 Data completa:", finalData);
      console.log("🧪 Test mode:", finalData.test);
      console.log("🔑 Public Key:", publicKey);
      console.log("✅ Configurado para sandbox.epayco.co");

      // Abrir el checkout en SANDBOX
      handler.open(finalData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al abrir el checkout";
      setError(errorMessage);
      console.error("Error en ePayco Standard Checkout:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createOrderCheckout = useCallback(
    async (orderData: {
      orderId: string;
      amount: number;
      tax?: number;
      taxBase?: number;
      description: string;
      customerName?: string;
      customerEmail?: string;
      customerPhone?: string;
      customerDocType?: string;
      customerDocument?: string;
      customerAddress?: string;
    }) => {
      // Ajustar monto para testing si está fuera del rango permitido
      const originalAmount = orderData.amount;
      const testAmount = originalAmount > 100000 ? 50000 : originalAmount; // Max $50,000 para test

      console.log(
        `💰 Monto original: $${originalAmount}, Monto para test: $${testAmount}`
      );

      const checkoutData: EpaycoCheckoutData = {
        // Información de la orden
        name: `Orden #${orderData.orderId} (TEST: $${testAmount})`,
        description: `${orderData.description} - MODO PRUEBA`,
        invoice: orderData.orderId,
        amount: testAmount.toString(),
        tax_base: (testAmount - (orderData.tax || 0)).toString(),
        tax: "0", // Sin impuestos para test
        tax_ico: "0",

        // Configuración
        currency: "cop",
        country: "co",
        lang: "es",
        external: "true",
        test: true, // FORZAR modo test        // URLs
        response: `${window.location.origin}/orden-exitosa?orderId=${orderData.orderId}`,
        confirmation: `${window.location.origin}/api/epayco/confirmation`,

        // Datos del cliente (opcional)
        ...(orderData.customerName && {
          name_billing: orderData.customerName,
          email_billing: orderData.customerEmail,
          mobilephone_billing: orderData.customerPhone,
          type_doc_billing: orderData.customerDocType || "cc",
          number_doc_billing: orderData.customerDocument,
          address_billing: orderData.customerAddress,
        }),

        // Extras
        extra1: orderData.orderId,
        extra2: "emprendyup-store",
        extra3: process.env.NEXT_PUBLIC_STORE_ID,
      };

      return openCheckout(checkoutData);
    },
    [openCheckout]
  );

  return {
    openCheckout,
    createOrderCheckout,
    isLoading,
    error,
  };
};
