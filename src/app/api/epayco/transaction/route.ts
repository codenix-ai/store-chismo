import { NextRequest, NextResponse } from "next/server";

interface EpaycoTransactionResponse {
  success: boolean;
  title: string;
  textResponse: string;
  transactionResponse: string;
  transactionState: string;
  data: {
    x_cust_id_cliente: string;
    x_ref_payco: string;
    x_id_invoice: string;
    x_description: string;
    x_amount: string;
    x_amount_country: string;
    x_amount_ok: string;
    x_tax: string;
    x_amount_base: string;
    x_currency_code: string;
    x_bank_name: string;
    x_cardnumber: string;
    x_quotas: string;
    x_respuesta: string;
    x_response: string;
    x_approval_code: string;
    x_transaction_id: string;
    x_fecha_transaccion: string;
    x_transaction_date: string;
    x_cod_response: string;
    x_cod_transaction_state: string;
    x_errorcode: string;
    x_franchise: string;
    x_business: string;
    x_customer_doctype: string;
    x_customer_document: string;
    x_customer_name: string;
    x_customer_lastname: string;
    x_customer_email: string;
    x_customer_phone: string;
    x_customer_mobile: string;
    x_customer_ind_pais: string;
    x_customer_country: string;
    x_customer_city: string;
    x_customer_address: string;
    x_signature: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { ref_payco } = await request.json();

    if (!ref_payco) {
      return NextResponse.json(
        { error: "ref_payco is required" },
        { status: 400 }
      );
    }

    console.log("🔍 Consultando transacción ePayco:", ref_payco);

    // ePayco API endpoint para consultar transacciones
    const apiUrl =
      process.env.EPAYCO_TEST_MODE === "true"
        ? "https://sandbox.epayco.co/validation/v1/reference"
        : "https://secure.epayco.co/validation/v1/reference";

    const response = await fetch(`${apiUrl}/${ref_payco}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(
        "❌ Error en respuesta de ePayco:",
        response.status,
        response.statusText
      );
      throw new Error(`ePayco API error: ${response.status}`);
    }

    const result: EpaycoTransactionResponse = await response.json();
    console.log("📦 Respuesta de ePayco:", result);

    // Verificar si la respuesta es exitosa
    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
        title: result.title,
        textResponse: result.textResponse,
        transactionResponse: result.transactionResponse,
        transactionState: result.transactionState,
      });
    } else {
      console.warn("⚠️ Transacción no encontrada o no exitosa:", result);
      return NextResponse.json({
        success: false,
        error: result.textResponse || "Transaction not found",
        data: result.data || null,
      });
    }
  } catch (error) {
    console.error("❌ Error consultando transacción ePayco:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        data: null,
      },
      { status: 500 }
    );
  }
}
