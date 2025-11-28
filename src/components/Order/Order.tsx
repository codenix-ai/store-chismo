"use client";
import React, { useState } from "react";
import Image from "next/image";
import { cartService, Cart as CartType, CartItem } from "@/lib/cart";
import { resolveImageUrl } from "@/lib/image";
import { useStore } from "@/components/StoreProvider";
import {
  ChevronDown,
  ChevronRight,
  Link,
  Shield,
  ShieldCheck,
} from "lucide-react";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import crypto from "crypto";
import { useWompiPayment, usePayments } from "@/hooks/usePayments";
import { useStorePaymentConfiguration } from "@/hooks/usePaymentConfiguration";
import { useEpaycoStandardCheckout } from "@/hooks/useEpaycoStandardCheckout";
import { PaymentProvider, PaymentMethod } from "@/types/payment";
import { CREATE_PAYMENT } from "@/lib/graphql/queries";

// Helper functions for Wompi integration
const generatePaymentReference = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `ORDER_${timestamp}_${random}`;
};

// IMPORTANT: In production, this function should be moved to your backend API
// to protect the integrity secret. Create an endpoint like /api/wompi/generate-signature
const generateIntegritySignature = (
  reference: string,
  amountInCents: number,
  currency: string,
  expirationTime: string,
  integritySecret: string
) => {
  // Concatenate according to Wompi documentation:
  // <Reference><Amount><Currency><ExpirationTime><IntegritySecret>
  const concatenatedString = `${reference}${amountInCents}${currency}${expirationTime}${integritySecret}`;
  // Create SHA256 hash
  return crypto.createHash("sha256").update(concatenatedString).digest("hex");
};

const formatAmountInCents = (amount: number) => {
  return Math.round(amount * 100);
};

const getTaxAmount = (subtotal: number) => {
  return Math.round(subtotal * 0.19); // Assuming a fixed 19% tax rate
};

const getExpirationTime = () => {
  const expiration = new Date();
  expiration.setHours(expiration.getHours() + 1); // 1 hour from now
  return expiration.toISOString();
};

// GraphQL mutation to create address
const CREATE_ADDRESS = gql`
  mutation CreateAddress($input: CreateAddressInput!) {
    createAddress(input: $input) {
      id
      name
      street
      city
      department
      postalCode
      phone
      isDefault
      userId
    }
  }
`;

const GET_ADDRESSES_BY_USER = gql`
  query GetAddressesByUser {
    addressesByUser {
      id
      name
      street
      city
      department
      postalCode
      phone
      isDefault
      userId
    }
  }
`;

const CREATE_ORDER = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      id
      status
      total
      subtotal
      tax
      shipping
      createdAt
      items {
        id
        quantity
        price
        productId
        color {
          colorHex
          color
        }
        size {
          size
        }
      }
    }
  }
`;

interface Address {
  id?: string;
  name: string;
  street: string;
  city: string;
  department: string;
  postalCode: string;
  phone: string;
  isDefault: boolean;
}
interface CreateAddressInput {
  name: string;
  street: string;
  city: string;
  department: string;
  postalCode: string;
  phone: string;
  isDefault: boolean;
}
interface OrderItemInput {
  productId: string;
  quantity: number;
  unitPrice: number; // GraphQL input expects "unitPrice"
  productColorId?: string;
  productSizeId?: string;
}
interface CreateOrderInput {
  addressId: string;
  items: OrderItemInput[];
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  storeId?: string; // Optional, some backends require this for product validation
}
interface AccordionStepProps {
  step: number;
  title: string;
  isOpen: boolean;
  isCompleted: boolean;
  isDisabled?: boolean;
  children: React.ReactNode;
  onToggle: () => void;
}

const AccordionStep: React.FC<AccordionStepProps> = ({
  step,
  title,
  isOpen,
  isCompleted,
  isDisabled = false,
  children,
  onToggle,
}) => {
  const { store } = useStore();

  return (
    <div
      className={`border border-gray-200 rounded-lg mb-4 ${
        isDisabled ? "opacity-50" : ""
      }`}
    >
      <button
        onClick={isDisabled ? undefined : onToggle}
        disabled={isDisabled}
        title={isDisabled ? "Completa el paso anterior para continuar" : ""}
        className={`w-full px-6 py-4 flex items-center justify-between text-left transition-colors ${
          isDisabled ? "cursor-not-allowed" : "hover:bg-gray-50"
        }`}
      >
        <div className="flex items-center space-x-4">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
              isCompleted
                ? "bg-green-500"
                : isOpen
                ? store?.primaryColor || "bg-blue-600"
                : isDisabled
                ? "bg-gray-300"
                : "bg-gray-400"
            }`}
            style={
              isOpen && !isCompleted && !isDisabled
                ? { backgroundColor: store?.primaryColor || "#2563eb" }
                : {}
            }
          >
            {isCompleted ? "✓" : step}
          </div>
          <h3
            className={`text-lg font-semibold ${
              isDisabled ? "text-gray-400" : "text-gray-900"
            }`}
          >
            {title}
          </h3>
        </div>
        {isDisabled ? (
          <span className="text-xs text-gray-400 italic"></span>
        ) : isOpen ? (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-500" />
        )}
      </button>
      {isOpen && !isDisabled && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
};

interface OrderSummaryProps {
  cart: CartType;
  store?: any; // Optional for future theming support
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function OrderSummary({ cart, store }: OrderSummaryProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold text-black">Resumen del Pedido</h3>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-medium">
            ${cart.subtotal.toLocaleString("es-CO")}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">IVA (19%):</span>
          <span className="font-medium">
            ${cart.tax.toLocaleString("es-CO")}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Envío:</span>
          <span className="font-medium">
            {cart.shipping === 0
              ? "Gratis"
              : `$${cart.shipping.toLocaleString("es-CO")}`}
          </span>
        </div>
        {cart.shipping === 0 && cart.subtotal >= 150000 && (
          <p className="text-sm text-green-600">
            ¡Envío gratis por compras superiores a $150.000!
          </p>
        )}
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-black">Total:</span>
          <span className="text-xl font-bold text-black">
            ${cart.total.toLocaleString("es-CO")}
          </span>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="mt-6 pt-6 border-t">
        <h4 className="text-sm font-medium text-black mb-3">
          Métodos de Pago Aceptados:
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white p-2 rounded border text-center text-xs font-medium">
            MercadoPago
          </div>
          <div className="bg-white p-2 rounded border text-center text-xs font-medium">
            Wompi
          </div>
          <div className="bg-white p-2 rounded border text-center text-xs font-medium">
            ePayco
          </div>
          <div className="bg-white p-2 rounded border text-center text-xs font-medium">
            Tarjeta
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Order() {
  const [cart, setCart] = useState<CartType>({
    items: [],
    total: 0,
    subtotal: 0,
    tax: 0,
    shipping: 0,
  });
  const { store } = useStore();
  const router = useRouter();
  const { data: session } = useSession();
  const [activeStep, setActiveStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isSubmittingAddress, setIsSubmittingAddress] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  // Payment hooks
  const {
    createWompiPayment,
    loading: paymentLoading,
    error: paymentError,
  } = useWompiPayment();
  const {
    configuration: paymentConfig,
    isWompiEnabled,
    getWompiPublicKey,
  } = useStorePaymentConfiguration();
  const {
    createOrderCheckout: createEpaycoCheckout,
    isLoading: epaycoLoading,
    error: epaycoError,
  } = useEpaycoStandardCheckout();
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [selectedPaymentProvider, setSelectedPaymentProvider] = useState<
    "wompi" | "epayco"
  >("wompi");

  // Generate payment reference on component mount
  React.useEffect(() => {
    setPaymentReference(generatePaymentReference());
  }, []);

  // GraphQL hooks
  const [createAddress] = useMutation(CREATE_ADDRESS);
  const [createOrder] = useMutation(CREATE_ORDER);
  const [createPayment] = useMutation(CREATE_PAYMENT);

  // Query to get user addresses with bearer token validation
  const {
    data: addressesData,
    loading: addressesLoading,
    error: addressesError,
    refetch: refetchAddresses,
  } = useQuery(GET_ADDRESSES_BY_USER, {
    skip: !session, // Skip query if user is not authenticated
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
  });

  // Colombian departments and cities data
  const departments = [
    "Amazonas",
    "Cundinamarca",
    "Antioquia",
    "Arauca",
    "Atlántico",
    "Bolívar",
    "Boyacá",
    "Caldas",
    "Caquetá",
    "Casanare",
    "Cauca",
  ];

  const cities = [
    "Bogotá",
    "Medellín",
    "Cali",
    "Barranquilla",
    "Cúcuta",
    "Bucaramanga",
    "Pereira",
    "Santa Marta",
    "Ibagué",
    "Manizales",
    "Valledupar",
  ];

  // Load cart on component mount
  React.useEffect(() => {
    setCart(cartService.getCart());
  }, []);

  const [address, setAddress] = useState<Address>({
    name: "",
    street: "",
    city: "",
    department: "",
    postalCode: "",
    phone: "",
    isDefault: false,
  });

  const handleStepToggle = (step: number) => {
    // Prevent accessing steps that require previous completion
    if (step === 2 && cart.items.length === 0) {
      alert("Agrega productos al carrito antes de continuar");
      return;
    }

    if (step === 3 && !isAddressCompleted) {
      alert("Completa la información de dirección antes de continuar");
      return;
    }

    setActiveStep(activeStep === step ? 0 : step);
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is authenticated
    if (!session) {
      alert("Debes iniciar sesión para guardar la dirección");
      return;
    }

    // If an existing address is selected, use it
    if (selectedAddressId && !showNewAddressForm) {
      const selectedAddress = addressesData?.addressesByUser?.find(
        (addr: Address) => addr.id === selectedAddressId
      );
      if (selectedAddress) {
        setAddress({
          ...selectedAddress,
          id: selectedAddressId,
        });

        // Mark step as completed and move to next step
        setCompletedSteps([...completedSteps.filter((s) => s !== 2), 2]);
        setActiveStep(3);
        return;
      }
    }

    // Validate new address form
    const isValid =
      address.name &&
      address.street &&
      address.city &&
      address.department &&
      address.phone;

    if (!isValid) {
      alert("Por favor completa todos los campos requeridos");
      return;
    }

    setIsSubmittingAddress(true);

    try {
      // Create address input for GraphQL mutation
      const addressInput = {
        name: address.name,
        street: address.street,
        city: address.city,
        department: address.department,
        postalCode: address.postalCode,
        phone: address.phone,
        isDefault: address.isDefault,
      };

      // Execute the mutation
      const { data } = await createAddress({
        variables: {
          input: addressInput,
        },
      });

      // Update the address state with the returned ID
      setAddress((prev) => ({
        ...prev,
        id: data.createAddress.id,
      }));

      // Select the newly created address
      setSelectedAddressId(data.createAddress.id);

      // Hide new address form and show success
      setShowNewAddressForm(false);

      // Refetch addresses to update the list
      await refetchAddresses();

      // Mark step as completed and move to next step
      setCompletedSteps([...completedSteps.filter((s) => s !== 2), 2]);
      setActiveStep(3);

      toast.success("Dirección guardada exitosamente");
    } catch (error) {
      console.error("Error creating address:", error);

      // More detailed error logging
      if (error instanceof Error) {
        console.error("Error message:", error.message);
      }

      // Handle GraphQL errors
      if ((error as any).graphQLErrors?.length > 0) {
        const gqlError = (error as any).graphQLErrors[0];
        alert(`Error: ${gqlError.message}`);
      } else if ((error as any).networkError) {
        alert("Error de conexión. Verifica tu conexión a internet.");
      } else {
        alert("Error al guardar la dirección. Por favor intenta nuevamente.");
      }
    } finally {
      setIsSubmittingAddress(false);
    }
  };

  const handleAddressSelection = (addressId: string) => {
    setSelectedAddressId(addressId);
    setShowNewAddressForm(false);

    // Clear the new address form when selecting an existing address
    setAddress({
      name: "",
      street: "",
      city: "",
      department: "",
      postalCode: "",
      phone: "",
      isDefault: false,
    });
  };

  const handleNewAddressClick = () => {
    setShowNewAddressForm(true);
    setSelectedAddressId("");
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is authenticated
    if (!session) {
      alert("Debes iniciar sesión para completar la orden");
      return;
    }

    // Check if address is saved or selected
    const addressId = address.id || selectedAddressId;
    if (!addressId) {
      alert(
        "Debes seleccionar o guardar una dirección antes de completar la orden"
      );
      return;
    }

    // Check if Wompi is enabled
    if (!process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY) {
      alert("El sistema de pagos no está configurado correctamente");
      return;
    }

    setIsSubmittingOrder(true);

    try {
      // Prepare order items from cart
      const orderItems: OrderItemInput[] = cart.items.map((item: CartItem) => ({
        productId: item.productId, // Use productId instead of id
        quantity: item.quantity,
        productColorId: item.productColorId,
        productSizeId: item.productSizeId,
        unitPrice: item.price, // GraphQL input expects "unitPrice"
      }));

      // Create order input for GraphQL mutation
      const orderInput: CreateOrderInput = {
        addressId: addressId, // Use selected or created address ID
        items: orderItems,
        total: cart.total,
        subtotal: cart.subtotal,
        tax: cart.tax,
        shipping: cart.shipping,
        // Some backends require storeId for product validation
        // Include store ID if available
        ...(store?.id && { storeId: store.id }),
        ...(store?.storeId && !store?.id && { storeId: store.storeId }),
      };

      // First, create the order
      const { data } = await createOrder({
        variables: {
          input: orderInput,
        },
      });

      const createdOrder = data.createOrder;

      // Then create a payment record in the system using GraphQL
      const selectedAddress = selectedAddressId
        ? addressesData?.addressesByUser?.find(
            (addr: Address) => addr.id === selectedAddressId
          ) || address
        : address;

      const paymentInput = {
        amount: cart.total,
        currency: "COP",
        provider: PaymentProvider.WOMPI,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        description: `Pago para orden ${createdOrder.id}`,
        customerEmail: session.user?.email || "",
        customerPhone: selectedAddress?.phone || "",
        orderId: createdOrder.id,
        externalReference: paymentReference,
        ...(store?.id && { storeId: store.id }),
        ...(store?.storeId && !store?.id && { storeId: store.storeId }),
      };

      const { data: paymentData } = await createPayment({
        variables: {
          input: paymentInput,
        },
      });

      const paymentRecord = paymentData.createPayment;

      // Generate Wompi payment data
      const reference = paymentRecord.id; // Use payment ID as reference
      const amountInCents = formatAmountInCents(cart.total);
      const currency = "COP";
      const expirationTime = getExpirationTime();

      // Get Wompi configuration
      const wompiPublicKey =
        getWompiPublicKey() ||
        process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY ||
        "pub_test_G6jyWcpGlLJG8ATDRf9u6gLKy3MH8J";

      // IMPORTANT: In production, generate signature on backend
      const integritySecret =
        process.env.NEXT_PUBLIC_WOMPI_INTEGRITY_SECRET ||
        "test_integrity_secret";
      const integritySignature = generateIntegritySignature(
        reference,
        amountInCents,
        currency,
        expirationTime,
        integritySecret
      );

      const wompiData = {
        "public-key": wompiPublicKey,
        currency: currency,
        "amount-in-cents": amountInCents.toString(),
        reference: reference,
        "signature:integrity": integritySignature,
        "expiration-time": expirationTime,
        "redirect-url": `${window.location.origin}/orden-exitosa?payment=${paymentRecord.id}`,
        "customer-data:email": session.user?.email || "",
        "customer-data:phone": selectedAddress?.phone || "",
        "customer-data:full-name":
          session.user?.name || selectedAddress?.name || "",
        "customer-data:legal-id": "",
        "customer-data:legal-id-type": "CC",
        "shipping-address:address-line-1": selectedAddress?.street || "",
        "shipping-address:city": selectedAddress?.city || "",
        "shipping-address:country": "CO",
        "shipping-address:region": selectedAddress?.department || "",
        "shipping-address:phone-number": selectedAddress?.phone || "",
        "shipping-address:name":
          selectedAddress?.name || session.user?.name || "",
        "tax-in-cents:vat": formatAmountInCents(cart.tax).toString(),
        "tax-in-cents:consumption": formatAmountInCents(cart.tax).toString(),
        "payment-methods": "CARD,NEQUI,PSE",
      };

      // Instead of showing widget, redirect to Wompi checkout
      const redirectToWompiCheckout = (wompiData: any) => {
        const baseUrl = "https://checkout.wompi.co/p/";
        const params = new URLSearchParams();

        Object.entries(wompiData).forEach(([key, value]) => {
          if (value && value !== "undefined") {
            params.append(key, value.toString());
          }
        });

        const checkoutUrl = `${baseUrl}?${params.toString()}`;

        // Clear cart before redirect since we're leaving the app
        cartService.clearCart();

        // Redirect to Wompi checkout
        window.location.href = checkoutUrl;
      };

      // Redirect to Wompi checkout instead of showing widget
      redirectToWompiCheckout(wompiData);

      // Mark step as completed
      setCompletedSteps([...completedSteps.filter((s) => s !== 3), 3]);

      // Note: Don't clear cart until payment is confirmed via webhook
    } catch (error) {
      console.error("Error creating order and payment:", error);

      // More detailed error logging
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        alert(`Error: ${error.message}`);
      } else {
        alert(
          "Error al crear la orden y procesar el pago. Por favor intenta nuevamente."
        );
      }
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleEpaycoCheckout = async () => {
    // Check if user is authenticated
    if (!session) {
      alert("Debes iniciar sesión para completar la orden");
      return;
    }

    // Check if address is saved or selected
    const addressId = address.id || selectedAddressId;
    if (!addressId) {
      alert(
        "Debes seleccionar o guardar una dirección antes de completar la orden"
      );
      return;
    }

    setIsSubmittingOrder(true);

    try {
      const selectedAddress = selectedAddressId
        ? addressesData?.addressesByUser?.find(
            (addr: Address) => addr.id === selectedAddressId
          ) || address
        : address;

      // Create the order first (similar to Wompi flow but without payment record)
      const orderItems: OrderItemInput[] = cart.items.map((item: CartItem) => ({
        productId: item.productId,
        quantity: item.quantity,
        productColorId: item.productColorId,
        productSizeId: item.productSizeId,
        unitPrice: item.price,
      }));

      const orderInput: CreateOrderInput = {
        addressId: addressId,
        items: orderItems,
        total: cart.total,
        subtotal: cart.subtotal,
        tax: cart.tax,
        shipping: cart.shipping,
        ...(store?.id && { storeId: store.id }),
        ...(store?.storeId && !store?.id && { storeId: store.storeId }),
      };

      console.log("Creating order:", orderInput);

      const { data: orderData } = await createOrder({
        variables: {
          input: orderInput,
        },
      });

      const newOrder = orderData.createOrder;
      console.log("Order created:", newOrder);

      // Clear cart before opening checkout
      cartService.clearCart();

      // Open ePayco Standard Checkout
      await createEpaycoCheckout({
        orderId: newOrder.id,
        amount: cart.total,
        tax: cart.tax,
        taxBase: cart.subtotal,
        description: `Orden #${newOrder.id} - ${cart.items.length} productos`,
        customerName: selectedAddress?.name || session.user?.name || "",
        customerEmail: session.user?.email || "",
        customerPhone: selectedAddress?.phone || "",
        customerDocType: "cc",
        customerDocument: "1234567890", // TODO: Get from user profile
        customerAddress: selectedAddress?.street || "",
      });

      // Mark step as completed
      setCompletedSteps([...completedSteps.filter((s) => s !== 3), 3]);
    } catch (error) {
      console.error("Error opening ePayco checkout:", error);

      if (error instanceof Error) {
        console.error("Error message:", error.message);
        alert(`Error: ${error.message}`);
      } else {
        alert(
          "Error al abrir el checkout de ePayco. Por favor intenta nuevamente."
        );
      }
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const isAddressCompleted =
    completedSteps.includes(2) || (!!selectedAddressId && !showNewAddressForm);
  const isPaymentCompleted = completedSteps.includes(3);

  // Prepare Wompi payment data
  const prepareWompiData = () => {
    const selectedAddress = selectedAddressId
      ? addressesData?.addressesByUser?.find(
          (addr: Address) => addr.id === selectedAddressId
        ) || address
      : address;

    const amountInCents = formatAmountInCents(cart.total);
    const currency = "COP";
    const expirationTime = getExpirationTime();

    // Wompi integrity secret (should be in environment variables)
    const integritySecret =
      process.env.NEXT_PUBLIC_WOMPI_INTEGRITY_SECRET ||
      "prod_integrity_Z5mMke9x0k8gpErbDqwrJXMqsI6SFli6";

    // Generate integrity signature according to Wompi documentation
    const integritySignature = generateIntegritySignature(
      paymentReference,
      amountInCents,
      currency,
      expirationTime,
      integritySecret
    );

    const wompiData = {
      publicKey:
        store?.wompiPublicKey ||
        process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY ||
        "pub_test_G6jyWcpGlLJG8ATDRf9u6gLKy3MH8J",
      currency,
      amountInCents,
      reference: paymentReference,
      integritySignature, // Now properly calculated according to Wompi documentation
      redirectUrl: `${window.location.origin}/orden-exitosa`,
      expirationTime,
      taxVatInCents: formatAmountInCents(cart.tax),
      taxConsumptionInCents: 0, // Colombia doesn't typically use consumption tax for most products
      customerEmail: session?.user?.email || "",
      customerFullName: session?.user?.name || selectedAddress?.name || "",
      customerPhoneNumber: selectedAddress?.phone || "",
      customerLegalId: "", // This would need to be collected separately
      customerLegalIdType: "CC", // Default to Cédula de Ciudadanía
      shippingAddressLine1: selectedAddress?.street || "",
      shippingCountry: "CO",
      shippingPhoneNumber: selectedAddress?.phone || "",
      shippingCity: selectedAddress?.city || "",
      shippingRegion: selectedAddress?.department || "",
    };

    return wompiData;
  };

  // Show login prompt if not authenticated
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Inicia sesión para continuar
            </h2>
            <p className="text-gray-600 mb-6">
              Necesitas iniciar sesión para guardar tu dirección y completar la
              orden.
            </p>
            <button
              onClick={() => router.push("/auth/signin")}
              className="px-6 py-3 rounded-lg font-semibold text-center hover:opacity-90 transition-all"
              style={{
                backgroundColor: store?.primaryColor || "#2563eb",
                color: "#ffffff",
                minWidth: "180px",
                display: "inline-block",
              }}
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          Finalizar Orden
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Column (2/3 width) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-8">
                {/* Step 1: Order Summary */}
                <AccordionStep
                  step={1}
                  title="Resumen de la Orden"
                  isOpen={activeStep === 1}
                  isCompleted={true}
                  onToggle={() => handleStepToggle(1)}
                >
                  <div className="space-y-4">
                    {cart.items.map((item: CartItem) => (
                      <div
                        key={`${item.id}-${item.variant}`}
                        className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg"
                      >
                        <Image
                          src={resolveImageUrl(item.image)}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {item.name}
                          </h4>
                          {item.variant && (
                            <p className="text-sm text-gray-500">
                              Variante: {item.variant}
                            </p>
                          )}
                          <p className="text-sm text-gray-500">
                            Cantidad: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            ${(item.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionStep>

                {/* Step 2: Address Form */}
                <AccordionStep
                  step={2}
                  title="Dirección de Entrega"
                  isOpen={activeStep === 2}
                  isCompleted={isAddressCompleted}
                  isDisabled={cart.items.length === 0}
                  onToggle={() => handleStepToggle(2)}
                >
                  <div className="space-y-6">
                    {/* Loading state */}
                    {addressesLoading && (
                      <div className="text-center py-4">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-600">
                          Cargando direcciones...
                        </span>
                      </div>
                    )}

                    {/* Error state */}
                    {addressesError && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <p className="text-red-600 text-sm">
                          Error al cargar direcciones: {addressesError.message}
                        </p>
                        <button
                          onClick={() => refetchAddresses()}
                          className="mt-2 text-sm text-red-700 underline hover:no-underline"
                        >
                          Reintentar
                        </button>
                      </div>
                    )}

                    {/* Existing addresses */}
                    {!addressesLoading &&
                      addressesData?.addressesByUser?.length > 0 && (
                        <div>
                          <h4 className="text-lg font-medium text-gray-900 mb-4">
                            Direcciones Guardadas
                          </h4>
                          <div className="space-y-3">
                            {addressesData.addressesByUser.map(
                              (savedAddress: Address) => (
                                <div
                                  key={savedAddress.id}
                                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                                    selectedAddressId === savedAddress.id
                                      ? "border-blue-500 bg-blue-50"
                                      : "border-gray-200 hover:border-gray-300"
                                  }`}
                                  onClick={() =>
                                    handleAddressSelection(savedAddress.id!)
                                  }
                                >
                                  <div className="flex items-start space-x-3">
                                    <input
                                      type="radio"
                                      name="selectedAddress"
                                      value={savedAddress.id}
                                      checked={
                                        selectedAddressId === savedAddress.id
                                      }
                                      onChange={() =>
                                        handleAddressSelection(savedAddress.id!)
                                      }
                                      className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2">
                                        <h5 className="font-medium text-gray-900">
                                          {savedAddress.name}
                                        </h5>
                                        {savedAddress.isDefault && (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Predeterminada
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm text-gray-600 mt-1">
                                        {savedAddress.street}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        {savedAddress.city},{" "}
                                        {savedAddress.department}
                                        {savedAddress.postalCode &&
                                          ` - ${savedAddress.postalCode}`}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        Tel: {savedAddress.phone}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>

                          <div className="mt-4">
                            <button
                              type="button"
                              onClick={handleNewAddressClick}
                              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                            >
                              + Agregar nueva dirección
                            </button>
                          </div>
                        </div>
                      )}

                    {/* New address form or when no addresses exist */}
                    {(!addressesData?.addressesByUser?.length ||
                      showNewAddressForm) &&
                      !addressesLoading && (
                        <div>
                          {addressesData?.addressesByUser?.length > 0 && (
                            <h4 className="text-lg font-medium text-gray-900 mb-4">
                              Nueva Dirección
                            </h4>
                          )}

                          <form
                            onSubmit={handleAddressSubmit}
                            className="space-y-4"
                          >
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Dirección *
                              </label>
                              <input
                                type="text"
                                required
                                value={address.street}
                                onChange={(e) =>
                                  setAddress({
                                    ...address,
                                    street: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Descripción *
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={address.name}
                                  onChange={(e) =>
                                    setAddress({
                                      ...address,
                                      name: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Teléfono *
                                </label>
                                <input
                                  type="tel"
                                  required
                                  value={address.phone}
                                  onChange={(e) =>
                                    setAddress({
                                      ...address,
                                      phone: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Ciudad *
                                </label>
                                <select
                                  required
                                  value={address.city}
                                  onChange={(e) =>
                                    setAddress({
                                      ...address,
                                      city: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Selecciona </option>
                                  {cities.map((city) => (
                                    <option key={city} value={city}>
                                      {city}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Departamento *
                                </label>
                                <select
                                  required
                                  value={address.department}
                                  onChange={(e) =>
                                    setAddress({
                                      ...address,
                                      department: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Selecciona </option>
                                  {departments.map((department) => (
                                    <option key={department} value={department}>
                                      {department}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Código Postal
                                </label>
                                <input
                                  type="text"
                                  value={address.postalCode}
                                  onChange={(e) =>
                                    setAddress({
                                      ...address,
                                      postalCode: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>

                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="isDefault"
                                checked={address.isDefault}
                                onChange={(e) =>
                                  setAddress({
                                    ...address,
                                    isDefault: e.target.checked,
                                  })
                                }
                                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              />
                              <label
                                htmlFor="isDefault"
                                className="ml-2 text-sm text-gray-700"
                              >
                                Establecer como dirección predeterminada
                              </label>
                            </div>

                            <div className="flex justify-between">
                              {addressesData?.addressesByUser?.length > 0 &&
                                showNewAddressForm && (
                                  <button
                                    type="button"
                                    onClick={() => setShowNewAddressForm(false)}
                                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                  >
                                    Cancelar
                                  </button>
                                )}
                              <button
                                type="submit"
                                disabled={isSubmittingAddress}
                                className="px-6 py-2 text-white rounded-md hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                                style={{
                                  backgroundColor:
                                    store?.primaryColor || "#2563eb",
                                }}
                              >
                                {isSubmittingAddress
                                  ? "Guardando..."
                                  : "Continuar"}
                              </button>
                            </div>
                          </form>
                        </div>
                      )}

                    {/* Continue button for selected address */}
                    {selectedAddressId && !showNewAddressForm && (
                      <div className="flex justify-end">
                        <button
                          onClick={handleAddressSubmit}
                          disabled={isSubmittingAddress}
                          className="px-6 py-2 text-white rounded-md hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor: store?.primaryColor || "#2563eb",
                          }}
                        >
                          Continuar con dirección seleccionada
                        </button>
                      </div>
                    )}
                  </div>
                </AccordionStep>

                {/* Step 3: Payment Information */}
                <AccordionStep
                  step={3}
                  title="Información de Pago"
                  isOpen={activeStep === 3}
                  isCompleted={isPaymentCompleted}
                  isDisabled={!isAddressCompleted}
                  onToggle={() => handleStepToggle(3)}
                >
                  {(() => {
                    const wompiData = prepareWompiData();

                    return (
                      <div className="space-y-6">
                        {/* Payment summary */}
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-2">
                            Resumen de Pago
                          </h4>
                          <div className="space-y-1 text-sm text-blue-800">
                            <div className="flex justify-between">
                              <span>Total a pagar:</span>
                              <span className="font-medium">
                                ${cart.total.toLocaleString("es-CO")}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Referencia:</span>
                              <span className="font-mono text-xs">
                                {wompiData.reference}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Payment Provider Selection m*/}
                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-900">
                            Selecciona tu método de pago:
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <button
                              onClick={() =>
                                setSelectedPaymentProvider("wompi")
                              }
                              className={`p-4 border-2 rounded-lg transition-all ${
                                selectedPaymentProvider === "wompi"
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <div className="text-center">
                                <div className="font-medium text-gray-900 mb-1">
                                  Wompi
                                </div>
                                <div className="text-xs text-gray-600">
                                  Tarjetas y PSE
                                </div>
                              </div>
                            </button>

                            <button
                              onClick={() =>
                                setSelectedPaymentProvider("epayco")
                              }
                              className={`p-4 border-2 rounded-lg transition-all ${
                                selectedPaymentProvider === "epayco"
                                  ? "border-green-500 bg-green-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <div className="text-center">
                                <div className="font-medium text-gray-900 mb-1">
                                  ePayco
                                </div>
                                <div className="text-xs text-gray-600">
                                  Todos los métodos
                                </div>
                              </div>
                            </button>
                          </div>
                        </div>

                        {/* Wompi Integration */}
                        {selectedPaymentProvider === "wompi" && (
                          <div className="space-y-4">
                            {/* Security notice for Wompi */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                              <div className="flex items-start space-x-2">
                                <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
                                <div className="text-sm">
                                  <p className="font-medium text-yellow-800">
                                    Nota de Seguridad
                                  </p>
                                  <div className="text-yellow-700 mt-1 space-y-1">
                                    <p>
                                      ⚠️ <strong>Desarrollo:</strong> La firma
                                      de integridad se calcula en el frontend.
                                    </p>
                                    <p>
                                      🔐 <strong>Producción:</strong> Mueve el
                                      cálculo al backend.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <form
                              id="wompi-payment-form"
                              onSubmit={handlePaymentSubmit}
                            >
                              <div className="flex flex-col space-y-3">
                                <div className="flex items-start space-x-2 text-xs text-gray-600 bg-gray-50 p-3 rounded">
                                  <Shield className="w-4 h-4 mt-0.5 text-green-600" />
                                  <span>
                                    Tu pago será procesado de forma segura por
                                    Wompi. Serás redirigido a la plataforma de
                                    pago.
                                  </span>
                                </div>

                                <button
                                  type="submit"
                                  disabled={isSubmittingOrder}
                                  className="w-full px-6 py-3 text-white rounded-md hover:opacity-90 transition-colors flex items-center justify-center space-x-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                  style={{
                                    backgroundColor:
                                      store?.primaryColor || "#2563eb",
                                  }}
                                >
                                  <ShieldCheck className="w-5 h-5" />
                                  <span>
                                    {isSubmittingOrder
                                      ? "Creando orden y redirigiendo..."
                                      : `Pagar con Wompi $${cart.total.toLocaleString(
                                          "es-CO"
                                        )}`}
                                  </span>
                                </button>
                              </div>
                            </form>
                          </div>
                        )}

                        {/* ePayco Standard Checkout */}
                        {selectedPaymentProvider === "epayco" && (
                          <div className="space-y-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <div className="flex items-start space-x-2">
                                <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5" />
                                <div className="text-sm">
                                  <p className="font-medium text-green-800">
                                    ePayco Standard Checkout
                                  </p>
                                  <p className="text-green-700 mt-1">
                                    Paga con tarjetas de crédito, débito, PSE,
                                    Efecty, Baloto y más métodos de pago.
                                  </p>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={handleEpaycoCheckout}
                              disabled={isSubmittingOrder || epaycoLoading}
                              className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ShieldCheck className="w-5 h-5" />
                              <span>
                                {isSubmittingOrder || epaycoLoading
                                  ? "Abriendo checkout..."
                                  : `Pagar con ePayco $${cart.total.toLocaleString(
                                      "es-CO"
                                    )}`}
                              </span>
                            </button>

                            {epaycoError && (
                              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-red-800 text-sm">
                                  {epaycoError}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Debug info in development */}
                        {process.env.NODE_ENV === "development" && (
                          <details className="mt-4">
                            <summary className="text-xs text-gray-500 cursor-pointer">
                              Ver datos de depuración
                            </summary>
                            <div className="text-xs bg-gray-100 p-3 rounded mt-2 space-y-2">
                              <div>
                                <p className="font-medium text-gray-700 mb-1">
                                  Cálculo de Firma de Integridad:
                                </p>
                                <p className="text-gray-600">
                                  Concatenación:{" "}
                                  <code className="bg-white px-1 rounded">
                                    {wompiData.reference}
                                    {wompiData.amountInCents}
                                    {wompiData.currency}
                                    {wompiData.expirationTime}
                                  </code>
                                </p>
                                <p className="text-gray-600">
                                  Firma SHA256:{" "}
                                  <code className="bg-white px-1 rounded text-xs">
                                    {wompiData.integritySignature}
                                  </code>
                                </p>
                              </div>
                              <hr className="border-gray-300" />
                              <pre className="overflow-auto">
                                {JSON.stringify(wompiData, null, 2)}
                              </pre>
                            </div>
                          </details>
                        )}
                      </div>
                    );
                  })()}
                </AccordionStep>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary (1/3 width) */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <OrderSummary cart={cart} store={store} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
