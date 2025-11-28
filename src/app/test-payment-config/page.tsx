'use client';
import React from 'react';
import { useStorePaymentConfiguration } from '@/hooks/usePaymentConfiguration';
import { useSession } from 'next-auth/react';
import { Link } from 'lucide-react';

export default function TestPaymentConfig() {
  const { data: session } = useSession();
  const { configuration, loading, error, isWompiEnabled, isMercadoPagoEnabled, isEpaycoEnabled } =
    useStorePaymentConfiguration();

  if (!session) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Test Payment Configuration</h1>
        <p className="text-red-600">Please log in to view payment configuration.</p>
        <Link
          href="/auth/signin"
          className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Payment Configuration</h1>

      {/* Session Info */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Session Info</h2>
        <pre className="text-sm text-gray-700">{JSON.stringify(session?.user, null, 2)}</pre>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-yellow-50 p-4 rounded-lg mb-6">
          <p className="text-yellow-800">Loading payment configuration...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-semibold mb-2 text-red-800">Error</h2>
          <pre className="text-sm text-red-700">{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}

      {/* Configuration Data */}
      {configuration && (
        <div className="bg-green-50 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-semibold mb-2 text-green-800">Configuration Found</h2>
          <pre className="text-sm text-gray-700">{JSON.stringify(configuration, null, 2)}</pre>
        </div>
      )}

      {/* Provider Status */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Provider Status</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className={`p-3 rounded ${isWompiEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <strong>Wompi:</strong> {isWompiEnabled ? 'Enabled' : 'Disabled'}
          </div>
          <div
            className={`p-3 rounded ${
              isMercadoPagoEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            <strong>MercadoPago:</strong> {isMercadoPagoEnabled ? 'Enabled' : 'Disabled'}
          </div>
          <div className={`p-3 rounded ${isEpaycoEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <strong>ePayco:</strong> {isEpaycoEnabled ? 'Enabled' : 'Disabled'}
          </div>
        </div>
      </div>

      {/* No Configuration State */}
      {!loading && !error && !configuration && (
        <div className="bg-orange-50 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-semibold mb-2 text-orange-800">No Configuration Found</h2>
          <p className="text-orange-700">
            No payment configuration found for your store. You may need to create one first.
          </p>
        </div>
      )}

      {/* Navigation Links */}
      <div className="mt-8 space-y-2">
        <h2 className="text-lg font-semibold mb-4">Quick Navigation</h2>
        <div className="space-x-4">
          <Link
            href="/admin/payments"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Payment Dashboard
          </Link>
          <Link
            href="/admin/payments/config"
            className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Payment Configuration
          </Link>
          <Link href="/admin" className="inline-block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
            Admin Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
