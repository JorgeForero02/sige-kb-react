import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { logger } from '../services/logger';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, Button, Input, Select, Loading, Empty } from '../components/common/Components';
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
        maxWidth: '600px',
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

export function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [changingState, setChangingState] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    tipo_documento: 'CC',
    documento: '',
    telefono: ''
  });
  const { alert, success, error: showError, warning } = useAlert();

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const res = await api.getClientes();
      setClientes(res.data || []);
      logger.success('Clientes cargados', `${res.data?.length || 0} clientes`);
    } catch (err) {
      logger.error('Error al cargar clientes', err.message);
      showError(err.message || 'Error al cargar clientes');
    }
    setLoading(false);
  };

  const getEstadoCliente = (cliente) => {
    if (cliente.estado !== undefined && cliente.estado !== null) {
      return String(cliente.estado).toUpperCase();
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

  const handleEdit = (cliente) => {
    setEditingId(cliente.id);
    setFormData({
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      tipo_documento: cliente.tipo_documento,
      documento: cliente.documento,
      telefono: cliente.telefono || ''
    });
    setShowModal(true);
  };

  const handleToggleEstado = async (cliente) => {
    const estadoActual = getEstadoCliente(cliente);
    const nuevoEstado = estadoActual === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    const accion = nuevoEstado === 'ACTIVO' ? 'activar' : 'desactivar';

    if (!window.confirm(`¿Estás seguro de que quieres ${accion} al cliente "${cliente.nombre} ${cliente.apellido}"?`)) {
      return;
    }

    setChangingState(cliente.id);
    try {
      await api.cambiarEstadoCliente(cliente.id, nuevoEstado.toLowerCase());
      success(`Cliente ${accion}do exitosamente!`);
      fetchClientes();
    } catch (err) {
      logger.error(`Error al ${accion} cliente`, err.message);
      showError(err.message || `Error al ${accion} cliente`);
    } finally {
      setChangingState(null);
    }
  };

  const handleDelete = async (cliente) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar permanentemente al cliente "${cliente.nombre} ${cliente.apellido}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    setChangingState(cliente.id);
    try {
      await api.eliminarCliente(cliente.id);
      success('Cliente eliminado exitosamente!');
      fetchClientes();
    } catch (err) {
      logger.error('Error eliminando cliente', err.message);
      showError(err.message || 'Error al eliminar cliente');
    } finally {
      setChangingState(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre.trim() || !formData.apellido.trim() || !formData.documento.trim()) {
      warning('Completa: Nombre, Apellido y Documento');
      return;
    }

    setSaving(true);
    try {
      const dataToSend = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        tipo_documento: formData.tipo_documento,
        documento: formData.documento,
        telefono: formData.telefono || undefined
      };

      if (editingId) {
        await api.actualizarCliente(editingId, dataToSend);
        success('Cliente actualizado!');
      } else {
        await api.crearCliente(dataToSend);
        success('Cliente creado!');
      }

      setFormData({
        nombre: '',
        apellido: '',
        tipo_documento: 'CC',
        documento: '',
        telefono: ''
      });
      setEditingId(null);
      setShowModal(false);
      fetchClientes();
    } catch (err) {
      logger.error('Error', err.message);
      showError(err.message || 'Error al guardar cliente');
    }
    setSaving(false);
  };

  const handleBuscar = async (e) => {
    if (search.trim().length > 0) {
      setLoading(true);
      try {
        const res = await api.getClientes();
        const filtered = res.data?.filter(c =>
          c.nombre.toLowerCase().includes(search.toLowerCase()) ||
          c.apellido.toLowerCase().includes(search.toLowerCase()) ||
          c.documento.includes(search)
        ) || [];
        setClientes(filtered);
      } catch (err) {
        logger.error('Error en búsqueda', err.message);
      }
      setLoading(false);
    } else {
      fetchClientes();
    }
  };

  const handleOpenModal = () => {
    setShowModal(true);
    setEditingId(null);
    setFormData({
      nombre: '',
      apellido: '',
      tipo_documento: 'CC',
      documento: '',
      telefono: ''
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      nombre: '',
      apellido: '',
      tipo_documento: 'CC',
      documento: '',
      telefono: ''
    });
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

  return (
    <MainLayout title="Gestión de Clientes">
      {alert && <AlertSimple message={alert.message} type={alert.type} />}

      <div className="page-header">
        <div>
          <h4 style={{ margin: 0 }}>Listado de Clientes</h4>
          <p style={{ color: '#6B7280', margin: '0.5rem 0 0 0' }}>
            Total: {clientes.length} cliente{clientes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={handleOpenModal}>
          <i className="bi bi-plus-circle"></i> Nuevo Cliente
        </Button>
      </div>

      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.8rem' }}>
        <Input
          placeholder="Buscar por nombre, apellido o documento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <Button onClick={handleBuscar} variant="secondary">Buscar</Button>
        {search && (
          <Button onClick={() => { setSearch(''); fetchClientes(); }} variant="secondary">Limpiar</Button>
        )}
      </div>

      {/* Modal para el formulario */}
      <Modal show={showModal} onClose={handleCloseModal}>
        <h4 style={{ marginBottom: '1.5rem', fontWeight: '700', fontSize: '1.2rem', color: '#1F2937' }}>
          {editingId ? 'Editar Cliente' : 'Crear Cliente'}
        </h4>
        <form onSubmit={handleSubmit} className="form-layout">
          <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <Input
              label="Nombre *"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Nombre"
              required
              autoFocus
            />
            <Input
              label="Apellido *"
              value={formData.apellido}
              onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
              placeholder="Apellido"
              required
            />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <Select
              label="Tipo Documento *"
              value={formData.tipo_documento}
              onChange={(e) => setFormData({ ...formData, tipo_documento: e.target.value })}
              options={[
                { id: 'CC', nombre: 'Cédula de Ciudadanía' },
                { id: 'TI', nombre: 'Tarjeta de Identidad' },
                { id: 'CE', nombre: 'Cédula de Extranjería' }
              ]}
              required
            />
            <Input
              label="Documento *"
              value={formData.documento}
              onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
              placeholder="Número de documento"
              required
            />
          </div>

          <Input
            label="Telefono"
            value={formData.telefono}
            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
            placeholder="3001234567"
          />

          <div className="form-actions" style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.8rem' }}>
            <Button variant="primary" disabled={saving}>
              {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
            </Button>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      <div className="table-container">
        {loading ? (
          <Loading />
        ) : clientes.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Documento</th>
                <th>Tipo</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Fecha Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map(cliente => {
                const estado = getEstadoCliente(cliente);
                const estadoInfo = getColorEstado(estado);
                const fechaRegistro = formatFecha(cliente.created_at || cliente.fecha_creacion || cliente.fechaRegistro);

                return (
                  <tr key={cliente.id}>
                    <td>
                      <strong>{cliente.nombre} {cliente.apellido}</strong>
                    </td>
                    <td>{cliente.documento}</td>
                    <td>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#666' }}>
                        {cliente.tipo_documento}
                      </span>
                    </td>
                    <td>{cliente.telefono || '-'}</td>
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
                    <td style={{ fontWeight: '500', color: '#374151', fontSize: '0.85rem' }}>
                      {fechaRegistro}
                    </td>
                    <td>
                      <div className="table-actions" style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEdit(cliente)}
                          title="Editar cliente"
                          disabled={changingState === cliente.id}
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
                          onClick={() => handleDelete(cliente)}
                          title="Eliminar cliente"
                          disabled={changingState === cliente.id}
                          style={{
                            padding: '0.2rem 0.5rem',
                            fontSize: '0.75rem',
                            minWidth: 'auto'
                          }}
                        >
                          {changingState === cliente.id ? (
                            <i className="bi bi-arrow-repeat"></i>
                          ) : (
                            <i className="bi bi-trash"></i>
                          )}
                        </Button>
                        <Button
                          variant={estado === 'ACTIVO' ? 'warning' : 'success'}
                          size="sm"
                          onClick={() => handleToggleEstado(cliente)}
                          title={estado === 'ACTIVO' ? 'Desactivar cliente' : 'Activar cliente'}
                          disabled={changingState === cliente.id}
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <Empty message={
            search
              ? "No se encontraron clientes que coincidan con la búsqueda"
              : "No hay clientes registrados"
          } />
        )}
      </div>
    </MainLayout>
  );
}