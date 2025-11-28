'use client';

import Layout from '@/components/Layout/Layout';
import { RegisterForm } from '../../../components/Auth/RegisterForm';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <Layout>
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
        <RegisterForm />
        <div className="mt-4 text-center">
          <span className="text-gray-600">¿Ya tienes cuenta?</span>{' '}
          <Link href="/auth/signin" className="text-blue-600 hover:underline">
            Inicia sesión
          </Link>
        </div>
      </div>
    </Layout>
  );
}
