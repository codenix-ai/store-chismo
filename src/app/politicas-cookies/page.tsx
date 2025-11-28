"use client";
import Layout from "@/components/Layout/Layout";
import { gql, useQuery } from "@apollo/client";
import { useStore } from "@/components/StoreProvider";

const GET_POLICIES = gql`
  query GetPolicies($storeId: String!) {
    storePolicies(storeId: $storeId) {
      id
      type
      title
      content
    }
  }
`;

export default function PoliticasCookiesPage() {
  const { store } = useStore();
  const { data, loading, error } = useQuery(GET_POLICIES, {
    variables: { storeId: store?.id || "default-store" },
    skip: !store?.id,
  });
  let cookiesPolicy = null;
  if (data?.storePolicies) {
    cookiesPolicy = data.storePolicies.find(
      (p: any) => p.type === "COOKIE_POLICY"
    );
  }
  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-12 px-4">
        {loading ? (
          <div className="text-center py-12">Cargando...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">
            Error al cargar la política de cookies.
          </div>
        ) : cookiesPolicy ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <h1
              className="text-3xl font-bold mb-8 text-center"
              style={{ color: store?.primaryColor }}
            >
              {cookiesPolicy.title}
            </h1>
            <div
              className="prose prose-lg max-w-none mx-auto"
              style={{ minHeight: 200 }}
              dangerouslySetInnerHTML={{ __html: cookiesPolicy.content }}
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <h1
              className="text-3xl font-bold mb-8 text-center"
              style={{ color: store?.primaryColor }}
            >
              Política de Cookies
            </h1>
            <div className="text-gray-600">
              No se encontró la política de cookies para esta tienda.
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
