# Implementación de Polling para Transacciones Wompi

## Descripción

Se ha implementado un sistema de polling en el componente `PaymentValidation` que consulta directamente el endpoint de Wompi para obtener el estado actual de una transacción.

## Funcionalidades Implementadas

### 1. Polling Automático

- Consulta la API de Wompi cada 5 segundos
- Se detiene automáticamente cuando la transacción está en estado final
- Timeout automático después de 5 minutos

### 2. Estados de Transacción Wompi

El sistema mapea los estados de Wompi a estados internos:

- `APPROVED` → `COMPLETED`
- `DECLINED` → `FAILED`
- `ERROR` → `FAILED`
- `VOIDED` → `CANCELLED`
- `PENDING` → `PENDING`

### 3. Integración Dual

- Mantiene compatibilidad con GraphQL existente
- Prioriza datos de Wompi cuando están disponibles
- Fallback a datos de GraphQL

## API Endpoint Utilizado

```
GET https://sandbox.wompi.co/v1/transactions/{transaction_id}
```

### Ejemplo de Respuesta

```json
{
  "data": {
    "id": "11971740-1758575662-83397",
    "status": "APPROVED",
    "status_message": "Transacción aprobada",
    "amount_in_cents": 368543,
    "currency": "COP",
    "payment_method": {
      "type": "CARD",
      "extra": {
        "bin": "424242",
        "last_four": "4242"
      }
    },
    "reference": "ORDER-123456",
    "created_at": "2025-09-22T10:30:00Z",
    "finalized_at": "2025-09-22T10:31:15Z"
  }
}
```

## Uso

### URL con Transaction ID

Para usar el polling de Wompi, incluye el `id` como parámetro de query:

```
/orden-exitosa?id=11971740-1758575662-83397
```

### Casos de Uso

1. **Solo Transaction ID**: Usa únicamente polling de Wompi
2. **Payment ID + Transaction ID**: Combina datos de GraphQL y Wompi
3. **Solo Payment ID**: Usa únicamente GraphQL (comportamiento original)

## Estados de la UI

### Cargando

```tsx
<Loader className="w-12 h-12 animate-spin" />
<h2>Verificando tu pago...</h2>
<p>Consultando estado en Wompi...</p>
<p>Transacción: {transactionId}</p>
```

### Procesando (con polling activo)

```tsx
<RefreshCw className="w-20 h-20 animate-spin" />
<h1>Procesando Pago...</h1>
<p>Tu pago está siendo verificado. Por favor espera.</p>
<p>Actualizando automáticamente...</p>
<p>ID: {transactionId}</p>
```

### Aprobado

```tsx
<CheckCircle className="w-20 h-20 text-green-500" />
<h1>¡Pago Exitoso!</h1>
<p>Tu orden ha sido confirmada y está siendo procesada</p>
```

### Rechazado/Error

```tsx
<XCircle className="w-20 h-20 text-red-500" />
<h1>Pago Fallido</h1>
<p>No pudimos procesar tu pago</p>
<p>Motivo: {wompiTransaction.status_message}</p>
```

## Detalles Técnicos

### Estados de Polling

```typescript
const [polling, setPolling] = useState(true);
const [wompiTransaction, setWompiTransaction] = useState<WompiTransaction | null>(null);
const [wompiLoading, setWompiLoading] = useState(false);
const [wompiError, setWompiError] = useState<string | null>(null);
```

### Función de Fetch

```typescript
const fetchWompiTransaction = async (txId: string) => {
  try {
    setWompiLoading(true);
    setWompiError(null);

    const response = await fetch(`https://sandbox.wompi.co/v1/transactions/${txId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.data) {
      setWompiTransaction(result.data);

      // Stop polling if transaction is in final state
      const finalStates = ['APPROVED', 'DECLINED', 'VOIDED', 'ERROR'];
      if (finalStates.includes(result.data.status)) {
        setPolling(false);
      }
    }
  } catch (err) {
    console.error('Error fetching Wompi transaction:', err);
    setWompiError(err instanceof Error ? err.message : 'Error fetching transaction');
  } finally {
    setWompiLoading(false);
  }
};
```

### Control de Polling

```typescript
useEffect(() => {
  if (!transactionId) return;

  // Initial fetch
  fetchWompiTransaction(transactionId);

  // Set up polling interval
  let interval: NodeJS.Timeout;
  if (polling) {
    interval = setInterval(() => {
      fetchWompiTransaction(transactionId);
    }, 5000); // Poll every 5 seconds
  }

  return () => {
    if (interval) {
      clearInterval(interval);
    }
  };
}, [transactionId, polling]);
```

## Manejo de Errores

### Error de Red

- Muestra mensaje de error específico
- Botón "Reintentar" llama a `fetchWompiTransaction`
- Enlace a soporte

### Transacción No Encontrada

- HTTP 404 desde la API de Wompi
- Mensaje claro al usuario
- Opciones de contacto

### Timeout de Polling

- Se detiene automáticamente después de 5 minutos
- El usuario puede refrescar manualmente

## Ventajas

1. **Tiempo Real**: Obtiene estado actual directamente de Wompi
2. **Autonomía**: No depende de webhooks o base de datos interna
3. **Confiabilidad**: Fuente única de verdad (Wompi)
4. **UX Mejorada**: Feedback inmediato al usuario
5. **Compatibilidad**: Mantiene funcionalidad existente

## Consideraciones

- Usa API de sandbox para desarrollo
- Cambiar a producción para deploy: `https://production.wompi.co/v1/transactions/{id}`
- Rate limiting: 5 segundos entre consultas para evitar exceso de requests
- Manejo de errores robusto para problemas de conectividad
