# Implementación de Eventos de Wompi

Esta documentación explica cómo se implementó la validación de eventos de Wompi según la documentación oficial.

## 📋 Resumen de la Implementación

### 1. **Análisis del `handlePaymentSubmit`**

El flujo actual en `Order.tsx`:

1. Crea una orden en la base de datos
2. Crea un registro de pago con estado `PENDING`
3. Genera datos para Wompi con firma de integridad
4. Redirige al usuario al checkout de Wompi
5. Wompi procesa el pago y envía eventos a nuestro webhook
6. El webhook actualiza el estado del pago según el resultado

### 2. **Validación de Eventos según Documentación de Wompi**

#### **Tipos de Eventos Procesados:**

- `transaction.updated`: Cambio de estado de transacción
- `nequi_token.updated`: Cambio de estado de token Nequi
- `bancolombia_transfer_token.updated`: Cambio de estado de token Bancolombia

#### **Validación de Firma (Según Documentación):**

```typescript
// Paso 1: Concatenar valores de propiedades
const concatenatedData = signature.properties.map(prop => getNestedProperty(event.data, prop)).join('');

// Paso 2: Agregar timestamp
concatenatedData += event.timestamp;

// Paso 3: Agregar secreto de eventos
concatenatedData += eventsSecret;

// Paso 4: Generar SHA256
const checksum = crypto.createHash('sha256').update(concatenatedData).digest('hex');

// Paso 5: Comparar con checksum del evento
return checksum.toUpperCase() === event.signature.checksum.toUpperCase();
```

### 3. **Arquitectura de Componentes**

#### **WompiEventValidator** (`/src/utils/wompiEventValidator.ts`)

- Valida autenticidad de eventos según documentación oficial
- Verifica edad de eventos (previene ataques de replay)
- Valida entorno (test vs prod)
- Mapea estados de Wompi a estados internos

#### **Webhook Actualizado** (`/src/app/api/webhooks/wompi/route.ts`)

- Usa el validador oficial de eventos
- Maneja diferentes tipos de eventos
- Actualiza pagos en base de datos vía GraphQL
- Registra logs detallados para debugging

#### **OrderSuccess Mejorado** (`/src/components/OrderSuccess/OrderSuccess.tsx`)

- Valida parámetros de URL contra datos de base de datos
- Polling inteligente para estados pendientes
- Manejo de estados de validación (válido/inválido/desajuste)
- UI adaptativa según estado del pago

## 🔧 Configuración Requerida

### **Variables de Entorno**

```bash
# Claves públicas (frontend)
NEXT_PUBLIC_WOMPI_PUBLIC_KEY_TEST=pub_test_...
NEXT_PUBLIC_WOMPI_PUBLIC_KEY_PROD=pub_prod_...

# Secretos de eventos (backend)
WOMPI_EVENTS_SECRET_TEST=test_events_...
WOMPI_EVENTS_SECRET_PROD=prod_events_...

# Secretos de integridad (backend)
WOMPI_INTEGRITY_SECRET_TEST=test_integrity_...
WOMPI_INTEGRITY_SECRET_PROD=prod_integrity_...
```

### **Configuración en Dashboard de Wompi**

1. URL de eventos para Test: `https://tu-dominio.com/api/webhooks/wompi`
2. URL de eventos para Producción: `https://tu-dominio.com/api/webhooks/wompi`

## 🔄 Flujo Completo de Pago

### **1. Inicio del Pago (Order.tsx)**

```typescript
// Crear orden y pago
const order = await createOrder(orderInput);
const payment = await createPayment(paymentInput);

// Generar datos Wompi con firma
const wompiData = {
  'public-key': publicKey,
  reference: payment.id,
  'amount-in-cents': amountInCents,
  'signature:integrity': integritySignature,
  // ... otros campos
};

// Redirigir a Wompi
window.location.href = `https://checkout.wompi.co/p/?${params}`;
```

### **2. Procesamiento en Wompi**

- Usuario completa el pago en la plataforma de Wompi
- Wompi procesa la transacción
- Wompi envía evento `transaction.updated` a nuestro webhook
- Wompi redirige al usuario a `/orden-exitosa`

### **3. Webhook de Eventos**

```typescript
// Validar evento
const isValid = validator.validateEvent(event);
if (!isValid) return 401;

// Mapear estado
const newStatus = mapWompiTransactionStatus(transaction.status);

// Actualizar en base de datos
await apolloClient.mutate({
  mutation: UPDATE_PAYMENT,
  variables: { id: payment.id, input: { status: newStatus } },
});
```

### **4. Página de Éxito**

```typescript
// Extraer parámetros de Wompi
const wompiParams = extractFromURL();
const paymentId = searchParams.get('payment');

// Consultar estado actual
const { data: payment } = useQuery(GET_PAYMENT, {
  variables: { id: paymentId },
  pollInterval: 3000, // Polling mientras sea PENDING
});

// Validar consistencia
const isValid = validateWompiResponse(payment, wompiParams);
```

## 🛡️ Seguridad

### **Validaciones Implementadas:**

- ✅ Firma criptográfica SHA256 según documentación
- ✅ Verificación de edad de eventos (60 minutos máximo)
- ✅ Validación de entorno (test/prod)
- ✅ Verificación de referencia de pago
- ✅ Validación de monto y moneda
- ✅ Prevención de ataques de replay

### **Mejores Prácticas:**

- Secretos de eventos solo en backend
- Logs detallados para auditoría
- Manejo de errores sin exponer información sensible
- Polling limitado para evitar sobrecarga

## 🐛 Debugging

### **Logs de Webhook:**

```bash
# Ver logs del webhook
tail -f logs/webhook.log

# Verificar eventos recibidos
grep "Processing Wompi event" logs/webhook.log
```

### **Validación en OrderSuccess:**

- En desarrollo, se muestra panel de debug con:
  - Parámetros de Wompi recibidos
  - Datos de pago de base de datos
  - Estado de validación actual

### **Estados de Validación:**

- `validating`: Verificando datos inicialmente
- `valid`: Datos válidos, pago procesado correctamente
- `invalid`: Datos de Wompi no coinciden con registro
- `mismatch`: Wompi reporta éxito pero DB aún no actualizada

## 📊 Monitoreo

### **Métricas Recomendadas:**

- Eventos de webhook recibidos vs procesados exitosamente
- Tiempo entre evento y actualización de base de datos
- Discrepancias entre estado Wompi y base de datos
- Errores de validación de firma

### **Alertas Sugeridas:**

- Eventos con firma inválida
- Eventos muy antiguos (posible ataque de replay)
- Desajustes de estado por más de 5 minutos
- Errores de actualización en base de datos

## 🔄 Posibles Mejoras

1. **Queue de Eventos**: Procesar eventos de forma asíncrona
2. **Retry Logic**: Reintentar actualizaciones fallidas
3. **Notificaciones**: Enviar emails según estado del pago
4. **Analytics**: Tracking de conversión y abandono
5. **Cache**: Cachear consultas de pago para mejor performance
