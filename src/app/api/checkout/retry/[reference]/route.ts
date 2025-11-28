import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  try {
    const { reference } = await params;

    // In a real app, fetch from database
    // const order = await prisma.order.findUnique({
    //   where: { reference },
    //   include: {
    //     items: true,
    //     payments: true
    //   }
    // });

    // Mock data for development
    const mockOrder = {
      id: '1',
      reference: reference,
      status: 'PENDING',
      total: 368543,
      failedAttempts: 1,
      maxAttempts: 3,
      lastFailureReason: 'Tu tarjeta fue rechazada por el banco emisor',
      customerEmail: 'customer@example.com',
      items: [
        {
          id: '1',
          name: 'Producto Ejemplo 1',
          price: 179800,
          quantity: 2,
          image: '/assets/img1.png',
        },
        {
          id: '2',
          name: 'Producto Ejemplo 2',
          price: 129900,
          quantity: 1,
          image: '/assets/img2.png',
        },
      ],
      payments: [
        {
          id: '1',
          status: 'DECLINED',
          amount: 368543,
          paymentMethod: 'CARD',
          failureReason: 'Tu tarjeta fue rechazada por el banco emisor',
          createdAt: new Date().toISOString(),
        },
      ],
    };

    if (!mockOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      order: mockOrder,
      canRetry: mockOrder.failedAttempts < mockOrder.maxAttempts,
      retryOptions: {
        availableMethods: ['CARD', 'PSE', 'NEQUI'],
        recommendedMethod: mockOrder.payments[0]?.paymentMethod === 'CARD' ? 'PSE' : 'CARD',
      },
    });
  } catch (error) {
    console.error('Error fetching order for retry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  try {
    const { reference } = await params;
    const body = await request.json();
    const { paymentMethod } = body;

    // In a real app, update the order and create new payment attempt
    // const order = await prisma.order.update({
    //   where: { reference },
    //   data: {
    //     failedAttempts: { increment: 1 }
    //   }
    // });

    // const newPaymentAttempt = await prisma.payment.create({
    //   data: {
    //     orderId: order.id,
    //     status: 'PENDING',
    //     paymentMethod,
    //     amount: order.total
    //   }
    // });

    // Generate new payment reference for retry
    const newReference = `${reference}_retry_${Date.now()}`;

    // Generate Wompi payment URL
    const wompiData = {
      publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || 'pub_test_G6jyWcpGlLJG8ATDRf9u6gLKy3MH8J',
      currency: 'COP',
      amountInCents: 36854300, // Mock amount * 100
      reference: newReference,
      redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/orden-exitosa`,
      customerEmail: 'customer@example.com',
      paymentMethods: [paymentMethod],
    };

    // In production, generate integrity signature
    const integritySignature = 'mock-signature-for-development';

    return NextResponse.json({
      success: true,
      paymentUrl: 'https://checkout.wompi.co/p/',
      paymentData: wompiData,
      integritySignature,
      newReference,
    });
  } catch (error) {
    console.error('Error creating payment retry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
