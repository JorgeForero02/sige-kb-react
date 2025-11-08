import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:'100vh'}}>
        <div style={{textAlign:'center'}}>
          <div className="spinner-border"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}