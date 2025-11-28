import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { apolloClient } from '@/lib/apollo';
import { UPDATE_PAYMENT, GET_PAYMENT } from '@/lib/graphql/queries';
import { PaymentStatus } from '@/types/payment';
import {
  WompiEventValidator,
  parseWompiWebhook,
  shouldProcessEvent,
  mapWompiTransactionStatus,
  extractTransactionInfo,
  type WompiEvent
} from '@/utils/wompiEventValidator';

// Map our internal PaymentStatus to the validator's return type
const mapToPaymentStatus = (status: string): PaymentStatus => {
  switch (status) {
    case 'COMPLETED':
      return PaymentStatus.COMPLETED;
    case 'FAILED':
      return PaymentStatus.FAILED;
    case 'CANCELLED':
      return PaymentStatus.CANCELLED;
    case 'PENDING':
    default:
      return PaymentStatus.PENDING;
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    
    // Parse the webhook event
    const event = parseWompiWebhook(body);
    if (!event) {
      console.error('Failed to parse Wompi webhook');
      return NextResponse.json({ error: 'Invalid webhook format' }, { status: 400 });
    }

    // Extract headers for additional validation
    const headersList = await headers();
    const eventChecksum = headersList.get('x-event-checksum');

    // Get environment-specific events secret
    const isProduction = process.env.NODE_ENV === 'production';
    const eventsSecret = isProduction 
      ? process.env.WOMPI_EVENTS_SECRET_PROD 
      : process.env.WOMPI_EVENTS_SECRET_TEST;

    if (!eventsSecret) {
      console.error('Wompi events secret not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Initialize validator
    const validator = new WompiEventValidator(eventsSecret);

    // Validate event authenticity
    if (!validator.validateEvent(event)) {
      console.error('Invalid Wompi webhook signature');
      console.log('Expected environment:', isProduction ? 'prod' : 'test');
      console.log('Event environment:', event.environment);
      console.log('Event checksum from header:', eventChecksum);
      console.log('Event checksum from body:', event.signature.checksum);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Validate event age (prevent replay attacks)
    if (!validator.validateEventAge(event, 60)) {
      console.error('Wompi webhook event is too old');
      return NextResponse.json({ error: 'Event too old' }, { status: 400 });
    }

    // Validate environment matches
    const expectedEnvironment = isProduction ? 'prod' : 'test';
    if (!validator.validateEnvironment(event, expectedEnvironment)) {
      console.error(`Environment mismatch. Expected: ${expectedEnvironment}, Got: ${event.environment}`);
      return NextResponse.json({ error: 'Environment mismatch' }, { status: 400 });
    }

    // Check if we should process this event type
    if (!shouldProcessEvent(event.event)) {
      console.log(`Ignoring event type: ${event.event}`);
      return NextResponse.json({ message: 'Event type not processed' }, { status: 200 });
    }

    // Extract transaction info for logging
    const transactionInfo = extractTransactionInfo(event);
    console.log('Processing Wompi event:', {
      event: event.event,
      transactionId: transactionInfo.transactionId,
      reference: transactionInfo.reference,
      status: transactionInfo.status,
      environment: transactionInfo.environment
    });

    // Get transaction data
    const transaction = event.data.transaction;
    const paymentReference = transaction.reference;

    // Get the payment from our database using the reference
    const { data: paymentData } = await apolloClient.query({
      query: GET_PAYMENT,
      variables: { id: paymentReference },
      fetchPolicy: 'network-only' // Always fetch fresh data
    });

    if (!paymentData?.payment) {
      console.error('Payment not found for reference:', paymentReference);
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const payment = paymentData.payment;
    const mappedStatus = mapWompiTransactionStatus(transaction.status);
    const newStatus = mapToPaymentStatus(mappedStatus);

    // Only update if status actually changed
    if (payment.status === newStatus) {
      console.log(`Payment ${payment.id} status unchanged: ${newStatus}`);
      return NextResponse.json({ message: 'Status unchanged' }, { status: 200 });
    }

    // Prepare comprehensive update data
    const updateData = {
      status: newStatus,
      providerTransactionId: transaction.id,
      referenceNumber: transaction.reference,
      ...(transaction.status_message && { 
        errorMessage: transaction.status_message 
      }),
      ...(newStatus === PaymentStatus.FAILED && {
        errorCode: `WOMPI_${transaction.status.toUpperCase()}`,
        errorMessage: transaction.status_message || 'Payment failed',
      }),
      ...(newStatus === PaymentStatus.COMPLETED && {
        completedAt: transaction.finalized_at ? new Date(transaction.finalized_at) : new Date(),
      }),
      notes: JSON.stringify({
        wompiEvent: event.event,
        transactionId: transaction.id,
        status: transaction.status,
        statusMessage: transaction.status_message,
        paymentMethod: transaction.payment_method_type,
        processedAt: new Date().toISOString(),
        environment: event.environment
      })
    };

    // Update payment in database
    const { data: updatedPayment } = await apolloClient.mutate({
      mutation: UPDATE_PAYMENT,
      variables: {
        id: payment.id,
        input: updateData,
      },
    });

    console.log('Payment updated successfully:', {
      paymentId: updatedPayment.updatePayment.id,
      oldStatus: payment.status,
      newStatus: newStatus,
      transactionId: transaction.id
    });

    // Return success response
    return NextResponse.json(
      {
        message: 'Webhook processed successfully',
        paymentId: payment.id,
        transactionId: transaction.id,
        oldStatus: payment.status,
        newStatus: newStatus,
        processedAt: new Date().toISOString()
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    
    // Return error response but don't expose internal details
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to process webhook'
      },
      { status: 500 }
    );
  }
}