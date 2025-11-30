import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AccessDenied } from '../common/AccessDenied'; 

export function ProtectedRoute({ children }) {
  const { user, rol, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const ROLES_PERMITIDOS = ['Administrador', 'Gerente', 'Empleado'];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner-border"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRol = rol || user?.rol || user?.rolInfo?.nombre;

  if (!ROLES_PERMITIDOS.includes(userRol)) {
    return <AccessDenied />;
  }

  const currentPath = location.pathname;

  if (currentPath === '/') {
    if (userRol === 'Empleado') {
      return <Navigate to="/home-empleado" replace />;
    } else {
      return <Navigate to="/home" replace />;
    }
  }

  if (currentPath === '/home' && userRol === 'Empleado') {
    return <Navigate to="/home-empleado" replace />;
  }

  if (currentPath === '/home-empleado' && userRol !== 'Empleado') {
    return <Navigate to="/home" replace />;
  }

  return children;
}