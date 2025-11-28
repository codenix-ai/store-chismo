import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mi Perfil | EmprendyUp Store',
  description: 'Gestiona tu información personal y configuración de cuenta',
};

export default function PerfilLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
