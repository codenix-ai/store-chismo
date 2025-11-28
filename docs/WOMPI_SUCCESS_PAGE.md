# Integración Wompi - Página de Éxito

## Descripción General

La página de éxito (`/orden-exitosa`) está configurada para recibir y procesar los parámetros de retorno de Wompi después de completar un pago. Esta implementación captura automáticamente los datos del pago y los muestra al usuario.

## Parámetros de Wompi

Cuando Wompi redirige a tu página de éxito, incluye los siguientes parámetros en la URL:

### Parámetros Principales

- `id`: ID único de la transacción en Wompi
- `status`: Estado del pago (`APPROVED`, `DECLINED`, `ERROR`, `PENDING`)
- `reference`: Tu referencia de pago (generada en el checkout)
- `payment_method_type`: Tipo de método de pago (`CARD`, `PSE`, `NEQUI`, etc.)
- `amount_in_cents`: Monto en centavos
- `currency`: Moneda de la transacción (generalmente `COP`)
- `customer_email`: Email del cliente

### Parámetros de Tarjeta (si aplica)

- `payment_method.extra.brand`: Marca de la tarjeta (Visa, Mastercard, etc.)
- `payment_method.extra.last_four`: Últimos 4 dígitos de la tarjeta
- `payment_method.extra.card_holder`: Nombre del titular de la tarjeta

## Ejemplo de URL de Retorno

```
https://tu-tienda.com/orden-exitosa?id=24049-1640788829-49201&status=APPROVED&reference=ORDER_1640788829000_abc123&payment_method_type=CARD&amount_in_cents=2490000&currency=COP&customer_email=cliente@email.com&payment_method.extra.brand=VISA&payment_method.extra.last_four=1234&payment_method.extra.card_holder=JUAN+PEREZ
```

## Funcionalidades Implementadas

### 1. Captura Automática de Parámetros

El componente `OrderSuccess` automáticamente:

- Extrae todos los parámetros de Wompi de la URL
- Los parsea y valida
- Los almacena en el estado del componente

### 2. Estados de Pago

La página muestra diferentes estados basados en la respuesta de Wompi:

#### ✅ APPROVED (Aprobado)

- Icono: CheckCircle verde
- Mensaje: "¡Pago Aprobado!"
- Color de fondo: Verde claro

#### ❌ DECLINED (Rechazado)

- Icono: XCircle rojo
- Mensaje: "Pago Rechazado"
- Color de fondo: Rojo claro

#### ⚠️ ERROR (Error)

- Icono: AlertCircle rojo
- Mensaje: "Error en el Pago"
- Color de fondo: Rojo claro

#### ⏳ PENDING (Pendiente)

- Icono: AlertCircle amarillo
- Mensaje: "Pago Pendiente"
- Color de fondo: Amarillo claro

### 3. Información Detallada

La página muestra:

- Número de orden/referencia
- ID de transacción de Wompi
- Estado del pago
- Información de la tarjeta (si está disponible)
- Monto total pagado
- Detalles del pedido

### 4. Integración con API

El componente intenta:

1. Obtener datos de la orden desde tu API (`/api/orders/[reference]`)
2. Actualizar la orden con los datos de Wompi
3. Usar datos mock como fallback si la API no está disponible

## Configuración Requerida

### Variables de Entorno

```env
NEXT_PUBLIC_WOMPI_PUBLIC_KEY=pub_test_your_public_key
NEXT_PUBLIC_WOMPI_INTEGRITY_SECRET=prod_integrity_your_secret
```

### URL de Redirección en Wompi

En tu formulario de pago, configura:

```javascript
redirectUrl: `${window.location.origin}/orden-exitosa`;
```

## Implementación en Producción

### 1. API de Órdenes

Implementa los endpoints en `/api/orders/[reference]/route.ts`:

```typescript
// GET: Obtener datos de la orden
export async function GET(request, { params }) {
  const order = await db.orders.findUnique({
    where: { reference: params.reference },
    include: { items: true, address: true, user: true },
  });
  return NextResponse.json(order);
}

// PATCH: Actualizar orden con datos de Wompi
export async function PATCH(request, { params }) {
  const wompiData = await request.json();
  await db.orders.update({
    where: { reference: params.reference },
    data: {
      paymentStatus: wompiData.status,
      transactionId: wompiData.id,
      paymentDetails: wompiData,
    },
  });
  return NextResponse.json({ success: true });
}
```

### 2. Webhook de Confirmación

Para mayor seguridad, implementa un webhook que Wompi llame directamente:

```typescript
// /api/webhooks/wompi/route.ts
export async function POST(request: NextRequest) {
  const wompiEvent = await request.json();

  // Verificar firma del webhook
  if (!verifyWompiSignature(wompiEvent, request.headers)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Procesar evento de Wompi
  if (wompiEvent.event === 'transaction.updated') {
    await updateOrderStatus(wompiEvent.data);
  }

  return NextResponse.json({ received: true });
}
```

## Debug y Pruebas

### Modo Desarrollo

En desarrollo, la página muestra:

- Panel de debug con todos los parámetros de Wompi
- JSON completo de la respuesta
- Lista de todos los parámetros URL recibidos

### URLs de Prueba

Para probar diferentes estados:

```bash
# Pago aprobado
/orden-exitosa?status=APPROVED&reference=TEST_123&id=wompi_456&amount_in_cents=100000

# Pago rechazado
/orden-exitosa?status=DECLINED&reference=TEST_124&id=wompi_457

# Error
/orden-exitosa?status=ERROR&reference=TEST_125&id=wompi_458
```

## Seguridad

### Validaciones Importantes

1. **Verificación de Firma**: En producción, verifica la firma de integridad
2. **Validación de Monto**: Confirma que el monto coincide con tu orden
3. **Estado Idempotente**: Maneja múltiples redirects al mismo endpoint
4. **Webhook Backup**: Usa webhooks como fuente de verdad, no solo los parámetros URL

### Mejores Prácticas

- Nunca confíes solo en los parámetros URL para confirmar pagos
- Usa webhooks para notificaciones críticas
- Implementa timeouts para transacciones pendientes
- Registra todos los eventos de pago para auditoría

## Personalización

### Colores y Temas

El componente respeta la configuración de colores de la tienda:

```typescript
style={{ backgroundColor: store?.primaryColor || '#2563eb' }}
```

### Métodos de Pago

Personaliza los nombres de métodos de pago en `getPaymentMethodName()`:

```typescript
case 'NEQUI':
  return 'Nequi';
case 'PSE':
  return 'PSE - Pago Seguro en Línea';
// Agregar más métodos según necesidad
```

### Mensajes Personalizados

Modifica los mensajes en `getStatusInfo()` según tu marca y tono de comunicación.
