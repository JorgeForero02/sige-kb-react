import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { logger } from '../services/logger';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, Button, Input, Loading, Empty } from '../components/common/Components';
import { AlertSimple } from '../components/common/AlertSimple';
import { useAlert } from '../hooks/useAlert';
import '../pages/Pages.css';
import '../components/common/Notifications.css';

function Modal({ show, onClose, children, title }) {
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
      zIndex: 9999
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)',
        borderRadius: '24px',
        padding: '2.5rem',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 40px rgba(247, 71, 128, 0.2)',
        border: '2px solid #F8D7E8',
        position: 'relative'
      }}>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.5rem',
            right: '1.5rem',
            background: 'none',
            border: 'none',
            fontSize: '2rem',
            cursor: 'pointer',
            color: '#9CA3AF',
            zIndex: 10000,
            padding: 0,
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s ease',
            lineHeight: '1'
          }}
          onMouseEnter={(e) => e.target.style.color = '#6B7280'}
          onMouseLeave={(e) => e.target.style.color = '#9CA3AF'}
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
  
  // Estado para confirmación
  const [showConfirmacion, setShowConfirmacion] = useState(false);
  const [confirmacionData, setConfirmacionData] = useState({
    title: '',
    message: '',
    action: null,
    type: 'warning',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar'
  });
  const [confirmLoading, setConfirmLoading] = useState(false);
  
  const { alert, success, error: showError, warning, clearAlert } = useAlert();

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const result = await api.getRoles();
      console.log('Result from getRoles:', result);
      const rolesData = result.data || result || [];
      setRoles(Array.isArray(rolesData) ? rolesData : []);
      logger.success('Roles cargados', `${Array.isArray(rolesData) ? rolesData.length : 0} roles`);
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

      // Si no hay error, significa que fue exitoso
      success(
        editingId ? 'Rol actualizado exitosamente!' : 'Rol creado exitosamente!',
        { title: editingId ? 'Rol actualizado' : 'Rol creado', autoHide: false }
      );
      setFormData({ nombre: '', descripcion: '' });
      setEditingId(null);
      setShowModal(false);
      await fetchRoles();
    } catch (err) {
      // Recargar roles para sincronizar con la BD
      await fetchRoles();
      
      // Mostrar error específico
      if (err.status === 409) {
        showError('Ya existe un rol con ese nombre. Intenta con otro nombre.');
      } else {
        logger.error('Error', err.message);
        showError(err.message || 'Error al guardar rol');
      }
    }
    setSaving(false);
  };

  const handleDeleteConfirm = (rol) => {
    setConfirmacionData({
      title: 'Eliminar Rol',
      message: `¿Está seguro de que desea eliminar el rol "${rol.nombre}"?`,
      action: async () => {
        try {
          await api.request(`/roles/${rol.id}`, {
            method: 'DELETE'
          });

          success('Rol eliminado exitosamente!', { title: 'Rol eliminado', autoHide: false });
          await fetchRoles();
        } catch (err) {
          logger.error('Error al eliminar', err.message);
          showError(err.message || 'Error al eliminar rol');
          throw err;
        }
      },
      type: 'warning',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar'
    });
    setShowConfirmacion(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmacionData.action) return;
    setConfirmLoading(true);
    try {
      await confirmacionData.action();
      setShowConfirmacion(false);
    } catch (err) {
      // el error ya se muestra usando showError
    }
    setConfirmLoading(false);
  };

  const handleCancelConfirm = () => {
    if (confirmLoading) return;
    setShowConfirmacion(false);
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
      {alert && (
        <AlertSimple
          show={!!alert}
          title={alert.title}
          message={alert.message}
          type={alert.type}
          confirmText="Aceptar"
          onConfirm={clearAlert}
          onClose={clearAlert}
        />
      )}

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
        <h4 style={{
          marginBottom: '1.5rem', 
          fontWeight: '700', 
          fontSize: '1.5rem', 
          color: '#E63E6D',
          textAlign: 'center'
        }}>
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

      {/* Modal de confirmación */}
      {showConfirmacion && (
        <AlertSimple
          show={showConfirmacion}
          title={confirmacionData.title}
          message={confirmacionData.message}
          type={confirmacionData.type}
          confirmText={confirmacionData.confirmText}
          cancelText={confirmacionData.cancelText}
          showCancel
          onConfirm={handleConfirmAction}
          onCancel={handleCancelConfirm}
          onClose={handleCancelConfirm}
          loading={confirmLoading}
          closeOnOverlayClick={!confirmLoading}
        />
      )}

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
                      <div className="d-flex gap-1 justify-content-center">
                        <Button 
                          onClick={() => handleEdit(rol)} 
                          variant="outline-primary" 
                          size="sm"
                          className="btn-sm"
                          title="Editar rol"
                        >
                          <i className="bi bi-pencil"></i> Editar
                        </Button>
                        <Button 
                          onClick={() => handleDeleteConfirm(rol)} 
                          variant="outline-danger" 
                          size="sm"
                          className="btn-sm"
                          title="Eliminar rol"
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