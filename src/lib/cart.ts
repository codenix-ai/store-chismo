export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  productColorId: string;
  productSizeId: string;
  image: string;
  variant?: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
}

class CartService {
  private storageKey = 'emprendyup_cart';

  getCart(): Cart {
    if (typeof window === 'undefined') {
      return { items: [], total: 0, subtotal: 0, tax: 0, shipping: 0 };
    }

    const stored = localStorage.getItem(this.storageKey);
    if (!stored) {
      return { items: [], total: 0, subtotal: 0, tax: 0, shipping: 0 };
    }

    try {
      return JSON.parse(stored);
    } catch {
      return { items: [], total: 0, subtotal: 0, tax: 0, shipping: 0 };
    }
  }

  saveCart(cart: Cart): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(cart));
    }
  }

  addItem(item: Omit<CartItem, 'quantity'> & { quantity?: number }): Cart {
    const cart = this.getCart();
    const existingItem = cart.items.find(i => i.productId === item.productId && i.variant === item.variant);

    if (existingItem) {
      existingItem.quantity += item.quantity || 1;
    } else {
      cart.items.push({ ...item, quantity: item.quantity || 1 });
    }

    this.updateTotals(cart);
    this.saveCart(cart);
    return cart;
  }

  removeItem(productId: string, variant?: string): Cart {
    const cart = this.getCart();
    cart.items = cart.items.filter(item => !(item.productId === productId && item.variant === variant));

    this.updateTotals(cart);
    this.saveCart(cart);
    return cart;
  }

  updateQuantity(productId: string, quantity: number, variant?: string): Cart {
    const cart = this.getCart();
    const item = cart.items.find(i => i.productId === productId && i.variant === variant);

    if (item) {
      if (quantity <= 0) {
        return this.removeItem(productId, variant);
      }
      item.quantity = quantity;
    }

    this.updateTotals(cart);
    this.saveCart(cart);
    return cart;
  }

  clearCart(): Cart {
    const emptyCart = { items: [], total: 0, subtotal: 0, tax: 0, shipping: 0 };
    this.saveCart(emptyCart);
    return emptyCart;
  }

  private updateTotals(cart: Cart): void {
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    cart.tax = cart.subtotal * 0.19; // Colombian IVA
    cart.shipping = cart.subtotal > 150000 ? 0 : 15000; // Free shipping over 150k COP
    cart.total = cart.subtotal + cart.tax + cart.shipping;
  }

  getItemCount(): number {
    const cart = this.getCart();
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }
}

export const cartService = new CartService();
