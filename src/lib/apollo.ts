import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { getSession } from 'next-auth/react';

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql',
});

const authLink = setContext(async (_, { headers }) => {
  // Get the authentication token from NextAuth session
  let token = null;
  if (typeof window !== 'undefined') {
    // Client-side: get from NextAuth session
    const session = await getSession();
    token = (session as any)?.accessToken;
    // Fallback: try localStorage for manual login
    if (!token) {
      token = localStorage.getItem('token');
    }
  }
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.error(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`)
    );
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);

    // Handle specific network errors
    if ('statusCode' in networkError && networkError.statusCode === 401) {
      // Token expired or invalid - redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/auth/signin';
      }
    }
  }
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          payments: {
            keyArgs: ['filter'],
            merge(existing = [], incoming = []) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  ssrMode: typeof window === 'undefined',
});
