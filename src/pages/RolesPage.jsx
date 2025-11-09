import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { logger } from '../services/logger';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, Button, Input, Loading, Empty } from '../components/common/Components';
import { AlertSimple } from '../components/common/AlertSimple';
import { useAlert } from '../hooks/useAlert';
import '../pages/Pages.css';

function Modal({ show, onClose, children }) {
  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        position: 'relative'
      }}>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#666',
            zIndex: 1001
          }}
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

export function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [showModal, setShowModal] = useState(false);
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
      const result = await api.getRoles();
      setRoles(result.data || []);
      logger.success('Roles cargados', `${result.data?.length || 0} roles`);
    } catch (err) {
      logger.error('Error al cargar roles', err.message);
      showError(err.message || 'Error al cargar roles');
      setRoles([]);
    }
    setLoading(false);
  };

  const handleEdit = (rol) => {
    setEditingId(rol.id);
    setFormData({
      nombre: rol.nombre,
      descripcion: rol.descripcion || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      warning('El nombre es requerido');
      return;
    }

    setSaving(true);
    try {
      let result;
      if (editingId) {
        result = await api.request(`/roles/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        result = await api.request('/roles', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }

      if (result.success) {
        success(editingId ? 'Rol actualizado!' : 'Rol creado!');
        setFormData({ nombre: '', descripcion: '' });
        setEditingId(null);
        setShowModal(false);
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
      const result = await api.request(`/roles/${id}`, {
        method: 'DELETE'
      });

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

  const handleOpenModal = () => {
    setShowModal(true);
    setEditingId(null);
    setFormData({ nombre: '', descripcion: '' });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ nombre: '', descripcion: '' });
  };

  return (
    <MainLayout title="Gestión de Roles">
      {alert && <AlertSimple message={alert.message} type={alert.type} />}

      <div className="page-header">
        <h4 style={{margin: 0, color: '#9CA3AF', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: '700'}}>
          Total: {roles.length} roles
        </h4>
        <Button onClick={handleOpenModal}>
          <i className="bi bi-plus-circle"></i> Nuevo Rol
        </Button>
      </div>

      {/* Modal para el formulario */}
      <Modal show={showModal} onClose={handleCloseModal}>
        <h4 style={{marginBottom: '1.5rem', fontWeight: '700', fontSize: '1.2rem', color: '#1F2937'}}>
          <i className="bi bi-shield-check"></i> {editingId ? 'Editar Rol' : 'Crear Rol'}
        </h4>
        <form onSubmit={handleSubmit} className="form-layout">
          <Input
            label="Nombre "
            value={formData.nombre}
            onChange={(e) => setFormData({...formData, nombre: e.target.value})}
            placeholder="Ej: Recepcionista"
            required
            autoFocus
          />
          <Input
            label="Descripción"
            value={formData.descripcion}
            onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
            placeholder="Descripción del rol"
          />
          <div className="form-actions">
            <Button variant="primary" disabled={saving}>
              {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
            </Button>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      <Card>
        <div className="card-header">
          <h3 className="card-title">
            <i className="bi bi-list-check"></i>
            Listado de Roles
          </h3>
        </div>

        <div className="table-responsive">
          {loading ? (
            <Loading />
          ) : roles.length > 0 ? (
            <table className="table table-sm table-hover">
              <thead className="table-light">
                <tr>
                  <th scope="col" className="fw-semibold">ID</th>
                  <th scope="col" className="fw-semibold">Rol</th>
                  <th scope="col" className="fw-semibold">Descripción</th>
                  <th scope="col" className="fw-semibold">Estado</th>
                  <th scope="col" className="fw-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {roles.map(rol => (
                  <tr key={rol.id}>
                    <td className="align-middle">{rol.id}</td>
                    <td className="align-middle">
                      <strong>{rol.nombre}</strong>
                    </td>
                    <td className="align-middle">
                      <small className="text-muted">
                        {rol.descripcion || 'Sin descripción'}
                      </small>
                    </td>
                    <td className="align-middle">
                      <span className={`badge ${rol.estado === 1 ? 'bg-success' : 'bg-danger'}`}>
                        {rol.estado === 1 ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="align-middle">
                      <div className="d-flex gap-1 justify-content-center">
                        <Button 
                          onClick={() => handleEdit(rol)} 
                          variant="outline-primary" 
                          size="sm"
                          className="btn-sm"
                        >
                          <i className="bi bi-pencil"></i> Editar
                        </Button>
                        <Button 
                          onClick={() => handleDelete(rol.id)} 
                          variant="outline-danger" 
                          size="sm"
                          className="btn-sm"
                        >
                          <i className="bi bi-trash"></i> Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty message="No hay roles registrados" />
          )}
        </div>
      </Card>
    </MainLayout>
  );
}