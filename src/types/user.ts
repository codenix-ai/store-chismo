// User types based on Prisma schema

export type UserRole = 'USER' | 'ADMIN' | 'STORE_OWNER';

export interface Address {
  id: string;
  street: string;
  city: string;
  department: string;
  country: string;
  postalCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Store {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;
  membershipLevel?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  storeId?: string;
  store?: Store;
  addresses: Address[];
}

export interface UsersQueryResponse {
  users: User[];
  usersCount: number;
}

export interface UsersQueryVariables {
  skip?: number;
  take?: number;
  search?: string;
  role?: UserRole;
}

// NextAuth extended types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    accessToken?: string;
    accessTokenExpires?: number;
  }

  interface User {
    id: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
  }
}
