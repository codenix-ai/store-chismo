import { cartService } from '@/lib/cart';

// Test for cart service
describe('Cart Service', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should start with empty cart', () => {
    const cart = cartService.getCart();
    expect(cart.items).toHaveLength(0);
    expect(cart.total).toBe(0);
  });

  it('should add item to cart', () => {
    const item = {
      id: '1',
      productId: 'test-product',
      name: 'Test Product',
      price: 100000,
      image: '/test.jpg',
    };

    const cart = cartService.addItem(item);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(1);
    expect(cart.subtotal).toBe(100000);
  });

  it('should increase quantity when adding existing item', () => {
    const item = {
      id: '1',
      productId: 'test-product',
      name: 'Test Product',
      price: 100000,
      image: '/test.jpg',
    };

    cartService.addItem(item);
    const cart = cartService.addItem(item);

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(2);
  });

  it('should remove item from cart', () => {
    const item = {
      id: '1',
      productId: 'test-product',
      name: 'Test Product',
      price: 100000,
      image: '/test.jpg',
    };

    cartService.addItem(item);
    const cart = cartService.removeItem('test-product');

    expect(cart.items).toHaveLength(0);
    expect(cart.total).toBe(0);
  });

  it('should calculate Colombian tax correctly', () => {
    const item = {
      id: '1',
      productId: 'test-product',
      name: 'Test Product',
      price: 100000,
      image: '/test.jpg',
    };

    const cart = cartService.addItem(item);

    // Colombian IVA is 19%
    expect(cart.tax).toBe(19000);
  });

  it('should calculate free shipping for orders over 150000', () => {
    const item = {
      id: '1',
      productId: 'test-product',
      name: 'Test Product',
      price: 200000,
      image: '/test.jpg',
    };

    const cart = cartService.addItem(item);
    expect(cart.shipping).toBe(0);
  });

  it('should charge shipping for orders under 150000', () => {
    const item = {
      id: '1',
      productId: 'test-product',
      name: 'Test Product',
      price: 100000,
      image: '/test.jpg',
    };

    const cart = cartService.addItem(item);
    expect(cart.shipping).toBe(15000);
  });
});
