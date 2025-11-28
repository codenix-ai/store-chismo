'use client';

import { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { Edit, Trash2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { User, UserRole } from '@/types/user';

// GraphQL mutations
const UPDATE_USER = gql`
  mutation UpdateUser($id: String!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      id
      name
      email
      role
      membershipLevel
    }
  }
`;

const DELETE_USER = gql`
  mutation DeleteUser($id: String!) {
    deleteUser(id: $id) {
      id
    }
  }
`;

interface UserActionsProps {
  user: User;
  onUserUpdated: () => void;
  onUserDeleted: () => void;
}

export function UserActions({ user, onUserUpdated, onUserDeleted }: UserActionsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
    membershipLevel: user.membershipLevel || '',
  });

  const [updateUser, { loading: updating }] = useMutation(UPDATE_USER);
  const [deleteUser, { loading: deleting }] = useMutation(DELETE_USER);

  const handleSave = async () => {
    try {
      await updateUser({
        variables: {
          id: user.id,
          input: {
            name: editData.name,
            email: editData.email,
            role: editData.role,
            membershipLevel: editData.membershipLevel || null,
          },
        },
      });

      toast.success('Usuario actualizado exitosamente');
      setIsEditing(false);
      onUserUpdated();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Error al actualizar el usuario');
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await deleteUser({
        variables: { id: user.id },
      });

      toast.success('Usuario eliminado exitosamente');
      onUserDeleted();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Error al eliminar el usuario');
    }
  };

  const handleCancel = () => {
    setEditData({
      name: user.name,
      email: user.email,
      role: user.role,
      membershipLevel: user.membershipLevel || '',
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex space-x-2">
        <button
          onClick={handleSave}
          disabled={updating}
          className="text-green-600 hover:text-green-900 disabled:opacity-50"
          title="Guardar cambios"
        >
          <Save className="w-4 h-4" />
        </button>
        <button
          onClick={handleCancel}
          disabled={updating}
          className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
          title="Cancelar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex space-x-2">
      <button onClick={() => setIsEditing(true)} className="text-blue-600 hover:text-blue-900" title="Editar usuario">
        <Edit className="w-4 h-4" />
      </button>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-red-600 hover:text-red-900 disabled:opacity-50"
        title="Eliminar usuario"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

interface EditableUserRowProps {
  user: User;
  isEditing: boolean;
  editData: {
    name: string;
    email: string;
    role: UserRole;
    membershipLevel: string;
  };
  onEditDataChange: (field: string, value: string) => void;
  formatDate: (date: string) => string;
  getRoleBadge: (role: UserRole) => string;
}

export function EditableUserRow({
  user,
  isEditing,
  editData,
  onEditDataChange,
  formatDate,
  getRoleBadge,
}: EditableUserRowProps) {
  if (!isEditing) {
    return (
      <>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10">
              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">{user.name.charAt(0).toUpperCase()}</span>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">{user.name}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadge(user.role)}`}>
            {user.role}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.membershipLevel || 'N/A'}</td>
      </>
    );
  }

  return (
    <>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="space-y-2">
          <input
            type="text"
            value={editData.name}
            onChange={e => onEditDataChange('name', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
            placeholder="Nombre"
          />
          <input
            type="email"
            value={editData.email}
            onChange={e => onEditDataChange('email', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
            placeholder="Email"
          />
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <select
          value={editData.role}
          onChange={e => onEditDataChange('role', e.target.value)}
          className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
        >
          <option value="USER">Usuario</option>
          <option value="STORE_OWNER">Propietario</option>
          <option value="ADMIN">Administrador</option>
        </select>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="text"
          value={editData.membershipLevel}
          onChange={e => onEditDataChange('membershipLevel', e.target.value)}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
          placeholder="Nivel de membresía"
        />
      </td>
    </>
  );
}
