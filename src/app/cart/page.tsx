import { Cart } from '@/components/Cart/Cart';
import Layout from '@/components/Layout/Layout';

export default function CartPage() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Cart />
      </div>
    </Layout>
  );
}
