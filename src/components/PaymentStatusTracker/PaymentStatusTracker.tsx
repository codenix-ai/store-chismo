'use client';
import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';

interface PaymentStatus {
  orderId: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR' | 'VOIDED' | 'EXPIRED';
  statusMessage?: string;
  transactionId?: string;
  amount: number;
  paymentMethod: string;
  lastUpdated: string;
}

interface PaymentStatusTrackerProps {
  orderId: string;
  onStatusChange?: (status: PaymentStatus) => void;
}

export default function PaymentStatusTracker({ orderId, onStatusChange }: PaymentStatusTrackerProps) {
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    //eslint-disable-next-line prefer-const
    let interval: NodeJS.Timeout;

    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}/status`);
        if (response.ok) {
          const data = await response.json();
          setStatus(data);

          if (onStatusChange) {
            onStatusChange(data);
          }

          // Stop polling if payment is final
          if (['APPROVED', 'DECLINED', 'ERROR', 'VOIDED', 'EXPIRED'].includes(data.status)) {
            if (interval) {
              clearInterval(interval);
            }
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial check
    checkPaymentStatus();

    // Poll every 3 seconds for pending payments
    interval = setInterval(checkPaymentStatus, 3000);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [orderId, onStatusChange]);

  const getStatusIcon = () => {
    if (loading) return <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />;

    switch (status?.status) {
      case 'APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'DECLINED':
      case 'ERROR':
      case 'VOIDED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'EXPIRED':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'PENDING':
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status?.status) {
      case 'APPROVED':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'DECLINED':
      case 'ERROR':
      case 'VOIDED':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'EXPIRED':
        return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'PENDING':
      default:
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    }
  };

  const getStatusMessage = () => {
    if (loading) return 'Verificando estado del pago...';

    switch (status?.status) {
      case 'APPROVED':
        return 'Pago aprobado exitosamente';
      case 'DECLINED':
        return status?.statusMessage || 'El pago fue rechazado';
      case 'ERROR':
        return status?.statusMessage || 'Error al procesar el pago';
      case 'VOIDED':
        return 'El pago fue anulado';
      case 'EXPIRED':
        return 'El pago expiró';
      case 'PENDING':
        return 'Procesando pago...';
      default:
        return 'Estado desconocido';
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
      <div className="flex items-center space-x-3">
        {getStatusIcon()}
        <div className="flex-1">
          <div className="font-medium">Estado del Pago</div>
          <div className="text-sm mt-1">{getStatusMessage()}</div>
          {status?.transactionId && (
            <div className="text-xs mt-1 opacity-75">ID de transacción: {status.transactionId}</div>
          )}
          {status?.lastUpdated && (
            <div className="text-xs mt-1 opacity-75">
              Actualizado: {new Date(status.lastUpdated).toLocaleString('es-CO')}
            </div>
          )}
        </div>
        {status?.status === 'PENDING' && (
          <div className="text-xs text-center">
            <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1" />
            <div>Verificando...</div>
          </div>
        )}
      </div>
    </div>
  );
}
