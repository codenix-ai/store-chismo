export interface StoreConfig {
  id: string;
  storeId: string;
  name: string;
  description?: string;

  // Branding
  logoUrl?: string;
  faviconUrl?: string;
  bannerUrl?: string;

  // Colors & Theme
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  hoverBackgroundColor?: string;
  textColor: string;

  // Contact Information
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  department?: string;
  country: string;

  // Business Information
  businessType?: string;
  taxId?: string;
  businessName?: string;

  // Social Media
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
  whatsappNumber?: string;

  // Store Settings
  currency: string;
  language: string;
  timezone: string;
  isActive: boolean;
  maintenanceMode: boolean;

  // SEO
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;

  // Payment Configuration
  mercadoPagoEnabled: boolean;
  mercadoPagoPublicKey?: string;
  wompiEnabled: boolean;
  wompiPublicKey?: string;
  ePaycoEnabled: boolean;
  ePaycoPublicKey?: string;

  // Shipping Configuration
  freeShippingThreshold: number;
  standardShippingCost: number;
  expressShippingCost?: number;

  // Tax Configuration
  taxRate: number;
  includeTaxInPrice: boolean;
}

// Default store configurations for different store types
export const defaultStoreConfigs = {
  fashion: {
    name: 'mi Tienda Fashion',
    description: 'Ropa y accesorios de última tendencia',
    primaryColor: '#ff7f7f',
    secondaryColor: '#FFFFFF', // Gray-800
    accentColor: '#F59E0B', // Amber-500
    backgroundColor: '#FFFFFF',
    textColor: '#ff6666',
    currency: 'COP',
    language: 'es',
    timezone: 'America/Bogota',
    country: 'Colombia',
    freeShippingThreshold: 150000,
    standardShippingCost: 15000,
    taxRate: 0.19,
    includeTaxInPrice: false,
    isActive: true,
    maintenanceMode: false,
    mercadoPagoEnabled: true,
    wompiEnabled: true,
    ePaycoEnabled: false,
  },
  electronics: {
    name: 'TecnoStore',
    description: 'Electrónicos y gadgets tecnológicos',
    primaryColor: '#3B82F6', // Blue-500
    secondaryColor: '#1E293B', // Slate-800
    accentColor: '#06B6D4', // Cyan-500
    backgroundColor: '#F8FAFC',
    textColor: '#0F172A',
    currency: 'COP',
    language: 'es',
    timezone: 'America/Bogota',
    country: 'Colombia',
    freeShippingThreshold: 200000,
    standardShippingCost: 20000,
    taxRate: 0.19,
    includeTaxInPrice: false,
    isActive: true,
    maintenanceMode: false,
    mercadoPagoEnabled: true,
    wompiEnabled: true,
    ePaycoEnabled: true,
  },
  food: {
    name: 'Sabores Colombianos',
    description: 'Comida tradicional y productos gourmet',
    primaryColor: '#EF4444', // Red-500
    secondaryColor: '#991B1B', // Red-800
    accentColor: '#F97316', // Orange-500
    backgroundColor: '#FEF2F2',
    textColor: '#7F1D1D',
    currency: 'COP',
    language: 'es',
    timezone: 'America/Bogota',
    country: 'Colombia',
    freeShippingThreshold: 100000,
    standardShippingCost: 12000,
    taxRate: 0.19,
    includeTaxInPrice: true,
    isActive: true,
    maintenanceMode: false,
    mercadoPagoEnabled: true,
    wompiEnabled: true,
    ePaycoEnabled: false,
  },
  beauty: {
    name: 'Belleza Natural',
    description: 'Productos de belleza y cuidado personal',
    primaryColor: '#A855F7', // Purple-500
    secondaryColor: '#581C87', // Purple-900
    accentColor: '#EC4899', // Pink-500
    backgroundColor: '#FAF5FF',
    textColor: '#3C1361',
    currency: 'COP',
    language: 'es',
    timezone: 'America/Bogota',
    country: 'Colombia',
    freeShippingThreshold: 120000,
    standardShippingCost: 15000,
    taxRate: 0.19,
    includeTaxInPrice: false,
    isActive: true,
    maintenanceMode: false,
    mercadoPagoEnabled: true,
    wompiEnabled: true,
    ePaycoEnabled: false,
  },
  home: {
    name: 'Hogar & Decoración',
    description: 'Muebles y artículos para el hogar',
    primaryColor: '#059669', // Emerald-600
    secondaryColor: '#064E3B', // Emerald-900
    accentColor: '#D97706', // Amber-600
    backgroundColor: '#F0FDF4',
    textColor: '#064E3B',
    currency: 'COP',
    language: 'es',
    timezone: 'America/Bogota',
    country: 'Colombia',
    freeShippingThreshold: 250000,
    standardShippingCost: 25000,
    expressShippingCost: 40000,
    taxRate: 0.19,
    includeTaxInPrice: false,
    isActive: true,
    maintenanceMode: false,
    mercadoPagoEnabled: true,
    wompiEnabled: true,
    ePaycoEnabled: true,
  },
};

class StoreConfigService {
  private currentStore: StoreConfig | null = null;

  // Get store configuration by storeId (subdomain/slug)
  async getStoreConfig(storeId: string): Promise<StoreConfig | null> {
    // In a real app, this would fetch from database
    // For now, we'll use environment variable or default

    if (typeof window !== 'undefined') {
      // Client-side: get from localStorage or API
      const stored = localStorage.getItem(`store_config_${storeId}`);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return null;
        }
      }
    }

    // Check if we have a predefined config
    const envStoreType = process.env.NEXT_PUBLIC_STORE_TYPE as keyof typeof defaultStoreConfigs;
    if (envStoreType && defaultStoreConfigs[envStoreType]) {
      return {
        id: '1',
        storeId,
        ...defaultStoreConfigs[envStoreType],
      } as StoreConfig;
    }

    // Return default config
    return {
      id: '1',
      storeId,
      ...defaultStoreConfigs.fashion,
    } as StoreConfig;
  }

  // Set current store configuration
  setCurrentStore(store: StoreConfig) {
    this.currentStore = store;

    // Save to localStorage for client-side persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem(`store_config_${store.storeId}`, JSON.stringify(store));
      localStorage.setItem('current_store_id', store.storeId);
    }
  }

  // Get current store configuration
  getCurrentStore(): StoreConfig | null {
    return this.currentStore;
  }

  // Initialize store from subdomain or environment
  async initializeStore(): Promise<StoreConfig> {
    let storeId = process.env.NEXT_PUBLIC_STORE_ID;

    if (typeof window !== 'undefined') {
      // Extract subdomain or use environment variable
      const hostname = window.location.hostname;
      const parts = hostname.split('.');

      if (parts.length > 2) {
        // Subdomain exists
        storeId = parts[0];
      } else {
        // Use environment variable or query parameter
        const urlParams = new URLSearchParams(window.location.search);
        storeId = urlParams.get('store') || process.env.NEXT_PUBLIC_STORE_ID || 'default';
      }
    } else {
      // Server-side: use environment variable
      storeId = process.env.NEXT_PUBLIC_STORE_ID || 'default';
    }

    const store = await this.getStoreConfig(storeId);
    if (store) {
      this.setCurrentStore(store);
      return store;
    }

    // Fallback to default
    const defaultStore = {
      id: '2',
      storeId: 'default',
      ...defaultStoreConfigs.electronics,
    } as StoreConfig;

    this.setCurrentStore(defaultStore);
    return defaultStore;
  }

  // Apply store theme to CSS variables
  applyStoreTheme(store: StoreConfig) {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;

      root.style.setProperty('--store-primary', store.primaryColor);
      root.style.setProperty('--store-secondary', store.secondaryColor);
      root.style.setProperty('--store-accent', store.accentColor);
      root.style.setProperty('--store-background', store.backgroundColor);
      root.style.setProperty('--store-text', store.textColor);

      // Update favicon if provided
      if (store.faviconUrl) {
        const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        if (favicon) {
          favicon.href = store.faviconUrl;
        }
      }

      // Update meta tags
      if (store.metaTitle) {
        document.title = store.metaTitle;
      }

      if (store.metaDescription) {
        const metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement;
        if (metaDesc) {
          metaDesc.content = store.metaDescription;
        }
      }
    }
  }

  // Create a new store configuration
  async createStore(config: Partial<StoreConfig> & { storeId: string; name: string }): Promise<StoreConfig> {
    const newStore: StoreConfig = {
      id: Date.now().toString(), // In real app, this would be generated by database
      ...defaultStoreConfigs.fashion,
      ...config,
    };

    // In a real app, this would save to database
    if (typeof window !== 'undefined') {
      localStorage.setItem(`store_config_${newStore.storeId}`, JSON.stringify(newStore));
    }

    return newStore;
  }

  // Update store configuration
  async updateStore(storeId: string, updates: Partial<StoreConfig>): Promise<StoreConfig | null> {
    const currentStore = await this.getStoreConfig(storeId);
    if (!currentStore) return null;

    const updatedStore = { ...currentStore, ...updates };

    // In a real app, this would update the database
    if (typeof window !== 'undefined') {
      localStorage.setItem(`store_config_${storeId}`, JSON.stringify(updatedStore));
    }

    if (this.currentStore?.storeId === storeId) {
      this.setCurrentStore(updatedStore);
    }

    return updatedStore;
  }

  // Get formatted currency
  formatCurrency(amount: number, store?: StoreConfig): string {
    const currentStore = store || this.currentStore;
    if (!currentStore) return `$${amount.toLocaleString()}`;

    switch (currentStore.currency) {
      case 'COP':
        return `$${amount.toLocaleString('es-CO')} COP`;
      case 'USD':
        return `$${amount.toLocaleString('en-US')} USD`;
      case 'EUR':
        return `€${amount.toLocaleString('es-ES')}`;
      default:
        return `${currentStore.currency} ${amount.toLocaleString()}`;
    }
  }

  // Calculate tax
  calculateTax(amount: number, store?: StoreConfig): number {
    const currentStore = store || this.currentStore;
    if (!currentStore) return amount * 0.19; // Default Colombian IVA

    return amount * currentStore.taxRate;
  }

  // Calculate shipping
  calculateShipping(subtotal: number, store?: StoreConfig): number {
    const currentStore = store || this.currentStore;
    if (!currentStore) return subtotal >= 150000 ? 0 : 15000; // Default Colombian shipping

    if (subtotal >= currentStore.freeShippingThreshold) {
      return 0;
    }

    return currentStore.standardShippingCost;
  }

  // Get available payment methods
  getAvailablePaymentMethods(store?: StoreConfig): string[] {
    const currentStore = store || this.currentStore;
    if (!currentStore) return ['mercadopago'];

    const methods: string[] = [];

    if (currentStore.mercadoPagoEnabled) methods.push('mercadopago');
    if (currentStore.wompiEnabled) methods.push('wompi');
    if (currentStore.ePaycoEnabled) methods.push('epayco');

    return methods;
  }
}

export const storeConfigService = new StoreConfigService();
