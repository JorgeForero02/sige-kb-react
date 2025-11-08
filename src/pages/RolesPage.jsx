import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { logger } from '../services/logger';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, Button, Input, Loading, Empty } from '../components/common/Components';
import { AlertSimple } from '../components/common/AlertSimple';
import { useAlert } from '../hooks/useAlert';
import '../pages/Pages.css';

export function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: ''
  });
  const { alert, success, error: showError, warning } = useAlert();

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      // Usar fetch directo con tu estructura
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/roles', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setRoles(result.data || []);
        logger.success('Roles cargados', `${result.data?.length || 0} roles`);
      } else {
        throw new Error(result.message || 'Error al cargar roles');
      }
    } catch (err) {
      logger.error('Error al cargar roles', err.message);
      showError(err.message || 'Error al cargar roles');
      setRoles([]); // Evitar crash
    }
    setLoading(false);
  };

  const handleEdit = (rol) => {
    setEditingId(rol.id);
    setFormData({
      nombre: rol.nombre,
      descripcion: rol.descripcion || ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      warning('El nombre es requerido');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const url = editingId 
        ? `http://localhost:3000/api/roles/${editingId}` 
        : 'http://localhost:3000/api/roles';
      
      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        success(editingId ? 'Rol actualizado!' : 'Rol creado!');
        setFormData({ nombre: '', descripcion: '' });
        setEditingId(null);
        setShowForm(false);
        fetchRoles();
      } else {
        throw new Error(result.message || 'Error al guardar');
      }
    } catch (err) {
      logger.error('Error', err.message);
      showError(err.message || 'Error al guardar rol');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este rol?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/roles/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        success('Rol eliminado!');
        fetchRoles();
      } else {
        throw new Error(result.message || 'Error al eliminar');
      }
    } catch (err) {
      logger.error('Error al eliminar', err.message);
      showError(err.message || 'Error al eliminar rol');
    }
  };

  return (
    <MainLayout title="Gestión de Roles">
      {alert && <AlertSimple message={alert.message} type={alert.type} />}

      <div className="page-header">
        <h4 style={{margin: 0, color: '#9CA3AF', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: '700'}}>
          Total: {roles.length} roles
        </h4>
        <Button onClick={() => {
          setShowForm(!showForm); 
          setEditingId(null); 
          setFormData({nombre: '', descripcion: ''});
        }}>
          <i className="bi bi-plus-circle"></i> Nuevo Rol
        </Button>
      </div>

      {showForm && (
        <Card>
          <h4 style={{marginBottom: '1.5rem', fontWeight: '700', fontSize: '1.2rem', color: '#1F2937'}}>
            <i className="bi bi-shield-check"></i> {editingId ? 'Editar Rol' : 'Crear Rol'}
          </h4>
          <form onSubmit={handleSubmit} className="form-layout">
            <Input
              label="Nombre *"
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              placeholder="Ej: Recepcionista"
              required
            />
            <Input
              label="Descripción"
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              placeholder="Descripción del rol"
            />
            <div className="form-actions" style={{gridColumn: '1 / -1'}}>
              <Button variant="primary" type="submit" disabled={saving}>
                {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
              </Button>
              <Button variant="secondary" type="button" onClick={() => {setShowForm(false); setEditingId(null);}}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="table-container">
        {loading ? (
          <Loading />
        ) : roles.length > 0 ? (
          <Card>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {roles.map(rol => (
                  <tr key={rol.id}>
                    <td>{rol.id}</td>
                    <td><strong>{rol.nombre}</strong></td>
                    <td>{rol.descripcion || '-'}</td>
                    <td>
                      <span className={`badge ${rol.estado === 1 ? 'badge-success' : 'badge-danger'}`}>
                        {rol.estado === 1 ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div style={{display: 'flex', gap: '0.5rem'}}>
                        <Button 
                          onClick={() => handleEdit(rol)} 
                          variant="secondary" 
                          style={{fontSize: '0.85rem', padding: '0.4rem 0.8rem'}}
                        >
                          <i className="bi bi-pencil"></i> Editar
                        </Button>
                        <Button 
                          onClick={() => handleDelete(rol.id)} 
                          variant="danger" 
                          style={{fontSize: '0.85rem', padding: '0.4rem 0.8rem'}}
                        >
                          <i className="bi bi-trash"></i> Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : (
          <Empty message="No hay roles registrados" />
        )}
      </div>
    </MainLayout>
  );
}