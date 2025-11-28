import { Favorites } from '@/components/Favorites/Favorites';
import Layout from '@/components/Layout/Layout';

export default function FavoritesPage() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Favorites />
      </div>
    </Layout>
  );
}
