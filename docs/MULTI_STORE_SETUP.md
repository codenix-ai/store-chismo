# Multi-Store Configuration System

## Overview

The EmprendyUp Store Boilerplate now includes a powerful multi-store configuration system that allows you to create and manage multiple stores with different branding, colors, payment methods, and business logic using the same codebase.

## Features

### 🎨 **Branding & Design**

- Custom store names and descriptions
- Logo and favicon URLs
- Color themes (primary, secondary, accent, background, text)
- Banner images
- Social media links

### 🏢 **Business Configuration**

- Business information (name, type, tax ID)
- Contact details (email, phone, WhatsApp)
- Address and location
- Tax rates and pricing settings

### 💳 **Payment Methods**

- MercadoPago integration
- Wompi payment gateway
- ePayco support
- Individual API key configuration per store

### 🚚 **Shipping & Logistics**

- Free shipping thresholds
- Standard and express shipping costs
- Tax configuration (IVA)
- Regional shipping settings

### 🔍 **SEO & Marketing**

- Custom meta titles and descriptions
- Keywords optimization
- Social media integration
- Google Analytics setup

## Quick Start

### 1. Store Configuration Service

The system is built around the `StoreConfigService` located in `src/lib/store-config.ts`:

```typescript
import { StoreConfigService } from '@/lib/store-config';

// Get a specific store configuration
const storeConfig = StoreConfigService.getStoreConfig('fashion-store');

// Apply theme to the app
StoreConfigService.applyTheme(storeConfig);

// Format currency
const price = StoreConfigService.formatCurrency(99999, storeConfig.currency);
```

### 2. React Context Provider

Wrap your app with the `StoreProvider` to access store configuration throughout your components:

```typescript
// In your layout.tsx or app.tsx
import { StoreProvider } from '@/components/StoreProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <StoreProvider storeId="fashion-store">{children}</StoreProvider>
      </body>
    </html>
  );
}
```

### 3. Using Store Configuration in Components

```typescript
// In any component
import { useStore } from '@/components/StoreProvider';

export function MyComponent() {
  const { store, updateStore } = useStore();

  return (
    <div style={{ backgroundColor: store.primaryColor }}>
      <h1>{store.name}</h1>
      <p>{store.description}</p>
    </div>
  );
}
```

## Predefined Store Templates

The system comes with 5 predefined store templates:

### 1. **Fashion Store**

- **Theme**: Pink and elegant design
- **Colors**: Primary: #ec4899, Secondary: #be185d
- **Business**: Fashion and apparel
- **Shipping**: Free shipping from $120,000 COP

### 2. **Electronics Store**

- **Theme**: Blue and tech-focused
- **Colors**: Primary: #3b82f6, Secondary: #1e40af
- **Business**: Electronics and gadgets
- **Shipping**: Free shipping from $200,000 COP

### 3. **Food Store**

- **Theme**: Green and fresh
- **Colors**: Primary: #10b981, Secondary: #047857
- **Business**: Food and beverages
- **Shipping**: Express delivery available

### 4. **Beauty Store**

- **Theme**: Purple and luxury
- **Colors**: Primary: #8b5cf6, Secondary: #7c3aed
- **Business**: Beauty and cosmetics
- **Shipping**: Free shipping from $80,000 COP

### 5. **Home Store**

- **Theme**: Orange and cozy
- **Colors**: Primary: #f97316, Secondary: #ea580c
- **Business**: Home and furniture
- **Shipping**: Free shipping from $250,000 COP

## Admin Panel

Access the store configuration admin panel at `/admin/store` to:

- ✅ **General Settings**: Configure store name, ID, description, currency, and language
- ✅ **Branding**: Set up logos, colors, and visual identity
- ✅ **Business Info**: Manage business details and contact information
- ✅ **Payment Methods**: Configure MercadoPago, Wompi, and ePayco
- ✅ **Shipping Settings**: Set up shipping costs and tax rates
- ✅ **SEO & Social**: Optimize for search engines and social media

## Database Schema

The system uses Prisma with a comprehensive Store model:

```prisma
model Store {
  id            String   @id @default(cuid())
  storeId       String   @unique
  name          String
  description   String?

  // Branding
  logoUrl       String?
  faviconUrl    String?
  bannerUrl     String?
  primaryColor  String   @default("#2563eb")
  // ... more fields

  // Business
  businessName  String?
  businessType  String?
  taxId         String?
  // ... more fields

  // Created/Updated
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

## API Integration

### Store Configuration Endpoints

```typescript
// Get store config
GET /api/stores/:storeId

// Update store config
PUT /api/stores/:storeId

// Create new store
POST /api/stores
```

### Example Usage

```typescript
// Fetch store configuration
const response = await fetch('/api/stores/fashion-store');
const storeConfig = await response.json();

// Update store configuration
await fetch('/api/stores/fashion-store', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'New Store Name',
    primaryColor: '#ff6b6b',
  }),
});
```

## Environment Variables

Set up your environment variables for different stores:

```env
# Database
DATABASE_URL="postgresql://..."

# Default Store
DEFAULT_STORE_ID="fashion-store"

# Payment Providers
MERCADOPAGO_PUBLIC_KEY="TEST-..."
WOMPI_PUBLIC_KEY="pub_test_..."
EPAYCO_PUBLIC_KEY="test_..."
```

## Deployment Strategies

### 1. **Single Deployment, Multiple Stores**

- Deploy once with subdomain routing
- `fashion.example.com` → Fashion store
- `electronics.example.com` → Electronics store

### 2. **Domain-Based Routing**

- `fashionstore.com` → Fashion store
- `techstore.com` → Electronics store

### 3. **Path-Based Routing**

- `example.com/fashion` → Fashion store
- `example.com/electronics` → Electronics store

## Best Practices

### 🎯 **Store Configuration**

1. Always set meaningful store IDs (lowercase, kebab-case)
2. Use consistent color schemes across your brand
3. Optimize images for web (WebP format recommended)
4. Test payment integrations in sandbox mode first

### 🔧 **Development**

1. Use TypeScript for better type safety
2. Implement proper error handling for store operations
3. Cache store configurations for better performance
4. Use environment-specific configurations

### 🚀 **Performance**

1. Lazy load store configurations
2. Implement CDN for static assets (logos, banners)
3. Use React.memo for components that don't change often
4. Optimize bundle size by code splitting

### 🔒 **Security**

1. Never expose private API keys in frontend
2. Validate store configurations on the server
3. Implement proper authentication for admin panel
4. Use HTTPS for all store operations

## Customization Examples

### Adding Custom Store Templates

```typescript
// In src/lib/store-config.ts
export const customStoreConfigs = {
  'pet-store': {
    name: 'Pets Paradise',
    description: 'Everything for your beloved pets',
    primaryColor: '#fbbf24',
    secondaryColor: '#f59e0b',
    category: 'pets',
    freeShippingThreshold: 100000,
    standardShippingCost: 12000,
    // ... more configuration
  },
};
```

### Custom Theme Integration

```typescript
// Custom hook for theme management
export function useStoreTheme() {
  const { store } = useStore();

  useEffect(() => {
    if (store) {
      // Apply CSS custom properties
      document.documentElement.style.setProperty('--primary-color', store.primaryColor);
      document.documentElement.style.setProperty('--secondary-color', store.secondaryColor);
      // Update favicon
      if (store.faviconUrl) {
        const favicon = document.querySelector('link[rel="icon"]');
        if (favicon) favicon.href = store.faviconUrl;
      }
    }
  }, [store]);
}
```

## Troubleshooting

### Common Issues

**❌ Store configuration not loading**

- Check if `StoreProvider` is properly wrapped around your app
- Verify the store ID exists in your database
- Check console for TypeScript errors

**❌ Colors not applying**

- Ensure CSS custom properties are being set
- Check if Tailwind CSS is properly configured
- Verify color values are in correct format (#hex)

**❌ Payment integration issues**

- Verify API keys are correctly set
- Check if payment providers are enabled for the store
- Test in sandbox/development mode first

**❌ Admin panel not accessible**

- Check authentication middleware
- Verify user permissions
- Ensure admin routes are properly configured

## Support

For additional support or custom implementations:

1. **Documentation**: Check the `docs/` folder for detailed guides
2. **Examples**: See `examples/` folder for implementation samples
3. **Issues**: Report bugs or request features on GitHub
4. **Community**: Join our Discord for community support

---

Built with ❤️ by the EmprendyUp team. Ready to scale your business with multi-store capabilities!
