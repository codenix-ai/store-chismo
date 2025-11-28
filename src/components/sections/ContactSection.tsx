'use client';

import { useMutation, gql } from '@apollo/client';
import { useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useStore } from '@/components/StoreProvider';

const CREATE_CONTACT_LEAD = gql`
  mutation CreateContactLead($input: CreateContactLeadInput!) {
    createContactLead(input: $input) {
      id
      firstName
      lastName
      companyName
      email
      phoneNumber
      message
      storeId
      createdAt
      store {
        id
        name
        email
      }
    }
  }
`;

interface ContactSectionProps {
  imageD: string;
  title?: string;
  subtitle?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  phone?: string;
  email?: string;
  hours?: Record<string, string>;
  social?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
  };
}

export function ContactSection({
  imageD,
  title = 'Solicita tu Cotización',
  subtitle = 'Estamos aquí para ayudarte con tus necesidades de dotación industrial',
  address,
  phone: contactPhone,
  email: contactEmail,
  hours,
  social,
}: ContactSectionProps) {
  const { store } = useStore();
  const [createContactLead, { loading, error, data }] = useMutation(CREATE_CONTACT_LEAD);
  const [phone, setPhone] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneTouched, setPhoneTouched] = useState<boolean>(false);

  const validatePhoneNumber = (value: string) => {
    if (!value) return false;
    const str = String(value).trim();
    // Allowed characters: digits, spaces, +, parentheses, hyphens, dots
    const allowedChars = /^[+\d\s().-]+$/;
    if (!allowedChars.test(str)) return false; // reject letters or unexpected chars
    const digits = str.replace(/\D/g, '');
    // Accept between 10 and 15 digits (local or international)
    return digits.length === 10;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setPhone(v);
    if (phoneTouched) {
      setPhoneError(validatePhoneNumber(v) ? null : 'Número inválido');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    // Validate phone before submit
    const phoneValue = phone || String(formData.get('phoneNumber') || '');
    setPhoneTouched(true);
    if (!validatePhoneNumber(phoneValue)) {
      setPhoneError('Por favor ingresa un número de teléfono válido');
      return;
    }

    const input = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      companyName: formData.get('companyName'),
      email: formData.get('email'),
      phoneNumber: phoneValue,
      message: formData.get('message'),
      storeId: store?.id || 'default-store',
    };
    try {
      await createContactLead({ variables: { input } });

      toast.success('Cotización enviada con éxito 🚀', {});

      form.reset();
    } catch (error) {
      console.error('Error al enviar la cotización:', error);

      toast.error('Hubo un error al enviar la cotización ❌', {});
    }
  };

  return (
    <section id="contact-form" className="py-16 bg-gray-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Contact Form */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-xl border border-gray-100">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">{title}</h2>
          {subtitle && <p className="text-gray-600 mb-6">{subtitle}</p>}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido *
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Tu apellido"
                />
              </div>
            </div>

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                Empresa
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Nombre de tu empresa"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="ejemplo@correo.com"
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono *
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                required
                value={phone}
                onChange={handlePhoneChange}
                onBlur={() => {
                  setPhoneTouched(true);
                  setPhoneError(validatePhoneNumber(phone) ? null : 'Número inválido');
                }}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all ${
                  phoneTouched && phoneError
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="+57 300 123 4567"
              />
              {phoneTouched && phoneError && <p className="text-red-500 text-sm mt-2">{phoneError}</p>}
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Mensaje
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Cuéntanos qué necesitas..."
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading || (phoneTouched && !!phoneError)}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Solicitar Cotización'}
            </button>

            {error && <p className="text-red-500 text-sm mt-2">Error: {error.message}</p>}
            {data && <p className="text-green-600 text-sm mt-2">¡Cotización enviada con éxito!</p>}
          </form>
        </div>
        <div className="relative aspect-[4/4] rounded-3xl overflow-hidden shadow-2xl">
          <Image
            src={imageD}
            alt="Equipo de atención al cliente especializado en dotaciones industriales"
            fill
            className="object-cover object-bottom"
          />
        </div>
      </div>
    </section>
  );
}
