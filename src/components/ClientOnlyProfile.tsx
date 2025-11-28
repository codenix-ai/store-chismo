'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Loading component
function ProfileLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando perfil...</p>
      </div>
    </div>
  );
}

// Client-only wrapper component
function ClientOnlyProfile({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <ProfileLoading />;
  }

  return <>{children}</>;
}

export default ClientOnlyProfile;
