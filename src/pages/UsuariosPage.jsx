import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, Button, Input, Select, Loading, Empty, Alert } from '../components/common/Components';
import { usePermissions } from '../hooks/usePermissions';
import '../pages/Pages.css';

export function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { can } = usePermissions();

  if (!can('VIEW_USUARIOS')) {
    return (
      <MainLayout title="Usuarios">
        <Alert type="danger">No tienes permisos para acceder a esta seccion</Alert>
      </MainLayout>
    );
  }

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    setLoading(true);
    try {
      const res = await api.getUsuarios();
      setUsuarios(res.data || []);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <MainLayout title="Gestion de Usuarios">
      {error && <Alert type="danger">{error}</Alert>}

      <div className="page-header">
        <h4 style={{margin: 0}}>Total: {usuarios.length} usuarios</h4>
        {can('CREATE_USUARIO') && <Button>+ Nuevo Usuario</Button>}
      </div>

      <div className="table-container">
        {loading ? (
          <Loading />
        ) : usuarios.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id}>
                  <td>{u.nombre} {u.apellido}</td>
                  <td>{u.email}</td>
                  <td><span className="badge" style={{background: '#D1FAE5', color: '#065F46'}}>{u.rolInfo?.nombre}</span></td>
                  <td><span className="badge" style={{background: u.estado === 1 ? '#D1FAE5' : '#FEE2E2', color: u.estado === 1 ? '#065F46' : '#7F1D1D'}}>{u.estado === 1 ? 'Activo' : 'Inactivo'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty message="No hay usuarios" />
        )}
      </div>
    </MainLayout>
  );
}