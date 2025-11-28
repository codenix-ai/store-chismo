import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  try {
    const { reference } = await params;

    // In a real app, fetch from database
    // const order = await prisma.order.findUnique({
    //   where: { reference },
    //   include: {
    //     payments: {
    //       orderBy: { createdAt: 'desc' },
    //       take: 1
    //     }
    //   }
    // });

    // Mock data for development - simulate different payment states
    const mockStatuses = ['PENDING', 'APPROVED', 'DECLINED', 'ERROR'];
    const randomStatus = mockStatuses[Math.floor(Math.random() * mockStatuses.length)];

    const mockPaymentStatus = {
      orderId: reference,
      status: randomStatus,
      statusMessage: getStatusMessage(randomStatus),
      transactionId: `txn_${Math.random().toString(36).substr(2, 9)}`,
      amount: 368543,
      paymentMethod: 'CARD',
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(mockPaymentStatus);
  } catch (error) {
    console.error('Error fetching payment status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getStatusMessage(status: string): string {
  switch (status) {
    case 'APPROVED':
      return 'Transacción aprobada exitosamente';
    case 'DECLINED':
      return 'Transacción rechazada por el banco emisor';
    case 'ERROR':
      return 'Error al procesar la transacción';
    case 'VOIDED':
      return 'Transacción anulada';
    case 'EXPIRED':
      return 'Transacción expirada';
    case 'PENDING':
    default:
      return 'Transacción en proceso de verificación';
  }
}
