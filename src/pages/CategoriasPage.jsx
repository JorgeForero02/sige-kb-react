import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { logger } from '../services/logger';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, Button, Input, Loading, Empty } from '../components/common/Components';
import { AlertSimple } from '../components/common/AlertSimple';
import { useAlert } from '../hooks/useAlert';
import { usePermissions } from '../hooks/usePermissions';
import { useCategorias } from '../context/CategoriasContext';
import '../pages/Pages.css';

function Modal({ show, onClose, children, title, size = 'md' }) {
  if (!show) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getModalSize = () => {
    const sizes = {
      sm: '400px',
      md: '500px',
      lg: '600px'
    };
    return sizes[size] || sizes.md;
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000,
        padding: '1rem'
      }}
      onClick={handleOverlayClick}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          width: '90%',
          maxWidth: getModalSize(),
          maxHeight: '80vh',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem 1.5rem 1rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#1f2937'
          }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '0.25rem',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#f3f4f6'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            ×
          </button>
        </div>
        <div style={{ padding: '1.5rem' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function CategoriasPage() {
  const [categorias, setCategorias] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [categoriaToEdit, setCategoriaToEdit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: ''
  });
  const { alert, success, error: showError, warning } = useAlert();
  const { can } = usePermissions();
  const { refreshCategorias } = useCategorias();

  if (!can('VIEW_CATEGORIAS')) {
    return (
      <MainLayout title="Categorias">
        <AlertSimple message="No tienes permiso para acceder a esta seccion" type="error" />
      </MainLayout>
    );
  }

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    setLoading(true);
    try {
      let res;
      try {
        res = await api.getCategorias();
      } catch (err) {
        res = await api.get('/categories');
      }

      setCategorias(res.data || []);
      logger.success('Categorias cargadas', `${res.data?.length || 0} categorias`);
    } catch (err) {
      logger.error('Error al cargar categorias', err.message);
      showError(err.message || 'Error al cargar categorias');
    }
    setLoading(false);
  };

  const formatFecha = (fechaString) => {
    if (!fechaString) {
      return new Date().toLocaleDateString('es-ES');
    }

    try {
      const fecha = new Date(fechaString);
      if (isNaN(fecha.getTime())) {
        return new Date().toLocaleDateString('es-ES');
      }
      return fecha.toLocaleDateString('es-ES');
    } catch (error) {
      return new Date().toLocaleDateString('es-ES');
    }
  };

  const getEstadoCategoria = (categoria) => {
    if (categoria.estado !== undefined && categoria.estado !== null) {
      return String(categoria.estado).toUpperCase();
    }
    return 'ACTIVO';
  };

  const getColorEstado = (estado) => {
    const estadoUpper = String(estado).toUpperCase();

    if (estadoUpper === 'ACTIVO' || estadoUpper === 'ACTIVA' || estadoUpper === '1' || estadoUpper === 'TRUE') {
      return {
        background: '#DCFCE7',
        color: '#166534',
        text: 'Activo'
      };
    } else if (estadoUpper === 'INACTIVO' || estadoUpper === 'INACTIVA' || estadoUpper === '0' || estadoUpper === 'FALSE') {
      return {
        background: '#FEE2E2',
        color: '#7F1D1D',
        text: 'Inactivo'
      };
    } else {
      return {
        background: '#FEF3C7',
        color: '#92400E',
        text: 'Desconocido'
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      warning('El nombre de la categoría es obligatorio');
      return;
    }

    setSaving(true);
    try {
      await api.crearCategoria(formData);
      success('¡Categoría creada exitosamente!');
      setFormData({ nombre: '', descripcion: '' });
      setShowModal(false);
      fetchCategorias();
      refreshCategorias();
    } catch (err) {
      const errorMessage = err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Error al crear la categoría';
      showError(errorMessage);
    }
    setSaving(false);
  };

  const handleEdit = (categoria) => {
  const estado = getEstadoCategoria(categoria);
  
  if (estado === 'INACTIVO' || estado === 'INACTIVA' || estado === '0' || estado === 'FALSE') {
    showError('No se puede editar una categoría inactiva.');
    return;
  }

  setCategoriaToEdit(categoria);
  setFormData({
    nombre: categoria.nombre,
    descripcion: categoria.descripcion || ''
  });
  setShowEditModal(true);
};

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      warning('El nombre de la categoría es obligatorio');
      return;
    }

    setSaving(true);
    try {
      await api.actualizarCategoria(categoriaToEdit.id, formData);
      success('¡Categoría actualizada exitosamente!');
      setShowEditModal(false);
      setCategoriaToEdit(null);
      setFormData({ nombre: '', descripcion: '' });
      fetchCategorias();
      refreshCategorias();
    } catch (err) {
      const errorMessage = err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Error al actualizar la categoría';
      showError(errorMessage);
    }
    setSaving(false);
  };

  const handleDelete = async (categoria) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar la categoría "${categoria.nombre}"?`)) {
      return;
    }

    try {
      await api.eliminarCategoria(categoria.id);
      success('¡Categoría eliminada exitosamente!');
      fetchCategorias();
      refreshCategorias();
    } catch (err) {
      const errorMessage = err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Error al eliminar la categoría';
      showError(errorMessage);
    }
  };

  const handleToggleEstado = async (categoria) => {
    const nuevoEstado = getEstadoCategoria(categoria) === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    const accion = nuevoEstado === 'ACTIVO' ? 'activar' : 'desactivar';

    if (!window.confirm(`¿Estás seguro de que quieres ${accion} la categoría "${categoria.nombre}"?`)) {
      return;
    }

    try {
      await api.actualizarCategoria(categoria.id, { estado: nuevoEstado.toLowerCase() });
      success(`Categoría ${accion}da exitosamente!`);
      fetchCategorias();
      refreshCategorias();
    } catch (err) {
      logger.error(`Error al ${accion} categoria`, err.message);
      showError(err.message || `Error al ${accion} categoria`);
    }
  };

  const handleOpenModal = () => {
    setShowModal(true);
    setFormData({ nombre: '', descripcion: '' });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ nombre: '', descripcion: '' });
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setCategoriaToEdit(null);
    setFormData({ nombre: '', descripcion: '' });
  };

  const categoriasFiltradas = categorias.filter(categoria =>
    categoria.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (categoria.descripcion && categoria.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <MainLayout title="Categorías">
      {alert && <AlertSimple message={alert.message} type={alert.type} />}
      {can('CREATE_CATEGORIA') && (
        <Button onClick={handleOpenModal}> + Nueva Categoría</Button>
      )}

      <div className="page-header">
        <div>
          <h4 className='categorias-main-title'>Listado de Categorías</h4>
          <p style={{ color: '#6B7280', margin: '0.5rem 0 0 0' }}>
            Total: {categorias.length} categorías
          </p>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Input
          placeholder="Buscar por categoría..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: '300px' }}
        />
      </div>
      <Modal
        show={showModal}
        onClose={handleCloseModal}
        title="Agregar Categoría"
        size="sm"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{
              fontWeight: '600',
              color: '#f74780',
              fontSize: '0.9rem',
              display: 'block',
              marginBottom: '0.25rem'
            }}>
              Nombre *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Nombre de la categoría"
              required
              autoFocus
              style={{
                padding: '0.75rem 1rem',
                border: '2px solid rgba(247, 71, 128, 0.3)',
                borderRadius: '8px',
                fontSize: '0.95rem',
                width: '100%',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{
              fontWeight: '600',
              color: '#f74780',
              fontSize: '0.9rem',
              display: 'block',
              marginBottom: '0.25rem'
            }}>
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Descripción de la categoría"
              rows="3"
              style={{
                padding: '0.75rem 1rem',
                border: '2px solid rgba(247, 71, 128, 0.3)',
                borderRadius: '8px',
                fontSize: '0.95rem',
                width: '100%',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>
          <div className="modal-actions">
            <Button variant="primary" disabled={saving} type="submit">
              {saving ? 'Guardando...' : 'Crear Categoría'}
            </Button>
            <Button variant="secondary" onClick={handleCloseModal} type="button">
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal para editar categoría */}
      <Modal
        show={showEditModal}
        onClose={handleCloseEditModal}
        title="Editar Categoría"
        size="sm"
      >
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{
              fontWeight: '600',
              color: '#f74780',
              fontSize: '0.9rem',
              display: 'block',
              marginBottom: '0.25rem'
            }}>
              Nombre *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Nombre de la categoría"
              required
              autoFocus
              style={{
                padding: '0.75rem 1rem',
                border: '2px solid rgba(247, 71, 128, 0.3)',
                borderRadius: '8px',
                fontSize: '0.95rem',
                width: '100%',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{
              fontWeight: '600',
              color: '#f74780',
              fontSize: '0.9rem',
              display: 'block',
              marginBottom: '0.25rem'
            }}>
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Descripción de la categoría"
              rows="3"
              style={{
                padding: '0.75rem 1rem',
                border: '2px solid rgba(247, 71, 128, 0.3)',
                borderRadius: '8px',
                fontSize: '0.95rem',
                width: '100%',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>
          <div className="modal-actions">
            <Button variant="primary" disabled={saving} type="submit">
              {saving ? 'Guardando...' : 'Actualizar Categoría'}
            </Button>
            <Button variant="secondary" onClick={handleCloseEditModal} type="button">
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Tabla de categorías */}
      <div className="table-container">
        {loading ? (
          <Loading />
        ) : categoriasFiltradas.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Estado</th>
                <th>Fecha de Creación</th>
                <th>Descripción</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categoriasFiltradas.map(categoria => {
                const estado = getEstadoCategoria(categoria);
                const estadoInfo = getColorEstado(estado);
                const fechaCreacion = formatFecha(categoria.created_at || categoria.fecha_creacion || categoria.fechaCreacion);

                return (
                  <tr key={categoria.id}>
                    <td>
                      <strong>{categoria.nombre}</strong>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '0.35rem 0.9rem',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          backgroundColor: estadoInfo.background,
                          color: estadoInfo.color,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                      >
                        {estadoInfo.text}
                      </span>
                    </td>
                    <td style={{ fontWeight: '500', color: '#374151' }}>
                      {fechaCreacion}
                    </td>
                    <td style={{ maxWidth: '300px' }}>
                      <span style={{
                        color: '#6B7280',
                        fontSize: '0.85rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {categoria.descripcion || 'Sin descripción'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        {can('EDIT_CATEGORIA') && (
                          <Button
                            variant="secondary"
                            className="btn-sm"
                            onClick={() => handleEdit(categoria)}
                            title={estado === 'INACTIVO' ? 'No se puede editar categorías inactivas' : 'Editar categoría'}
                            disabled={estado === 'INACTIVO' || estado === 'INACTIVA'}
                            style={{
                              opacity: (estado === 'INACTIVO' || estado === 'INACTIVA') ? 0.5 : 1,
                              cursor: (estado === 'INACTIVO' || estado === 'INACTIVA') ? 'not-allowed' : 'pointer'
                            }}
                          >
                            <i className="bi bi-pencil"></i>
                            <span>Editar</span>
                          </Button>
                        )}
                        {can('DELETE_CATEGORIA') && (
                          <Button
                            variant="danger"
                            className="btn-sm"
                            onClick={() => handleDelete(categoria)}
                            title="Eliminar categoría"
                          >
                            <i className="bi bi-trash"></i>
                            <span>Eliminar</span>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <Empty message={searchTerm ? "No se encontraron categorías" : "No hay categorías registradas"} />
        )}
      </div>
    </MainLayout>
  );
}