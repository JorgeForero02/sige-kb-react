import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { logger } from '../services/logger';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, Button, Input, Select, Loading, Empty } from '../components/common/Components';
import { AlertSimple } from '../components/common/AlertSimple';
import { useAlert } from '../hooks/useAlert';
import { usePermissions } from '../hooks/usePermissions';
import '../pages/Pages.css';

export function ServiciosPage() {
  const [servicios, setServicios] = useState([]);
  const [serviciosFiltrados, setServiciosFiltrados] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const categoriaId = searchParams.get('categoria');

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    duracion: '',
    categoria: '',
    precio: '',
    porcentaje: ''
  });

  const { alert, success, error: showError, warning } = useAlert();
  const { can } = usePermissions();

  if (!can('VIEW_SERVICIOS')) {
    return (
      <MainLayout title="Servicios">
        <AlertSimple message="No tienes permiso para acceder a esta seccion" type="error" />
      </MainLayout>
    );
  }

  useEffect(() => {
    fetchData();
  }, [categoriaId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [servRes, catRes] = await Promise.all([
        api.getServicios(),
        api.getCategorias()
      ]);

      const todosServicios = servRes.data || [];
      setServicios(todosServicios);
      setCategorias(catRes.data || []);

      let serviciosFiltrados = todosServicios;
      if (categoriaId) {
        serviciosFiltrados = todosServicios.filter(servicio =>
          servicio.categoria_id === parseInt(categoriaId) ||
          servicio.categoriaId === parseInt(categoriaId)
        );
      }

      setServiciosFiltrados(serviciosFiltrados);
      logger.success('Servicios cargados', `${serviciosFiltrados.length} servicios`);
    } catch (err) {
      logger.error('Error al cargar servicios', err.message);
      showError(err.message || 'Error al cargar servicios');
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

  const getEstadoServicio = (servicio) => {
    if (servicio.estado !== undefined && servicio.estado !== null) {
      return String(servicio.estado).toUpperCase();
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

    if (!formData.nombre.trim() || !formData.duracion || !formData.categoria || !formData.precio) {
      warning('Completa todos los campos requeridos');
      return;
    }

    setSaving(true);
    try {
      await api.crearServicio(formData);
      success('Servicio creado exitosamente!');
      logger.success('Servicio creado', formData.nombre);
      setFormData({ nombre: '', descripcion: '', duracion: '', categoria: '', precio: '', porcentaje: '' });
      setShowForm(false);
      fetchData();
    } catch (err) {
      logger.error('Error al crear servicio', err.message);
      showError(err.message || 'Error al crear servicio');
    }
    setSaving(false);
  };

  const handleEdit = async (servicio) => {
    warning('Funcionalidad de edición en desarrollo');
  };

  const handleDelete = async (servicio) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar el servicio "${servicio.nombre}"?`)) {
      return;
    }

    try {;
      success('Servicio eliminado exitosamente!');
      fetchData();
    } catch (err) {
      logger.error('Error al eliminar servicio', err.message);
      showError(err.message || 'Error al eliminar servicio');
    }
  };

  const getCategoriaActual = () => {
    if (!categoriaId) return null;
    return categorias.find(cat => cat.id === parseInt(categoriaId));
  };

  const categoriaActual = getCategoriaActual();

  const limpiarFiltroCategoria = () => {
    setSearchParams({});
  };

  const serviciosBuscados = serviciosFiltrados.filter(servicio =>
    servicio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (servicio.descripcion && servicio.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <MainLayout title={categoriaActual ? `Servicios - ${categoriaActual.nombre}` : "Servicios"}>
      {alert && <AlertSimple message={alert.message} type={alert.type} />}

      <div className="page-header">
        <div>
          <h4 style={{ margin: 0 }}>Listado de Servicios</h4>
          <p style={{ color: '#6B7280', margin: '0.5rem 0 0 0' }}>
            {categoriaActual ? (
              <span>
                {serviciosFiltrados.length} servicio{serviciosFiltrados.length !== 1 ? 's' : ''} en esta categoría
                <Button
                  variant="link"
                  onClick={limpiarFiltroCategoria}
                  style={{
                    padding: '0',
                    marginLeft: '0.5rem',
                    fontSize: '0.8rem',
                    color: '#F74780',
                    textDecoration: 'none'
                  }}
                >
                  (ver todos los servicios)
                </Button>
              </span>
            ) : (
              `Total: ${serviciosFiltrados.length} servicio${serviciosFiltrados.length !== 1 ? 's' : ''}`
            )}
          </p>
          {categoriaActual?.descripcion && (
            <p style={{ margin: '0.5rem 0 0 0', color: '#9CA3AF', fontSize: '0.85rem', fontStyle: 'italic' }}>
              {categoriaActual.descripcion}
            </p>
          )}
        </div>
        {can('CREATE_SERVICIO') && (
          <Button onClick={() => setShowForm(!showForm)}>
            + Nuevo Servicio
          </Button>
        )}
      </div>

      {/* Barra de búsqueda */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Input
          placeholder="Buscar por servicio..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: '300px' }}
        />
      </div>

      {showForm && can('CREATE_SERVICIO') && (
        <Card>
          <h4 style={{ marginBottom: '1.5rem', fontWeight: '700', color: '#1F2937' }}>
            <i className="bi bi-plus-circle"></i> Agregar Servicio
          </h4>
          <form onSubmit={handleSubmit} className="form-layout">
            <Input
              label="Nombre *"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Nombre del servicio"
              required
              autoFocus
            />
            <Input
              label="Descripción"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Descripción del servicio"
            />
            <Input
              label="Duración (minutos) *"
              type="number"
              value={formData.duracion}
              onChange={(e) => setFormData({ ...formData, duracion: e.target.value })}
              placeholder="30"
              min="15"
              step="15"
              required
            />
            <Select
              label="Categoría *"
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              options={categorias}
              required
            />
            <Input
              label="Precio *"
              type="number"
              value={formData.precio}
              onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
            <Input
              label="Porcentaje comisión"
              type="number"
              value={formData.porcentaje}
              onChange={(e) => setFormData({ ...formData, porcentaje: e.target.value })}
              placeholder="0"
              min="0"
              max="100"
            />
            <div className="form-actions">
              <Button variant="primary" disabled={saving}>
                {saving ? 'Guardando...' : 'Crear Servicio'}
              </Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tabla de servicios */}
      <div className="table-container">
        {loading ? (
          <Loading />
        ) : serviciosBuscados.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Servicio</th>
                <th>Estado</th>
                <th>Fecha de Creación</th>
                <th>Descripción</th>
                <th>Duración</th>
                {can('EDIT_SERVICIO') && <th>Acciones</th>}
                {can('EDIT_SERVICIO') && <th>Tarifas</th>}
              </tr>
            </thead>
            // En la tabla de servicios - reemplaza desde la línea del tbody:
            <tbody>
              {serviciosBuscados.map(servicio => {
                const estado = getEstadoServicio(servicio);
                const estadoInfo = getColorEstado(estado);
                const fechaCreacion = formatFecha(servicio.created_at || servicio.fecha_creacion || servicio.fechaCreacion);

                return (
                  <tr key={servicio.id}>
                    <td>
                      <strong>{servicio.nombre}</strong>
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
                    <td style={{ maxWidth: '200px' }}>
                      <span style={{
                        color: '#6B7280',
                        fontSize: '0.85rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {servicio.descripcion || 'Sin descripción'}
                      </span>
                    </td>
                    <td style={{ fontWeight: '500', color: '#374151' }}>
                      {servicio.duracion} minutos
                    </td>

                    {can('EDIT_SERVICIO') && (
                      <td>
                        <div className="table-actions" style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEdit(servicio)}
                            title="Editar servicio"
                            style={{
                              padding: '0.2rem 0.5rem',
                              fontSize: '0.75rem',
                              minWidth: 'auto'
                            }}
                          >
                            <i className="bi bi-pencil"></i>
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(servicio)}
                            title="Eliminar servicio"
                            style={{
                              padding: '0.2rem 0.5rem',
                              fontSize: '0.75rem',
                              minWidth: 'auto'
                            }}
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                          <Button
                            variant={estado === 'ACTIVO' ? 'warning' : 'success'}
                            size="sm"
                            onClick={() => handleToggleEstado(servicio)}
                            title={estado === 'ACTIVO' ? 'Desactivar servicio' : 'Activar servicio'}
                            style={{
                              padding: '0.2rem 0.5rem',
                              fontSize: '0.75rem',
                              minWidth: 'auto'
                            }}
                          >
                            <i className={estado === 'ACTIVO' ? 'bi bi-pause' : 'bi bi-play'}></i>
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <Empty message={
            searchTerm
              ? "No se encontraron servicios que coincidan con la búsqueda"
              : categoriaId
                ? `No hay servicios en la categoría "${categoriaActual?.nombre || 'seleccionada'}"`
                : "No hay servicios registrados"
          } />
        )}
      </div>
    </MainLayout>
  );
}