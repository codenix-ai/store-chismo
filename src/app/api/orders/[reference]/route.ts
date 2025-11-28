import { NextRequest, NextResponse } from 'next/server';

// Enum for order status
enum OrderStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  ERROR = 'ERROR',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  VOIDED = 'VOIDED',
}

// Interface for payment failure reasons
interface PaymentFailureDetails {
  reason_code?: string;
  reason_message?: string;
  processor_response_code?: string;
  decline_reason?: string;
  suggested_action?: string;
}

// This would be replaced with your actual database query
// Example API endpoint to get order data by reference
export async function GET(request: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  try {
    const { reference } = await params;

    // TODO: Replace with actual database query
    // Example: const order = await db.orders.findUnique({ where: { reference } });

    // For now, return mock data based on the reference
    const mockOrder = {
      id: reference,
      reference: reference,
      status: 'APPROVED',
      total: 368543,
      subtotal: 309700,
      tax: 58843,
      shipping: 0,
      createdAt: new Date().toISOString(),
      paymentAttempts: 1, // Track number of payment attempts
      maxPaymentAttempts: 3, // Allow up to 3 attempts
      items: [
        {
          id: '1',
          productId: 'prod_1',
          name: 'Producto desde API',
          image: '/placeholder-image.svg',
          variant: 'Talla M, Color Azul',
          quantity: 2,
          price: 89900,
        },
        {
          id: '2',
          productId: 'prod_2',
          name: 'Producto desde API 2',
          image: '/placeholder-image.svg',
          variant: 'Talla L',
          quantity: 1,
          price: 129900,
        },
      ],
      address: {
        id: 'addr_1',
        name: 'Juan Pérez API',
        street: 'Calle 123 #45-67 (desde API)',
        city: 'Bogotá',
        department: 'Cundinamarca',
        phone: '+57 300 123 4567',
      },
      user: {
        id: 'user_1',
        email: 'user@example.com',
        name: 'Juan Pérez',
      },
      paymentDetails: {
        transactionId: 'wompi_tx_123456789',
        method: 'CARD',
        status: 'APPROVED',
        failureDetails: null, // Will contain failure info if payment failed
        processorResponse: {
          // This would contain the Wompi response details
        },
      },
    };

    return NextResponse.json(mockOrder);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
}

// Endpoint to update order with Wompi payment confirmation (including failures)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  try {
    const { reference } = await params;
    const wompiData = await request.json();

    // Determine if payment failed and extract failure details
    const isPaymentFailed = ['DECLINED', 'ERROR', 'VOIDED'].includes(wompiData.status);
    let failureDetails: PaymentFailureDetails | null = null;

    if (isPaymentFailed) {
      failureDetails = extractFailureDetails(wompiData);
    }

    // TODO: Update order in database with Wompi payment details
    // Example:
    // const updatedOrder = await db.orders.update({
    //   where: { reference },
    //   data: {
    //     paymentStatus: wompiData.status,
    //     transactionId: wompiData.id,
    //     paymentMethod: wompiData.payment_method_type,
    //     paymentDetails: wompiData,
    //     failureDetails: failureDetails,
    //     paymentAttempts: { increment: 1 },
    //     lastPaymentAttempt: new Date(),
    //     updatedAt: new Date(),
    //   }
    // });

    // Handle failed payments
    if (isPaymentFailed) {
      // Log payment failure for analytics
      await logPaymentFailure(reference, wompiData, failureDetails);

      // Send notification to customer about failed payment
      await sendPaymentFailureNotification(reference, wompiData, failureDetails);

      // Check if we should offer retry or alternative payment methods
      const retryOptions = await generateRetryOptions(reference, wompiData);

      return NextResponse.json({
        success: true,
        message: 'Payment failure recorded',
        paymentFailed: true,
        failureDetails,
        retryOptions,
      });
    }

    // Handle successful payments
    if (wompiData.status === 'APPROVED') {
      // Send confirmation email
      await sendPaymentConfirmationEmail(reference, wompiData);

      // Update inventory
      await updateInventory(reference, 'reserve');

      // Trigger fulfillment process
      await triggerFulfillment(reference);
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      paymentFailed: false,
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

// Helper function to extract failure details from Wompi response
function extractFailureDetails(wompiData: any): PaymentFailureDetails {
  return {
    reason_code: wompiData.status_message || wompiData.processor_response_code,
    reason_message: getFailureMessage(wompiData.status, wompiData.status_message),
    processor_response_code: wompiData.processor_response_code,
    decline_reason: wompiData.decline_reason,
    suggested_action: getSuggestedAction(wompiData.status, wompiData.status_message),
  };
}

// Get user-friendly failure message
function getFailureMessage(status: string, statusMessage?: string): string {
  const failureMessages: Record<string, string> = {
    DECLINED: 'Tu tarjeta fue rechazada por el banco emisor',
    ERROR: 'Ocurrió un error técnico durante el procesamiento',
    VOIDED: 'La transacción fue anulada',
    EXPIRED: 'El tiempo para completar el pago expiró',
  };

  return failureMessages[status] || statusMessage || 'Pago no procesado correctamente';
}

// Get suggested action for failed payment
function getSuggestedAction(status: string, statusMessage?: string): string {
  if (status === 'DECLINED') {
    if (statusMessage?.includes('insufficient_funds')) {
      return 'Verifica que tengas fondos suficientes o usa otra tarjeta';
    }
    if (statusMessage?.includes('card_expired')) {
      return 'Tu tarjeta ha expirado, usa una tarjeta vigente';
    }
    if (statusMessage?.includes('invalid_card')) {
      return 'Verifica los datos de tu tarjeta o usa otra tarjeta';
    }
    return 'Contacta a tu banco o intenta con otra tarjeta';
  }

  if (status === 'ERROR') {
    return 'Intenta nuevamente en unos minutos o usa otro método de pago';
  }

  return 'Intenta nuevamente o contacta nuestro soporte';
}

// Mock functions (implement with your actual services)
async function logPaymentFailure(reference: string, wompiData: any, failureDetails: PaymentFailureDetails | null) {
  console.log(`Payment failure logged for order ${reference}:`, { wompiData, failureDetails });
  // TODO: Implement actual logging (database, analytics, etc.)
}

async function sendPaymentFailureNotification(
  reference: string,
  wompiData: any,
  failureDetails: PaymentFailureDetails | null
) {
  console.log(`Payment failure notification sent for order ${reference}`);
  // TODO: Implement email/SMS notification service
}

async function generateRetryOptions(reference: string, wompiData: any) {
  // TODO: Logic to determine if retry is allowed and what payment methods to offer
  return {
    canRetry: true,
    maxAttemptsReached: false,
    alternativePaymentMethods: ['PSE', 'NEQUI', 'CASH_ON_DELIVERY'],
    newPaymentUrl: `/checkout/retry/${reference}`,
  };
}

async function sendPaymentConfirmationEmail(reference: string, wompiData: any) {
  console.log(`Payment confirmation sent for order ${reference}`);
  // TODO: Implement email service
}

async function updateInventory(reference: string, action: 'reserve' | 'release') {
  console.log(`Inventory ${action} for order ${reference}`);
  // TODO: Implement inventory management
}

async function triggerFulfillment(reference: string) {
  console.log(`Fulfillment triggered for order ${reference}`);
  // TODO: Implement fulfillment process
}
