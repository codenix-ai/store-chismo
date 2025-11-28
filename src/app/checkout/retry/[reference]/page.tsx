'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout/Layout';
import { useStore } from '@/components/StoreProvider';
import { AlertCircle, CreditCard, Shield, RefreshCw } from 'lucide-react';

interface OrderData {
  reference: string;
  total: number;
  failedAttempts: number;
  maxAttempts: number;
  lastFailureReason?: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}

export default function RetryPaymentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { store } = useStore();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState('card');

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        const response = await fetch(`/api/checkout/retry/${params.reference}`);
        if (response.ok) {
          const data = await response.json();
          setOrderData(data.order);
        } else {
          console.error('Order not found');
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [params.reference]);

  const handleRetryPayment = async () => {
    if (!orderData) return;

    try {
      // Call API to create new payment attempt
      const response = await fetch(`/api/checkout/retry/${orderData.reference}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethod: selectedMethod.toUpperCase(),
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Create form and submit to Wompi
        const form = document.createElement('form');
        form.action = data.paymentUrl;
        form.method = 'GET';

        Object.entries(data.paymentData).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name =
            key === 'publicKey'
              ? 'public-key'
              : key === 'amountInCents'
              ? 'amount-in-cents'
              : key === 'redirectUrl'
              ? 'redirect-url'
              : key === 'customerEmail'
              ? 'customer-data:email'
              : key === 'paymentMethods'
              ? 'payment-methods'
              : key;
          input.value = Array.isArray(value) ? value.join(',') : String(value);
          form.appendChild(input);
        });

        // Add integrity signature
        const integrityInput = document.createElement('input');
        integrityInput.type = 'hidden';
        integrityInput.name = 'integrity';
        integrityInput.value = data.integritySignature;
        form.appendChild(integrityInput);

        document.body.appendChild(form);
        form.submit();
      } else {
        alert('Error al procesar el reintento. Por favor intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error retrying payment:', error);
      alert('Error al procesar el reintento. Por favor intenta nuevamente.');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando información del pago...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!orderData) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Orden no encontrada</h2>
            <p className="text-gray-600">No se pudo cargar la información del pago</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-orange-500 mt-1" />
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Reintentar Pago</h1>
                <p className="text-gray-600">
                  Tu pago anterior no pudo procesarse. Puedes intentar nuevamente o elegir otro método de pago.
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen del Pedido</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Orden:</span>
                <span className="font-medium">{orderData.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total a pagar:</span>
                <span className="font-bold text-lg">${orderData.total.toLocaleString('es-CO')}</span>
              </div>
            </div>

            {/* Items */}
            <div className="mt-4 pt-4 border-t">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Productos:</h3>
              <div className="space-y-1">
                {orderData.items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.name} x{item.quantity}
                    </span>
                    <span className="text-gray-900">${(item.price * item.quantity).toLocaleString('es-CO')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Failure Information */}
          <div className="bg-red-50 rounded-lg border border-red-200 p-4 mb-6">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800 mb-1">
                  Intento {orderData.failedAttempts} de {orderData.maxAttempts}
                </h3>
                <p className="text-sm text-red-700">{orderData.lastFailureReason}</p>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Método de Pago</h2>

            <div className="space-y-3">
              {/* Card Payment */}
              <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={selectedMethod === 'card'}
                  onChange={e => setSelectedMethod(e.target.value)}
                  className="h-4 w-4 text-blue-600"
                />
                <CreditCard className="w-5 h-5 text-gray-500 ml-3 mr-3" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Tarjeta de Crédito/Débito</div>
                  <div className="text-xs text-gray-500">Visa, Mastercard, American Express</div>
                </div>
              </label>

              {/* PSE */}
              <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="pse"
                  checked={selectedMethod === 'pse'}
                  onChange={e => setSelectedMethod(e.target.value)}
                  className="h-4 w-4 text-blue-600"
                />
                <Shield className="w-5 h-5 text-green-500 ml-3 mr-3" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">PSE - Pago Seguro en Línea</div>
                  <div className="text-xs text-gray-500">Transferencia desde tu banco</div>
                </div>
              </label>

              {/* Nequi */}
              <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="nequi"
                  checked={selectedMethod === 'nequi'}
                  onChange={e => setSelectedMethod(e.target.value)}
                  className="h-4 w-4 text-blue-600"
                />
                <div className="w-5 h-5 bg-purple-500 rounded ml-3 mr-3 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">N</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Nequi</div>
                  <div className="text-xs text-gray-500">Pago desde tu app Nequi</div>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleRetryPayment}
              disabled={orderData.failedAttempts >= orderData.maxAttempts}
              className="w-full px-6 py-3 text-white rounded-md hover:opacity-90 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              style={{
                backgroundColor:
                  orderData.failedAttempts >= orderData.maxAttempts ? '#9CA3AF' : store?.primaryColor || '#2563eb',
              }}
            >
              {orderData.failedAttempts >= orderData.maxAttempts ? 'Máximo de intentos alcanzado' : 'Proceder al Pago'}
            </button>

            <button
              onClick={() => (window.location.href = '/support')}
              className="w-full px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Contactar Soporte
            </button>

            <button
              onClick={() => (window.location.href = '/')}
              className="w-full px-6 py-2 text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
            >
              Volver a la Tienda
            </button>
          </div>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-2">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Transacciones Seguras</p>
                <p>
                  Todos los pagos son procesados de forma segura. Tu información financiera está protegida con
                  encriptación de nivel bancario.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
