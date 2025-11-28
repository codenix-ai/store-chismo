"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { gql, useMutation } from "@apollo/client";
import { useStore } from "@/components/StoreProvider";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { store } = useStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // GraphQL mutation for new input
  const CREATE_USER = gql`
    mutation CreateUser($input: CreateUserInput!) {
      createUser(input: $input) {
        id
        email
        name
        role
        membershipLevel
        storeId
      }
    }
  `;

  const [createUser] = useMutation(CREATE_USER);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const input = {
        email,
        name,
        password,
        role: "CUSTOMER",
        storeId: store?.id || undefined,
        membershipLevel: undefined,
      };
      const { data } = await createUser({
        variables: { input },
      });
      if (!data?.createUser) throw new Error("Registro fallido");
      setSuccess("¡Registro exitoso! Ahora puedes iniciar sesión.");
      setTimeout(() => {
        router.push("/auth/signin");
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-w-md w-full mx-auto p-8 bg-white rounded-2xl shadow-lg border border-gray-100"
    >
      <h2
        className="text-3xl font-bold mb-2 text-center font-montserrat"
        style={{ color: "lab(55 8.91 -65.74)" }}
      >
        Crear Cuenta
      </h2>
      <p className="text-gray-500 text-center mb-6">
        Regístrate para administrar tu tienda y productos
      </p>
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Nombre
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Tu nombre"
        />
      </div>
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="tu@email.com"
        />
      </div>
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Contraseña
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="••••••••"
        />
      </div>
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      {success && (
        <p className="text-green-600 text-sm text-center font-semibold">
          {success}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full text-white py-2 rounded-lg font-semibold transition"
        style={{ background: "lab(55 8.91 -65.74)" }}
      >
        {loading ? "Registrando..." : "Registrarse"}
      </button>
    </form>
  );
}
