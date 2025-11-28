'use client';

import { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { MapPin, Edit, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { Address } from '@/types/user';

const UPDATE_ADDRESS = gql`
  mutation UpdateAddress($id: String!, $input: UpdateAddressInput!) {
    updateAddress(id: $id, input: $input) {
      id
      street
      city
      department
      country
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

interface AddressCardProps {
  address: Address;
  onUpdated: () => void;
  onDeleted: () => void;
}

export function AddressCard({ address, onUpdated, onDeleted }: AddressCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    street: address.street,
    city: address.city,
    department: address.department,
    country: address.country,
    postalCode: address.postalCode || '',
  });

  const [updateAddress, { loading: updating }] = useMutation(UPDATE_ADDRESS);
  const [deleteAddress, { loading: deleting }] = useMutation(DELETE_ADDRESS);

  const handleUpdate = async () => {
    try {
      await updateAddress({
        variables: {
          id: address.id,
          input: editData,
        },
      });

      toast.success('Dirección actualizada exitosamente');
      setIsEditing(false);
      onUpdated();
    } catch (error) {
      console.error('Error updating address:', error);
      toast.error('Error al actualizar la dirección');
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta dirección?')) {
      return;
    }

    try {
      await deleteAddress({
        variables: { id: address.id },
      });

      toast.success('Dirección eliminada exitosamente');
      onDeleted();
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Error al eliminar la dirección');
    }
  };

  const handleCancel = () => {
    setEditData({
      street: address.street,
      city: address.city,
      department: address.department,
      country: address.country,
      postalCode: address.postalCode || '',
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              value={editData.street}
              onChange={e => setEditData({ ...editData, street: e.target.value })}
              placeholder="Calle y número"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <input
            type="text"
            value={editData.city}
            onChange={e => setEditData({ ...editData, city: e.target.value })}
            placeholder="Ciudad"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="text"
            value={editData.department}
            onChange={e => setEditData({ ...editData, department: e.target.value })}
            placeholder="Departamento/Estado"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="text"
            value={editData.country}
            onChange={e => setEditData({ ...editData, country: e.target.value })}
            placeholder="País"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="text"
            value={editData.postalCode}
            onChange={e => setEditData({ ...editData, postalCode: e.target.value })}
            placeholder="Código postal"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex space-x-2 mt-4">
          <button
            onClick={handleUpdate}
            disabled={updating}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-1"
          >
            <Save className="w-4 h-4" />
            <span>{updating ? 'Guardando...' : 'Guardar'}</span>
          </button>
          <button
            onClick={handleCancel}
            disabled={updating}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-start space-x-3">
          <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-gray-900 font-medium">{editData.street}</p>
            <p className="text-gray-600">
              {editData.city}, {editData.department}
            </p>
            <p className="text-gray-600">
              {editData.country} {editData.postalCode && `- ${editData.postalCode}`}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:text-blue-800 p-1"
            title="Editar dirección"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-red-600 hover:text-red-800 disabled:opacity-50 p-1"
            title="Eliminar dirección"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
