import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { hasPermission } from '../services/permissions';

export function usePermissions() {
  const { rol } = useContext(AuthContext);

  return {
    rol,
    can: (permission) => hasPermission(rol, permission),
    canViewUsuarios: () => hasPermission(rol, 'VIEW_USUARIOS'),
    canEditUsuarios: () => hasPermission(rol, 'EDIT_USUARIO'),
    canViewFinanzas: () => hasPermission(rol, 'VIEW_FINANCIAL_DASHBOARD'),
    canCreateCita: () => hasPermission(rol, 'CREATE_CITA'),
    canEditCita: () => hasPermission(rol, 'EDIT_CITA'),
    canViewIngresos: () => hasPermission(rol, 'VIEW_INGRESOS'),
    canCreateIngreso: () => hasPermission(rol, 'CREATE_INGRESO'),
  };
}
