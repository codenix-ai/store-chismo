'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useSession } from 'next-auth/react';
import {
  User,
  Mail,
  Calendar,
  Shield,
  Store,
  MapPin,
  Edit,
  Save,
  X,
  Camera,
  Settings,
  Package,
  ShoppingBag,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { User as UserType, Address } from '@/types/user';
import { Order } from '@/types/order';
import Layout from '@/components/Layout/Layout';
import { ORDERS_BY_USER } from '@/lib/graphql/queries';
import Link from 'next/link';

// GraphQL queries and mutations
const GET_USER_PROFILE = gql`
  query GetUserProfile($id: String!) {
    user(id: $id) {
      id
      email
      name
      role
      createdAt
      updatedAt
      store {
        id
        name
        description
        status
      }
      addresses {
        id
        street
        city
        department
        postalCode
      }
    }
  }
`;

const UPDATE_USER_PROFILE = gql`
  mutation UpdateUserProfile($id: String!, $input: UpdateUserProfileInput!) {
    updateUserProfile(id: $id, input: $input) {
      id
      name
      email
    }
  }
`;

const ADD_ADDRESS = gql`
  mutation AddAddress($input: AddAddressInput!) {
    addAddress(input: $input) {
      id
      street
      city
      department
      postalCode
    }
  }
`;

const UPDATE_ADDRESS = gql`
  mutation UpdateAddress($id: String!, $input: UpdateAddressInput!) {
    updateAddress(id: $id, input: $input) {
      id
      street
      city
      department
      postalCode
    }
  }
`;

const DELETE_ADDRESS = gql`
  mutation DeleteAddress($id: String!) {
    deleteAddress(id: $id) {
      id
    }
  }
`;

function PerfilContent() {
  const { data: session, status } = useSession();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile');

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    membershipLevel: '',
  });

  // Address form state
  const [addressData, setAddressData] = useState({
    street: '',
    city: '',
    department: '',
    country: '',
    postalCode: '',
  });

  const { data, loading, error, refetch } = useQuery(GET_USER_PROFILE, {
    variables: { id: session?.user?.id || '' },
    skip: !session?.user?.id,
    onCompleted: data => {
      if (data.user) {
        setProfileData({
          name: data.user.name,
          email: data.user.email,
          membershipLevel: data.user.membershipLevel || '',
        });
      }
    },
  });

  const {
    data: ordersData,
    loading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useQuery(ORDERS_BY_USER, {
    variables: { userId: session?.user?.id || '' },
    skip: !session?.user?.id,
  });

  const [updateProfile, { loading: updatingProfile }] = useMutation(UPDATE_USER_PROFILE);
  const [addAddress, { loading: addingAddress }] = useMutation(ADD_ADDRESS);
  const [deleteAddress, { loading: deletingAddress }] = useMutation(DELETE_ADDRESS);

  const user: UserType | null = data?.user || null;
  const orders: Order[] = ordersData?.ordersByUser || [];

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      await updateProfile({
        variables: {
          id: user.id,
          input: {
            name: profileData.name,
            membershipLevel: profileData.membershipLevel || null,
          },
        },
      });

      toast.success('Perfil actualizado exitosamente');
      setIsEditingProfile(false);
      refetch();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar el perfil');
    }
  };

  const handleAddAddress = async () => {
    if (!user) return;

    try {
      await addAddress({
        variables: {
          input: {
            ...addressData,
            userId: user.id,
          },
        },
      });

      toast.success('Dirección agregada exitosamente');
      setIsAddingAddress(false);
      setAddressData({
        street: '',
        city: '',
        department: '',
        country: '',
        postalCode: '',
      });
      refetch();
    } catch (error) {
      console.error('Error adding address:', error);
      toast.error('Error al agregar la dirección');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta dirección?')) {
      return;
    }

    try {
      await deleteAddress({
        variables: { id: addressId },
      });

      toast.success('Dirección eliminada exitosamente');
      refetch();
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Error al eliminar la dirección');
    }
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      USER: 'bg-green-100 text-green-800',
      ADMIN: 'bg-red-100 text-red-800',
      STORE_OWNER: 'bg-blue-100 text-blue-800',
    };
    return styles[role as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getOrderStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'CONFIRMED':
      case 'PROCESSING':
        return <Package className="w-4 h-4 text-blue-500" />;
      case 'SHIPPED':
        return <Truck className="w-4 h-4 text-purple-500" />;
      case 'DELIVERED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getOrderStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      SHIPPED: 'bg-purple-100 text-purple-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (status === 'loading' || loading || ordersLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Acceso requerido</h2>
          <p className="text-gray-600 mb-4">Debes iniciar sesión para ver tu perfil.</p>
          <Link href="/auth/signin" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error al cargar el perfil</h2>
          <p className="text-gray-600 mb-4">{error?.message || 'No se pudo cargar la información del perfil'}</p>
          <button onClick={() => refetch()} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
                <p className="text-gray-600 mt-1">Gestiona tu información personal y configuración</p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'profile'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Perfil</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'orders'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <ShoppingBag className="w-4 h-4" />
                    <span>Mis Pedidos ({orders.length})</span>
                  </div>
                </button>
              </nav>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {activeTab === 'profile' && (
              <>
                {/* Profile Information */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Basic Information */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">Información Personal</h2>
                      {!isEditingProfile ? (
                        <button
                          onClick={() => setIsEditingProfile(true)}
                          className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Editar</span>
                        </button>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={handleUpdateProfile}
                            disabled={updatingProfile}
                            className="text-green-600 hover:text-green-800 flex items-center space-x-1 disabled:opacity-50"
                          >
                            <Save className="w-4 h-4" />
                            <span>Guardar</span>
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingProfile(false);
                              setProfileData({
                                name: user.name,
                                email: user.email,
                                membershipLevel: user.membershipLevel || '',
                              });
                            }}
                            className="text-gray-600 hover:text-gray-800 flex items-center space-x-1"
                          >
                            <X className="w-4 h-4" />
                            <span>Cancelar</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nombre completo</label>
                        {isEditingProfile ? (
                          <input
                            type="text"
                            value={profileData.name}
                            onChange={e =>
                              setProfileData({
                                ...profileData,
                                name: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="text-gray-900">{user.name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <p className="text-gray-900">{user.email}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">El email no se puede cambiar</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
                        <span
                          className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getRoleBadge(
                            user.role
                          )}`}
                        >
                          <Shield className="w-3 h-3 mr-1" />
                          {user.role}
                        </span>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Miembro desde</label>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <p className="text-gray-900">{formatDate(user.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Store Information */}
                  {user.store && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Mi Tienda</h2>
                      <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <Store className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">{user.store.name}</h3>
                          {user.store.description && <p className="text-gray-600">{user.store.description}</p>}
                          <p className="text-sm text-gray-500 mt-1">Estado: {user.store.status}</p>
                        </div>
                        <Link
                          href="https://app.emprendyup.com/"
                          target="_blank"
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                          Gestionar
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Addresses */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">Mis Direcciones</h2>
                      <button
                        onClick={() => setIsAddingAddress(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                      >
                        <MapPin className="w-4 h-4" />
                        <span>Agregar dirección</span>
                      </button>
                    </div>

                    {/* Add Address Form */}
                    {isAddingAddress && (
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <h3 className="text-md font-medium text-gray-900 mb-4">Nueva Dirección</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <input
                              type="text"
                              value={addressData.street}
                              onChange={e =>
                                setAddressData({
                                  ...addressData,
                                  street: e.target.value,
                                })
                              }
                              placeholder="Calle y número"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <input
                            type="text"
                            value={addressData.city}
                            onChange={e =>
                              setAddressData({
                                ...addressData,
                                city: e.target.value,
                              })
                            }
                            placeholder="Ciudad"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            value={addressData.department}
                            onChange={e =>
                              setAddressData({
                                ...addressData,
                                department: e.target.value,
                              })
                            }
                            placeholder="Departamento/Estado"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            value={addressData.country}
                            onChange={e =>
                              setAddressData({
                                ...addressData,
                                country: e.target.value,
                              })
                            }
                            placeholder="País"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            value={addressData.postalCode}
                            onChange={e =>
                              setAddressData({
                                ...addressData,
                                postalCode: e.target.value,
                              })
                            }
                            placeholder="Código postal"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="flex space-x-2 mt-4">
                          <button
                            onClick={handleAddAddress}
                            disabled={addingAddress}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            {addingAddress ? 'Guardando...' : 'Guardar'}
                          </button>
                          <button
                            onClick={() => {
                              setIsAddingAddress(false);
                              setAddressData({
                                street: '',
                                city: '',
                                department: '',
                                country: '',
                                postalCode: '',
                              });
                            }}
                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Address List */}
                    <div className="space-y-4">
                      {user?.addresses && user.addresses.length > 0 ? (
                        user.addresses.map((address: Address) => (
                          <div key={address.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-start space-x-3">
                                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                  <p className="text-gray-900">{address.street}</p>
                                  <p className="text-gray-600">
                                    {address.city}, {address.department}
                                  </p>
                                  <p className="text-gray-600">
                                    {address.country} {address.postalCode && `- ${address.postalCode}`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleDeleteAddress(address.id)}
                                  disabled={deletingAddress}
                                  className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No tienes direcciones guardadas</p>
                          <p className="text-gray-400 text-sm">Agrega una dirección para facilitar tus compras</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Quick Stats */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de cuenta</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Direcciones</span>
                        <span className="font-medium">{user?.addresses?.length || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Rol</span>
                        <span className="font-medium">{user?.role || 'N/A'}</span>
                      </div>
                      {user?.store && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Tienda</span>
                          <span className="font-medium text-blue-600">Activa</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Security Settings */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Seguridad</h3>
                    <div className="space-y-3">
                      <button className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                        Cambiar contraseña
                      </button>
                      <button className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                        Autenticación en dos pasos
                      </button>
                      <button className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                        Sesiones activas
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'orders' && (
              <div className="lg:col-span-3">
                {/* Orders Section */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                      <ShoppingBag className="w-5 h-5" />
                      <span>Mis Pedidos</span>
                    </h2>
                  </div>

                  <div className="p-6">
                    {ordersError ? (
                      <div className="text-center py-8">
                        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <p className="text-gray-500 mb-2">Error al cargar los pedidos</p>
                        <p className="text-gray-400 text-sm mb-4">{ordersError.message}</p>
                        <button
                          onClick={() => refetchOrders()}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                          Reintentar
                        </button>
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes pedidos aún</h3>
                        <p className="text-gray-500 mb-6">Cuando realices tu primera compra, aparecerá aquí</p>
                        <Link
                          href="/products"
                          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-flex items-center space-x-2"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          <span>Explorar productos</span>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {orders.map(order => (
                          <div
                            key={order.id}
                            className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                          >
                            {/* Order Header */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                {getOrderStatusIcon(order.status)}
                                <div>
                                  <h3 className="text-lg font-medium text-gray-900">Pedido #{order.id.slice(-8)}</h3>
                                  <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span
                                  className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getOrderStatusBadge(
                                    order.status
                                  )}`}
                                >
                                  {order.status}
                                </span>
                                <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(order.total)}</p>
                              </div>
                            </div>

                            {/* Store Info */}
                            <div className="flex items-center space-x-2 mb-4 p-3 bg-gray-50 rounded-lg">
                              <Store className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">Tienda:</span>
                              <span className="text-sm font-medium text-gray-900">{order.store.name}</span>
                            </div>

                            {/* Order Items */}
                            <div className="space-y-3 mb-4">
                              <h4 className="text-sm font-medium text-gray-900">Productos ({order.items.length})</h4>
                              {order.items.map((item, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">{item.productName}</p>
                                    <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium text-gray-900">{formatCurrency(item.unitPrice)}</p>
                                    <p className="text-sm text-gray-500">c/u</p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Order Summary */}
                            <div className="border-t border-gray-200 pt-4">
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Subtotal:</span>
                                  <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
                                </div>
                                {order.shipping > 0 && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Envío:</span>
                                    <span className="text-gray-900">{formatCurrency(order.shipping)}</span>
                                  </div>
                                )}
                                {order.tax > 0 && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Impuestos:</span>
                                    <span className="text-gray-900">{formatCurrency(order.tax)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                                  <span className="text-gray-900">Total:</span>
                                  <span className="text-gray-900">{formatCurrency(order.total)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function PerfilPage() {
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return <PerfilContent />;
}
