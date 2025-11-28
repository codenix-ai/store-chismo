import Layout from "@/components/Layout/Layout";
import Order from "@/components/Order/Order";

export default function OrderPage() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Order />
      </div>
    </Layout>
  );
}
