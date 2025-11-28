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

export default function TermsPage() {
  const { store } = useStore();
  const { data, loading, error } = useQuery(GET_POLICIES, {
    variables: { storeId: store?.id || "default-store" },
    skip: !store?.id,
  });
  let termsPolicy = null;
  if (data?.storePolicies) {
    termsPolicy = data.storePolicies.find(
      (p: any) => p.type === "TERMS_CONDITIONS"
    );
  }
  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-12 px-4">
        {loading ? (
          <div className="text-center py-12">Cargando...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">
            Error al cargar los términos y condiciones.
          </div>
        ) : termsPolicy ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <h1
              className="text-3xl font-bold mb-8 text-center"
              style={{ color: store?.primaryColor }}
            >
              {termsPolicy.title}
            </h1>
            <div
              className="prose prose-lg max-w-none mx-auto"
              style={{ minHeight: 200 }}
              dangerouslySetInnerHTML={{ __html: termsPolicy.content }}
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <h1
              className="text-3xl font-bold mb-8 text-center"
              style={{ color: store?.primaryColor }}
            >
              Términos y Condiciones
            </h1>
            <div className="text-gray-600">
              No se encontraron los términos y condiciones para esta tienda.
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
