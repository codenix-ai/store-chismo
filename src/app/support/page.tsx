"use client";
import Layout from "@/components/Layout/Layout";
import { useStore } from "@/components/StoreProvider";
import {
  Mail,
  Phone,
  MessageCircle,
  Clock,
  MapPin,
  Headphones,
} from "lucide-react";
import { useMutation, gql } from "@apollo/client";
import toast from "react-hot-toast";
import { useState } from "react";

export default function SupportPage() {
  const { store } = useStore();
  const CREATE_CONTACT_LEAD = gql`
    mutation CreateContactLead($input: CreateContactLeadInput!) {
      createContactLead(input: $input) {
        id
        firstName
        lastName
        email
        phoneNumber
        message
        storeId
      }
    }
  `;

  const [createContactLead, { loading: createLoading }] =
    useMutation(CREATE_CONTACT_LEAD);
  const [phone, setPhone] = useState<string>("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneTouched, setPhoneTouched] = useState<boolean>(false);

  const validatePhoneNumber = (value: string) => {
    if (!value) return false;
    const str = String(value).trim();
    const allowedChars = /^[+\d\s().-]+$/;
    if (!allowedChars.test(str)) return false;
    const digits = str.replace(/\D/g, "");
    return digits.length >= 7 && digits.length <= 15;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setPhone(v);
    if (phoneTouched)
      setPhoneError(validatePhoneNumber(v) ? null : "Número inválido");
  };
  const supportOptions = [
    {
      icon: MessageCircle,
      title: "Chat en Vivo",
      description: "Habla directamente con nuestro equipo de soporte",
      action: "Iniciar Chat",
      available: "24/7",
      color: store?.primaryColor || "#2563eb",
    },
    {
      icon: Mail,
      title: "Email",
      description: "Envíanos tu consulta por correo electrónico",
      action: "Enviar Email",
      contact: store?.email || "soporte@emprendyup.com",
      color: store?.secondaryColor || "#059669",
    },
    {
      icon: Phone,
      title: "Teléfono",
      description: "Llámanos para soporte inmediato",
      action: "Llamar Ahora",
      contact: store?.phone || "+57 (1) 234-5678",
      color: store?.accentColor || "#059669",
    },
  ];

  const faqItems = [
    {
      question: "¿Cuál es el tiempo de entrega?",
      answer:
        "Los tiempos de entrega varían según la ubicación. En Bogotá: 1-2 días hábiles. En otras ciudades principales: 2-4 días hábiles. En municipios: 5-7 días hábiles.",
    },
    {
      question: "¿Cómo puedo realizar el seguimiento de mi pedido?",
      answer:
        'Una vez confirmado tu pedido, recibirás un email con el número de seguimiento. También puedes ingresar a tu cuenta y revisar el estado en la sección "Mis Pedidos".',
    },
    {
      question: "¿Qué métodos de pago aceptan?",
      answer:
        "Aceptamos MercadoPago, Wompi, ePayco, tarjetas de crédito y débito Visa/Mastercard, PSE, y pago contraentrega en algunas zonas.",
    },
    {
      question: "¿Cuál es la política de devoluciones?",
      answer:
        "Tienes 30 días calendario para devolver productos en perfecto estado. Los productos deben estar en su empaque original y con todas las etiquetas.",
    },
    {
      question: "¿El envío tiene costo?",
      answer:
        "El envío es gratuito en compras superiores a $150.000 COP. Para compras menores, el costo del envío es de $15.000 COP.",
    },
    {
      question: "¿Cómo puedo cambiar o cancelar mi pedido?",
      answer:
        "Puedes cambiar o cancelar tu pedido dentro de las primeras 2 horas después de realizarlo. Contáctanos inmediatamente para procesar el cambio.",
    },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-black font-montserrat mb-4">
            Centro de Soporte
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Estamos aquí para ayudarte. Encuentra respuestas a tus preguntas o
            contáctanos directamente.
          </p>
        </div>

        {/* Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {supportOptions.map((option, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow"
            >
              <div
                className="inline-flex items-center justify-center w-16 h-16 text-white rounded-full mb-4"
                style={{ backgroundColor: option.color }}
              >
                <option.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-black mb-2">
                {option.title}
              </h3>
              <p className="text-gray-600 mb-4">{option.description}</p>
              {option.contact && (
                <p
                  className="font-medium mb-4"
                  style={{ color: store?.primaryColor || "#2563eb" }}
                >
                  {option.contact}
                </p>
              )}
              {option.available && (
                <p className="text-green-600 text-sm mb-4">
                  Disponible {option.available}
                </p>
              )}
              <button
                className="w-full text-white py-2 px-4 rounded-lg transition-colors"
                style={{
                  backgroundColor: store?.primaryColor || "#2563eb",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    store?.secondaryColor || "#1e293b";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    store?.primaryColor || "#2563eb";
                }}
              >
                {option.action}
              </button>
            </div>
          ))}
        </div>

        {/* Quick Info */}
        <div
          className="rounded-lg p-8 mb-16"
          style={{
            backgroundColor: store?.primaryColor
              ? `${store.primaryColor}20`
              : "#eff6ff",
          }} // 20 = 12% opacity
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Clock
                className="w-12 h-12 mx-auto mb-4"
                style={{ color: store?.primaryColor || "#2563eb" }}
              />
              <h3 className="text-lg font-semibold text-black mb-2">
                Horarios de Atención
              </h3>
              <p className="text-gray-600">
                Lunes a Viernes: 8:00 AM - 6:00 PM
                <br />
                Sábados: 9:00 AM - 2:00 PM
                <br />
                Chat en vivo: 24/7
              </p>
            </div>
            <div className="text-center">
              <MapPin
                className="w-12 h-12 mx-auto mb-4"
                style={{ color: store?.primaryColor || "#2563eb" }}
              />
              <h3 className="text-lg font-semibold text-black mb-2">
                Ubicación
              </h3>
              <div className="text-gray-600">
                {store?.address ? (
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
                ) : (
                  <div>
                    Bogotá, Colombia
                    <br />
                    Zona Comercial Central
                    <br />
                    (Solo atención virtual)
                  </div>
                )}
              </div>
            </div>
            <div className="text-center">
              <Headphones
                className="w-12 h-12 mx-auto mb-4"
                style={{ color: store?.primaryColor || "#2563eb" }}
              />
              <h3 className="text-lg font-semibold text-black mb-2">
                Tiempo de Respuesta
              </h3>
              <p className="text-gray-600">
                Chat: Inmediato
                <br />
                Email: 2-4 horas
                <br />
                Teléfono: Inmediato
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-black text-center mb-8 font-montserrat">
            Preguntas Frecuentes
          </h2>
          <div className="max-w-4xl mx-auto space-y-6">
            {faqItems.map((item, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-black mb-3">
                  {item.question}
                </h3>
                <p className="text-gray-600 leading-relaxed">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-black text-center mb-8 font-montserrat">
            Envíanos un Mensaje
          </h2>
          <form
            className="bg-white rounded-lg shadow-lg p-8"
            onSubmit={async (e) => {
              e.preventDefault();
              setPhoneTouched(true);
              if (!validatePhoneNumber(phone)) {
                setPhoneError("Por favor ingresa un número de teléfono válido");
                return;
              }
              const form = e.currentTarget as HTMLFormElement;
              const fd = new FormData(form);
              const firstName = String(fd.get("firstName") || "").trim();
              const lastName = String(fd.get("lastName") || "").trim();
              const input = {
                firstName: firstName,
                lastName: lastName,
                companyName: "",
                email: String(fd.get("email") || ""),
                phoneNumber: phone,
                message: String(fd.get("message") || ""),
                storeId: store?.id || "default-store",
              };
              try {
                await createContactLead({ variables: { input } });
                toast.success("Cotización enviada correctamente");
                form.reset();
                setPhone("");
                setPhoneTouched(false);
                setPhoneError(null);
              } catch (err) {
                console.error("Error creando lead de contacto", err);
                toast.error("Error al enviar la cotización");
              }
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Nombre
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Apellido
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Teléfono *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={phone}
                  onChange={handlePhoneChange}
                  onBlur={() => {
                    setPhoneTouched(true);
                    setPhoneError(
                      validatePhoneNumber(phone) ? null : "Número inválido"
                    );
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all ${
                    phoneTouched && phoneError
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                  placeholder="+57 300 123 4567"
                  required
                />
                {phoneTouched && phoneError && (
                  <p className="text-red-500 text-sm mt-2">{phoneError}</p>
                )}
              </div>
            </div>

            <div className="mb-6">
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Asunto
              </label>
              <select
                id="subject"
                name="subject"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Selecciona un tema</option>
                <option value="order">Consulta sobre pedido</option>
                <option value="product">Información de producto</option>
                <option value="payment">Problemas de pago</option>
                <option value="shipping">Consulta de envío</option>
                <option value="return">Devolución/Cambio</option>
                <option value="other">Otro</option>
              </select>
            </div>

            <div className="mb-6">
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Mensaje
              </label>
              <textarea
                id="message"
                name="message"
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe tu consulta o problema en detalle..."
                required
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={createLoading}
              className="w-full text-white py-3 px-6 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: store?.primaryColor || "#2563eb",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  store?.secondaryColor || "#1e293b";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  store?.primaryColor || "#2563eb";
              }}
            >
              {createLoading ? "Enviando..." : "Enviar Mensaje"}
            </button>
          </form>
        </div>

        {/* Additional Resources */}
        <div className="mt-16 bg-gray-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-black text-center mb-6 font-montserrat">
            Recursos Adicionales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span
                  className="font-semibold"
                  style={{ color: store?.primaryColor || "#2563eb" }}
                >
                  📋
                </span>
              </div>
              <h3 className="font-semibold text-black mb-2">Guía de Usuario</h3>
              <p className="text-sm text-gray-600">
                Aprende a usar nuestra plataforma
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span
                  className="font-semibold"
                  style={{ color: store?.secondaryColor || "#2563eb" }}
                >
                  📋
                </span>
              </div>
              <h3 className="font-semibold text-black mb-2">
                Términos y Condiciones
              </h3>
              <p className="text-sm text-gray-600">Revisa nuestras políticas</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span
                  className="font-semibold"
                  style={{ color: store?.accentColor || "#2563eb" }}
                >
                  🔒
                </span>
              </div>
              <h3 className="font-semibold text-black mb-2">
                Política de Privacidad
              </h3>
              <p className="text-sm text-gray-600">Cómo protegemos tus datos</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span
                  className="font-semibold"
                  style={{ color: store?.primaryColor || "#2563eb" }}
                >
                  💡
                </span>
              </div>
              <h3 className="font-semibold text-black mb-2">
                Tips para Emprendedores
              </h3>
              <p className="text-sm text-gray-600">
                Consejos y recursos útiles
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
