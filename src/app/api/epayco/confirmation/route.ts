import { NextRequest, NextResponse } from "next/server";

/**
 * Endpoint de confirmación para ePayco Standard Checkout
 * ePayco envía una notificación POST a esta URL cuando se procesa un pago
 */
export async function POST(request: NextRequest) {
  try {
    console.log("📨 ePayco confirmation webhook received");

    // Obtener los datos de ePayco
    const body = await request.json();
    console.log("📝 ePayco confirmation data:", JSON.stringify(body, null, 2));

    // Los parámetros que envía ePayco son:
    // - x_cust_id_cliente: ID del cliente
    // - x_ref_payco: Referencia de ePayco
    // - x_id_invoice: ID de la factura (nuestro orderId)
    // - x_description: Descripción
    // - x_amount: Monto
    // - x_amount_country: Monto en moneda del país
    // - x_amount_ok: Monto OK
    // - x_tax: Impuesto
    // - x_amount_base: Monto base
    // - x_currency_code: Código de moneda
    // - x_bank_name: Nombre del banco
    // - x_cardnumber: Número de tarjeta (enmascarado)
    // - x_quotas: Número de cuotas
    // - x_response: Código de respuesta
    // - x_approval_code: Código de aprobación
    // - x_transaction_id: ID de transacción
    // - x_fecha_transaccion: Fecha de transacción
    // - x_cod_response: Código de respuesta
    // - x_response_reason_text: Texto de respuesta
    // - x_cod_transaction_state: Estado de la transacción
    // - x_transaction_state: Estado de la transacción (Aceptada, Rechazada, Pendiente, Fallida)
    // - x_errorcode: Código de error
    // - x_franchise: Franquicia
    // - x_business: Negocio
    // - x_customer_doctype: Tipo de documento del cliente
    // - x_customer_document: Documento del cliente
    // - x_customer_name: Nombre del cliente
    // - x_customer_lastname: Apellido del cliente
    // - x_customer_email: Email del cliente
    // - x_customer_phone: Teléfono del cliente
    // - x_customer_movil: Móvil del cliente
    // - x_customer_ind_pais: Indicativo del país
    // - x_customer_country: País del cliente
    // - x_customer_city: Ciudad del cliente
    // - x_customer_address: Dirección del cliente
    // - x_customer_ip: IP del cliente
    // - x_signature: Firma para validar integridad

    const {
      x_id_invoice,
      x_transaction_id,
      x_amount,
      x_currency_code,
      x_transaction_state,
      x_cod_transaction_state,
      x_ref_payco,
      x_response,
      x_approval_code,
      x_fecha_transaccion,
      x_customer_email,
      x_customer_name,
      x_customer_lastname,
      x_signature,
    } = body;

    // Validar firma (opcional pero recomendado)
    if (x_signature) {
      // TODO: Implementar validación de firma
      // La firma se genera con: MD5(x_cust_id_cliente + '^' + x_ref_payco + '^' + x_id_invoice + '^' + x_amount + '^' + x_currency_code + '^' + llave_secreta)
      console.log("🔒 Signature verification would go here:", x_signature);
    }

    // Determinar el estado del pago
    let paymentStatus = "PENDING";
    if (x_cod_transaction_state === "1") {
      paymentStatus = "COMPLETED";
    } else if (x_cod_transaction_state === "2") {
      paymentStatus = "REJECTED";
    } else if (x_cod_transaction_state === "3") {
      paymentStatus = "PENDING";
    } else if (x_cod_transaction_state === "4") {
      paymentStatus = "FAILED";
    }

    console.log(
      `💳 Payment status: ${paymentStatus} for order: ${x_id_invoice}`
    );

    // Aquí deberías actualizar el estado del pedido en tu base de datos
    // Ejemplo:
    // await updateOrderPaymentStatus(x_id_invoice, {
    //   status: paymentStatus,
    //   transactionId: x_transaction_id,
    //   paymentProvider: 'EPAYCO',
    //   amount: parseFloat(x_amount),
    //   currency: x_currency_code,
    //   epaycoReference: x_ref_payco,
    //   approvalCode: x_approval_code,
    //   transactionDate: x_fecha_transaccion,
    //   customerEmail: x_customer_email
    // });

    // Log para debug
    console.log("✅ Payment confirmation processed successfully");

    // ePayco espera una respuesta exitosa
    return NextResponse.json({
      status: "success",
      message: "Payment confirmation received",
    });
  } catch (error) {
    console.error("❌ Error processing ePayco confirmation:", error);

    // Aún así, respondemos success para que ePayco no reintente
    return NextResponse.json(
      {
        status: "error",
        message: "Error processing confirmation",
      },
      { status: 500 }
    );
  }
}

// También manejar GET en caso de que ePayco envíe parámetros por URL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    console.log("📨 ePayco confirmation GET received:", params);

    return NextResponse.json({
      status: "success",
      message: "GET confirmation received",
    });
  } catch (error) {
    console.error("❌ Error processing ePayco GET confirmation:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Error processing GET confirmation",
      },
      { status: 500 }
    );
  }
}
