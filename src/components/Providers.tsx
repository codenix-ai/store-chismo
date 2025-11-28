'use client';

import { ApolloProvider } from '@apollo/client';
import { SessionProvider } from 'next-auth/react';
import toast, { Toaster } from 'react-hot-toast';
import { apolloClient } from '@/lib/apollo';
import { StoreProvider } from '@/components/StoreProvider';
import { StoreConfig } from '@/lib/store-config';
import { AppConfigLoader } from './AppConfigLoader';

interface ProvidersProps {
  children: React.ReactNode;
  session?: any;
  initialStore?: StoreConfig;
}

const toastconfig = {
  duration: 4000,
  style: {
    background: '#363636',
    color: '#fff',
  },
  success: {
    style: {
      background: '#10B981',
    },
  },
  error: {
    style: {
      background: '#EF4444',
    },
  },
};

export function Providers({ children, session, initialStore }: ProvidersProps) {
  return (
    <SessionProvider session={session}>
      <ApolloProvider client={apolloClient}>
        <AppConfigLoader>
          {children}
          <Toaster position="bottom-right" toastOptions={toastconfig} />
        </AppConfigLoader>
      </ApolloProvider>
    </SessionProvider>
  );
}
