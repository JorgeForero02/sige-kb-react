import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, Button, Input, Loading, Empty, Select } from '../components/common/Components';
import { AlertSimple } from '../components/common/AlertSimple';
import { useAlert } from '../hooks/useAlert';
import { useCategorias } from '../context/CategoriasContext';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { logger } from '../services/logger';
import '../pages/Pages.css';
import { usePermissions } from '../hooks/usePermissions';

// Componente Modal para formularios
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

export function CategoriaDetailPage() {
  const { categoriaNombre } = useParams();
  const navigate = useNavigate();
  const { categorias } = useCategorias();
  const { user } = useAuth();
  const { can } = usePermissions();
  const [activeTab, setActiveTab] = useState('servicios');
  const [editingServicio, setEditingServicio] = useState(null);
  const [showEditServicioModal, setShowEditServicioModal] = useState(false);
  const [deletingServicio, setDeletingServicio] = useState(null);
  const [editingCliente, setEditingCliente] = useState(null);
  const [showEditClienteModal, setShowEditClienteModal] = useState(false);
  const [deletingCliente, setDeletingCliente] = useState(null);
  const [changingClienteState, setChangingClienteState] = useState(null);

  // Estados para Servicios
  const [servicios, setServicios] = useState([]);
  const [showServicioModal, setShowServicioModal] = useState(false);
  const [servicioForm, setServicioForm] = useState({
    nombre: '',
    descripcion: '',
    duracion: '',
    precio: '',
    porcentaje: ''
  });

  // Estados para Clientes
  const [clientes, setClientes] = useState([]);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [clienteForm, setClienteForm] = useState({
    nombre: '',
    apellido: '',
    tipo_documento: 'CC',
    documento: '',
    telefono: ''
  });

  // Estados para Agenda
  const [citas, setCitas] = useState([]);
  const [showCitaModal, setShowCitaModal] = useState(false);
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [citaForm, setCitaForm] = useState({
    hora_inicio: '',
    duracion: '30',
    encargado: '',
    cliente: '',
    servicio: ''
  });
  const [empleados, setEmpleados] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchServicio, setSearchServicio] = useState('');
  const [searchCliente, setSearchCliente] = useState('');
  const { alert, success, error: showError, warning } = useAlert();

  const decodedNombre = decodeURIComponent(categoriaNombre || '');
  const categoria = categorias.find(cat => cat.nombre === decodedNombre);
  const isEmpleado = user?.rolInfo?.nombre === 'Empleado';
  const isGerente = user?.rolInfo?.nombre === 'Gerente';

  useEffect(() => {
    if (categoria) {
      if (activeTab === 'servicios') {
        loadServicios();
      }
      else if (activeTab === 'clientes') {
        loadClientes();
      }
      else if (categoria && activeTab === 'agenda') {
        loadCitas();
      }
    }
  }, [fecha, categoria, activeTab]);

  const loadServicios = async () => {
    if (!categoria) return;

    setLoading(true);
    try {
      const response = await api.getServicios();
      const allServicios = response.data || [];

      let serviciosCategoria = allServicios.filter(servicio =>
        servicio.categoria_id === categoria.id ||
        servicio.categoriaId === categoria.id ||
        servicio.categoria === categoria.id
      );

      if (isEmpleado) {
        serviciosCategoria = serviciosCategoria.filter(servicio =>
          getEstadoServicio(servicio) === 'ACTIVO'
        );
      }

      setServicios(serviciosCategoria);

    } catch (error) {
      console.error('Error cargando servicios:', error);
      showError('Error al cargar servicios');
    }
    setLoading(false);
  };

  const loadClientes = async () => {
    if (!categoria) return;

    setLoading(true);
    try {
      const clientesRes = await api.getClientes();
      setClientes(clientesRes.data || []);
    } catch (error) {
      console.error('Error cargando clientes:', error);
      showError('Error al cargar clientes');
    }
    setLoading(false);
  };

  const loadCitas = async () => {
    if (!categoria) return;

    setLoading(true);
    try {
      const [citasRes, empleadosRes, serviciosRes] = await Promise.all([
        api.getCitas(`?fecha_inicio=${fecha}&fecha_fin=${fecha}`),
        api.getUsuarios(),
        api.getServicios()
      ]);

      const todasLasCitas = citasRes.data || [];
      const todosLosServicios = serviciosRes.data || [];

      const serviciosDeCategoria = todosLosServicios.filter(servicio =>
        servicio.categoria_id === categoria.id ||
        servicio.categoriaId === categoria.id ||
        servicio.categoria === categoria.id
      );

      const serviciosIdsDeCategoria = serviciosDeCategoria.map(s => s.id);

      let citasFiltradas = todasLasCitas.filter(cita => {
        const servicioId = cita.servicio;
        return serviciosIdsDeCategoria.includes(servicioId);
      });

      if (isEmpleado) {
        citasFiltradas = citasFiltradas.filter(c => c.encargado === user.id);
      }

      setCitas(citasFiltradas);
      setEmpleados(empleadosRes.data || []);

    } catch (error) {
      console.error('Error cargando citas:', error);
      showError('Error al cargar citas');
    }
    setLoading(false);
  };

  const handleCreateServicio = async (e) => {
    e.preventDefault();

    if (!servicioForm.nombre.trim() || !servicioForm.duracion || !servicioForm.precio) {
      warning('Completa todos los campos requeridos');
      return;
    }

    // Verificar que la duración sea múltiplo de 15
    const duracion = parseInt(servicioForm.duracion);
    if (duracion % 15 !== 0) {
      warning('La duración debe ser múltiplo de 15 minutos (15, 30, 45, 60, 75, 90, etc.)');
      return;
    }

    setSaving(true);
    try {
      const servicioData = {
        nombre: servicioForm.nombre.trim(),
        descripcion: servicioForm.descripcion.trim(),
        duracion: duracion,
        precio: parseFloat(servicioForm.precio),
        categoria: categoria.id,
        porcentaje: servicioForm.porcentaje ? parseFloat(servicioForm.porcentaje) : 0
      };

      await api.crearServicio(servicioData);
      success('Servicio creado exitosamente!');

      setServicioForm({ nombre: '', descripcion: '', duracion: '30', precio: '', porcentaje: '' });
      setShowServicioModal(false);
      await loadServicios();

    } catch (error) {
      // Mostrar error más específico
      if (error.message.includes('duracion') || error.message.includes('duraci')) {
        showError('Error en la duración: debe ser múltiplo de 15 minutos');
      } else if (error.message.includes('precio')) {
        showError('Error en el precio: debe ser un número válido');
      } else {
        showError(error.message || 'Error al crear servicio');
      }
    }
    setSaving(false);
  };

  const handleCreateCliente = async (e) => {
    e.preventDefault();

    if (!clienteForm.nombre.trim() || !clienteForm.apellido.trim() || !clienteForm.documento.trim()) {
      warning('Completa todos los campos requeridos');
      return;
    }

    setSaving(true);
    try {
      await api.crearCliente(clienteForm);
      success('Cliente creado exitosamente!');

      setClienteForm({
        nombre: '',
        apellido: '',
        tipo_documento: 'CC',
        documento: '',
        telefono: ''
      });

      setShowClienteModal(false);
      await loadClientes();

    } catch (error) {
      console.error('Error creando cliente:', error);
      showError(error.response?.data?.message || error.message || 'Error al crear cliente');
    }
    setSaving(false);
  };

  const handleEditCliente = (cliente) => {
    setEditingCliente(cliente);
    setClienteForm({
      nombre: cliente.nombre || '',
      apellido: cliente.apellido || '',
      tipo_documento: cliente.tipo_documento || 'CC',
      documento: cliente.documento || '',
      telefono: cliente.telefono || ''
    });
    setShowEditClienteModal(true);
  };

  // Función para actualizar cliente
  const handleUpdateCliente = async (e) => {
    e.preventDefault();

    if (!editingCliente || !clienteForm.nombre.trim() || !clienteForm.apellido.trim() || !clienteForm.documento.trim()) {
      warning('Completa todos los campos requeridos');
      return;
    }

    setSaving(true);
    try {
      const clienteData = {
        nombre: clienteForm.nombre.trim(),
        apellido: clienteForm.apellido.trim(),
        tipo_documento: clienteForm.tipo_documento,
        documento: clienteForm.documento.trim(),
        telefono: clienteForm.telefono || ''
      };

      await api.actualizarCliente(editingCliente.id, clienteData);
      success('Cliente actualizado exitosamente!');

      setClienteForm({
        nombre: '',
        apellido: '',
        tipo_documento: 'CC',
        documento: '',
        telefono: ''
      });
      setEditingCliente(null);
      setShowEditClienteModal(false);
      await loadClientes();

    } catch (error) {
      console.error('Error actualizando cliente:', error);
      showError(error.message || 'Error al actualizar cliente');
    }
    setSaving(false);
  };

  // Función para eliminar cliente
  const handleDeleteCliente = async (cliente) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar al cliente "${cliente.nombre} ${cliente.apellido}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      setDeletingCliente(cliente.id);
      await api.eliminarCliente(cliente.id);
      success('Cliente eliminado exitosamente!');
      await loadClientes();
    } catch (err) {
      console.error('Error eliminando cliente:', err);
      showError(err.message || 'Error al eliminar cliente');
    } finally {
      setDeletingCliente(null);
    }
  };

  // Función para cambiar estado del cliente
  const handleToggleEstadoCliente = async (cliente) => {
    const estadoActual = getEstadoCliente(cliente);
    const nuevoEstado = estadoActual === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    const accion = nuevoEstado === 'ACTIVO' ? 'activar' : 'desactivar';

    if (!window.confirm(`¿Estás seguro de que quieres ${accion} al cliente "${cliente.nombre} ${cliente.apellido}"?`)) {
      return;
    }

    setChangingClienteState(cliente.id);
    try {
      await api.cambiarEstadoCliente(cliente.id, nuevoEstado.toLowerCase());
      success(`Cliente ${accion}do exitosamente!`);
      await loadClientes();
    } catch (err) {
      console.error(`Error al ${accion} cliente`, err);
      showError(err.message || `Error al ${accion} cliente`);
    } finally {
      setChangingClienteState(null);
    }
  };

  // Función para cancelar edición de cliente
  const handleCancelEditCliente = () => {
    setEditingCliente(null);
    setShowEditClienteModal(false);
    setClienteForm({
      nombre: '',
      apellido: '',
      tipo_documento: 'CC',
      documento: '',
      telefono: ''
    });
  };

  const handleCreateCita = async (e) => {
    e.preventDefault();
    if (!citaForm.hora_inicio || !citaForm.cliente || !citaForm.encargado || !citaForm.servicio) {
      warning('Completa todos los campos requeridos');
      return;
    }

    setSaving(true);
    try {
      const citaData = {
        fecha: fecha,
        hora_inicio: citaForm.hora_inicio,
        duracion: parseInt(citaForm.duracion),
        encargado: parseInt(citaForm.encargado),
        cliente: parseInt(citaForm.cliente),
        servicio: parseInt(citaForm.servicio)
      };

      await api.crearCita(citaData);
      success('Cita creada exitosamente!');
      setCitaForm({ hora_inicio: '', duracion: '30', encargado: '', cliente: '', servicio: '' });
      setShowCitaModal(false);

      setTimeout(() => {
        loadCitas();
      }, 500);

    } catch (err) {
      console.error('Error creando cita:', err);
      showError(err.message || 'Error al crear cita');
    }
    setSaving(false);
  };

  const handleCambiarEstadoCita = async (citaId, nuevoEstado) => {
    try {
      await api.cambiarEstadoCita(citaId, nuevoEstado);
      success(`Cita ${nuevoEstado}`);
      await loadCitas();
    } catch (err) {
      console.error('Error cambiando estado:', err);
      showError(err.message || 'Error al cambiar estado');
    }
  };

  const handleEditServicio = (servicio) => {
    setEditingServicio(servicio);
    setServicioForm({
      nombre: servicio.nombre || '',
      descripcion: servicio.descripcion || '',
      duracion: servicio.duracion?.toString() || '30',
      precio: servicio.precio?.toString() || '',
      porcentaje: servicio.porcentaje?.toString() || ''
    });
    setShowEditServicioModal(true);
  };

  const handleUpdateServicio = async (e) => {
    e.preventDefault();

    if (!editingServicio || !servicioForm.nombre.trim() || !servicioForm.duracion || !servicioForm.precio) {
      warning('Completa todos los campos requeridos');
      return;
    }

    // Verificar que la duración sea múltiplo de 15
    const duracion = parseInt(servicioForm.duracion);
    if (duracion % 15 !== 0) {
      warning('La duración debe ser múltiplo de 15 minutos (15, 30, 45, 60, etc.)');
      return;
    }

    setSaving(true);
    try {
      const servicioData = {
        nombre: servicioForm.nombre.trim(),
        descripcion: servicioForm.descripcion.trim(),
        duracion: duracion,
        precio: parseFloat(servicioForm.precio),
        categoria: categoria.id,
        porcentaje: servicioForm.porcentaje ? parseFloat(servicioForm.porcentaje) : 0
      };

      await api.actualizarServicio(editingServicio.id, servicioData);
      success('Servicio actualizado exitosamente!');

      setServicioForm({ nombre: '', descripcion: '', duracion: '30', precio: '', porcentaje: '' });
      setEditingServicio(null);
      setShowEditServicioModal(false);
      await loadServicios();

    } catch (error) {
      console.error('Error actualizando servicio:', error);
      showError(error.message || 'Error al actualizar servicio');
    }
    setSaving(false);
  };

  const handleDeleteServicio = async (servicio) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar el servicio "${servicio.nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      setDeletingServicio(servicio.id);
      await api.eliminarServicio(servicio.id);
      success('Servicio eliminado exitosamente!');
      await loadServicios();
    } catch (err) {
      console.error('Error eliminando servicio:', err);
      showError(err.message || 'Error al eliminar servicio');
    } finally {
      setDeletingServicio(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingServicio(null);
    setShowEditServicioModal(false);
    setServicioForm({ nombre: '', descripcion: '', duracion: '30', precio: '', porcentaje: '' });
  };

  const handleToggleEstadoServicio = async (servicio) => {
    const estadoActual = String(servicio.estado || 'activo').toUpperCase();
    const nuevoEstado = estadoActual === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    const accion = nuevoEstado === 'ACTIVO' ? 'activar' : 'desactivar';

    if (!window.confirm(`¿Estás seguro de que quieres ${accion} el servicio "${servicio.nombre}"?`)) {
      return;
    }

    try {
      await api.actualizarServicio(servicio.id, { estado: nuevoEstado.toLowerCase() });
      success(`Servicio ${accion}do exitosamente!`);
      loadServicios();
    } catch (err) {
      console.error(`Error al ${accion} servicio`, err);
      showError(err.message || `Error al ${accion} servicio`);
    }
  };

  const handleVerTarifas = (servicio) => {
    warning('Funcionalidad de tarifas en desarrollo');
  };

  const formatFecha = (fechaString) => {
    if (!fechaString) return new Date().toLocaleDateString('es-ES');

    try {
      const fecha = new Date(fechaString);
      if (isNaN(fecha.getTime())) return new Date().toLocaleDateString('es-ES');
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

  if (!categoria) {
    return (
      <MainLayout title="Categoría No Encontrada">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h3>Categoría no encontrada</h3>
          <p>La categoría "{decodedNombre}" no existe.</p>
          <Button variant="primary" onClick={() => navigate('/categorias')}>
            Volver a Categorías
          </Button>
        </div>
      </MainLayout>
    );
  }

  const serviciosFiltrados = servicios.filter(servicio =>
    servicio.nombre.toLowerCase().includes(searchServicio.toLowerCase())
  );

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchCliente.toLowerCase()) ||
    cliente.documento.includes(searchCliente)
  );

  return (
    <MainLayout title={`${categoria.nombre}`}>
      {alert && <AlertSimple message={alert.message} type={alert.type} />}

      {/* Pestañas */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{
          display: 'flex',
          gap: '0',
          background: '#f7cedbff',
          padding: '0.25rem',
          borderRadius: '23px',
          width: '110%',
          height: '50px',
        }}>
          <button
            style={activeTab === 'servicios' ? {
              padding: '0.5rem 1.5rem',
              background: '#f74780',
              borderRadius: '23px',
              fontWeight: '600',
              color: '#eef0f3ff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flex: 1,
              border: 'none'
            } : {
              padding: '0.5rem 1.5rem',
              background: 'transparent',
              border: 'none',
              fontWeight: '600',
              color: '#0f0f0fff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flex: 1
            }}
            onClick={() => setActiveTab('servicios')}
          >
            Servicios
          </button>
          <button
            style={activeTab === 'clientes' ? {
              padding: '0.5rem 1.5rem',
              background: '#f74780',
              borderRadius: '23px',
              fontWeight: '600',
              color: '#eef0f3ff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flex: 1,
              border: 'none'
            } : {
              padding: '0.5rem 1.5rem',
              background: 'transparent',
              border: 'none',
              fontWeight: '600',
              color: '#0f0f0fff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flex: 1
            }}
            onClick={() => setActiveTab('clientes')}
          >
            Clientes
          </button>
          <button
            style={activeTab === 'agenda' ? {
              padding: '0.5rem 1.5rem',
              background: '#f74780',
              borderRadius: '23px',
              fontWeight: '600',
              color: '#eef0f3ff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flex: 1,
              border: 'none'
            } : {
              padding: '0.5rem 1.5rem',
              background: 'transparent',
              border: 'none',
              fontWeight: '600',
              color: '#0f0f0fff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flex: 1
            }}
            onClick={() => setActiveTab('agenda')}
          >
            Agenda
          </button>
        </div>
      </div>

      {/* Contenido de las pestañas */}
      <div style={{ marginTop: '1rem' }}>

        {/*Pestaña de servicios*/}
        {activeTab === 'servicios' && (
          <div>
            <div className="categorias-main-title">
              <h4 style={{ margin: 0 }}>Lista de servicios</h4>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {/* SOLO GERENTE PUEDE CREAR SERVICIOS */}
                {can('CREATE_SERVICIO') && (
                  <div className="categorias-main-title">
                    <Button onClick={() => setShowServicioModal(true)}>
                      + Nuevo Servicio
                    </Button>
                  </div>
                )}
              </div>
              <Input
                placeholder="Buscar por servicio..."
                value={searchServicio}
                onChange={(e) => setSearchServicio(e.target.value)}
                style={{ width: '250px' }}
              />
            </div>

            <Modal show={showEditServicioModal} onClose={handleCancelEdit}>
              <h4 style={{ marginBottom: '1.5rem', fontWeight: '700', color: '#333' }}>
                Editar Servicio: {editingServicio?.nombre}
              </h4>
              <form onSubmit={handleUpdateServicio} className="form-layout">
                <Input
                  label="Nombre *"
                  value={servicioForm.nombre}
                  onChange={(e) => setServicioForm({ ...servicioForm, nombre: e.target.value })}
                  placeholder="Nombre del servicio"
                  required
                  autoFocus
                />
                <Input
                  label="Descripción"
                  value={servicioForm.descripcion}
                  onChange={(e) => setServicioForm({ ...servicioForm, descripcion: e.target.value })}
                  placeholder="Descripción del servicio"
                />
                <Input
                  label="Duración (minutos) *"
                  type="number"
                  value={servicioForm.duracion}
                  onChange={(e) => setServicioForm({ ...servicioForm, duracion: e.target.value })}
                  placeholder="30, 45, 60..."
                  min="15"
                  step="15"
                  required
                />
                <Input
                  label="Precio *"
                  type="number"
                  value={servicioForm.precio}
                  onChange={(e) => setServicioForm({ ...servicioForm, precio: e.target.value })}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
                <Input
                  label="Porcentaje comisión"
                  type="number"
                  value={servicioForm.porcentaje}
                  onChange={(e) => setServicioForm({ ...servicioForm, porcentaje: e.target.value })}
                  placeholder="0"
                  min="0"
                  max="100"
                />
                <div className="form-actions">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={saving}
                  >
                    {saving ? 'Guardando...' : 'Actualizar Servicio'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCancelEdit}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </Modal>

            {/* MODAL SOLO PARA QUIEN TIENE PERMISO CREATE_SERVICIO */}
            {can('CREATE_SERVICIO') && (
              <Modal show={showServicioModal} onClose={() => setShowServicioModal(false)}>
                <h4 style={{ marginBottom: '1.5rem', fontWeight: '700', color: '#333' }}>
                  Crear Servicio en {categoria.nombre}
                </h4>
                <form onSubmit={handleCreateServicio} className="form-layout">
                  <Input
                    label="Nombre *"
                    value={servicioForm.nombre}
                    onChange={(e) => setServicioForm({ ...servicioForm, nombre: e.target.value })}
                    placeholder="Nombre del servicio"
                    required
                    autoFocus
                  />
                  <Input
                    label="Descripción"
                    value={servicioForm.descripcion}
                    onChange={(e) => setServicioForm({ ...servicioForm, descripcion: e.target.value })}
                    placeholder="Descripción del servicio"
                  />
                  <Input
                    label="Duración (minutos) *"
                    type="number"
                    value={servicioForm.duracion}
                    onChange={(e) => setServicioForm({ ...servicioForm, duracion: e.target.value })}
                    placeholder="30, 45, 60..."
                    min="15"
                    step="15"
                    required
                  />
                  <Input
                    label="Precio *"
                    type="number"
                    value={servicioForm.precio}
                    onChange={(e) => setServicioForm({ ...servicioForm, precio: e.target.value })}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                  <Input
                    label="Porcentaje comisión"
                    type="number"
                    value={servicioForm.porcentaje}
                    onChange={(e) => setServicioForm({ ...servicioForm, porcentaje: e.target.value })}
                    placeholder="0"
                    min="0"
                    max="100"
                  />
                  <div className="form-actions">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={saving}
                    >
                      {saving ? 'Guardando...' : 'Crear Servicio'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowServicioModal(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </Modal>
            )}

            <div className="table-container" style={{ marginTop: '1.5rem' }}>
              {loading ? (
                <Loading />
              ) : serviciosFiltrados.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Servicio</th>
                      <th>Estado</th>
                      <th>Fecha de Creación</th>
                      <th>Descripción</th>
                      <th>Duración</th>
                      {/* SOLO QUIEN TIENE PERMISO EDIT_SERVICIO VE ACCIONES */}
                      {can('EDIT_SERVICIO') && <th>Acciones</th>}
                      {can('EDIT_SERVICIO') && <th>Tarifas</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {serviciosFiltrados.map(servicio => {
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
                          {/* ACCIONES SOLO PARA QUIEN TIENE PERMISO EDIT_SERVICIO */}
                          {can('EDIT_SERVICIO') && (
                            <>
                              <td>
                                <div className="table-actions" style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleEditServicio(servicio)}
                                    title="Editar servicio"
                                    disabled={deletingServicio === servicio.id}
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
                                    onClick={() => handleDeleteServicio(servicio)}
                                    title="Eliminar servicio"
                                    disabled={deletingServicio === servicio.id}
                                    style={{
                                      padding: '0.2rem 0.5rem',
                                      fontSize: '0.75rem',
                                      minWidth: 'auto'
                                    }}
                                  >
                                    {deletingServicio === servicio.id ? (
                                      <i className="bi bi-arrow-repeat"></i>
                                    ) : (
                                      <i className="bi bi-trash"></i>
                                    )}
                                  </Button>
                                </div>
                              </td>
                              <td>
                                <Button
                                  variant="link"
                                  size="sm"
                                  onClick={() => handleVerTarifas(servicio)}
                                  style={{
                                    color: '#F74780',
                                    textDecoration: 'none',
                                    padding: '0.2rem 0.4rem',
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  <i className="bi bi-currency-dollar"></i>
                                </Button>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <Empty message={`No hay servicios en ${categoria.nombre}`} />
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA CLIENTES */}
        {activeTab === 'clientes' && (
          <div>
            <div className="categorias-main-title">
              <h4 style={{ margin: 0 }}>Lista de Clientes</h4>
              <Button onClick={() => setShowClienteModal(true)}>
                + Nuevo Cliente
              </Button>
            </div>

            {/* Modal para EDITAR cliente */}
            <Modal show={showEditClienteModal} onClose={handleCancelEditCliente}>
              <h4 style={{ marginBottom: '1.5rem', fontWeight: '700', color: '#333' }}>
                Editar Cliente: {editingCliente?.nombre} {editingCliente?.apellido}
              </h4>
              <form onSubmit={handleUpdateCliente} className="form-layout">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <Input
                    label="Nombre *"
                    value={clienteForm.nombre}
                    onChange={(e) => setClienteForm({ ...clienteForm, nombre: e.target.value })}
                    placeholder="Nombre"
                    required
                    autoFocus
                  />
                  <Input
                    label="Apellido *"
                    value={clienteForm.apellido}
                    onChange={(e) => setClienteForm({ ...clienteForm, apellido: e.target.value })}
                    placeholder="Apellido"
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <Select
                    label="Tipo Documento *"
                    value={clienteForm.tipo_documento}
                    onChange={(e) => setClienteForm({ ...clienteForm, tipo_documento: e.target.value })}
                    options={[
                      { id: 'CC', nombre: 'Cédula de Ciudadanía' },
                      { id: 'TI', nombre: 'Tarjeta de Identidad' },
                      { id: 'CE', nombre: 'Cédula de Extranjería' }
                    ]}
                    required
                  />
                  <Input
                    label="Documento *"
                    value={clienteForm.documento}
                    onChange={(e) => setClienteForm({ ...clienteForm, documento: e.target.value })}
                    placeholder="Número de documento"
                    required
                  />
                </div>
                <Input
                  label="Teléfono"
                  value={clienteForm.telefono}
                  onChange={(e) => setClienteForm({ ...clienteForm, telefono: e.target.value })}
                  placeholder="3001234567"
                />
                <div className="form-actions">
                  <Button variant="primary" disabled={saving}>
                    {saving ? 'Guardando...' : 'Actualizar Cliente'}
                  </Button>
                  <Button variant="secondary" onClick={handleCancelEditCliente}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </Modal>

            {/* Modal para CREAR cliente (existente) */}
            <Modal show={showClienteModal} onClose={() => setShowClienteModal(false)}>
              <h4 style={{ marginBottom: '1.5rem', fontWeight: '700', color: '#333' }}>
                Crear Cliente
              </h4>
              <form onSubmit={handleCreateCliente} className="form-layout">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <Input
                    label="Nombre *"
                    value={clienteForm.nombre}
                    onChange={(e) => setClienteForm({ ...clienteForm, nombre: e.target.value })}
                    placeholder="Nombre"
                    required
                    autoFocus
                  />
                  <Input
                    label="Apellido *"
                    value={clienteForm.apellido}
                    onChange={(e) => setClienteForm({ ...clienteForm, apellido: e.target.value })}
                    placeholder="Apellido"
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <Select
                    label="Tipo Documento *"
                    value={clienteForm.tipo_documento}
                    onChange={(e) => setClienteForm({ ...clienteForm, tipo_documento: e.target.value })}
                    options={[
                      { id: 'CC', nombre: 'Cédula de Ciudadanía' },
                      { id: 'TI', nombre: 'Tarjeta de Identidad' },
                      { id: 'CE', nombre: 'Cédula de Extranjería' }
                    ]}
                    required
                  />
                  <Input
                    label="Documento *"
                    value={clienteForm.documento}
                    onChange={(e) => setClienteForm({ ...clienteForm, documento: e.target.value })}
                    placeholder="Número de documento"
                    required
                  />
                </div>
                <Input
                  label="Teléfono"
                  value={clienteForm.telefono}
                  onChange={(e) => setClienteForm({ ...clienteForm, telefono: e.target.value })}
                  placeholder="3001234567"
                />
                <div className="form-actions">
                  <Button variant="primary" disabled={saving}>
                    {saving ? 'Guardando...' : 'Crear Cliente'}
                  </Button>
                  <Button variant="secondary" onClick={() => setShowClienteModal(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </Modal>

            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.8rem' }}>
              <Input
                placeholder="Buscar por nombre..."
                value={searchCliente}
                onChange={(e) => setSearchCliente(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>

            <div className="table-container" style={{ marginTop: '1.5rem' }}>
              {loading ? (
                <Loading />
              ) : clientesFiltrados.length > 0 ? (
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
                    {clientesFiltrados.map(cliente => {
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
                                onClick={() => handleEditCliente(cliente)}
                                title="Editar cliente"
                                disabled={deletingCliente === cliente.id || changingClienteState === cliente.id}
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
                                onClick={() => handleDeleteCliente(cliente)}
                                title="Eliminar cliente"
                                disabled={deletingCliente === cliente.id || changingClienteState === cliente.id}
                                style={{
                                  padding: '0.2rem 0.5rem',
                                  fontSize: '0.75rem',
                                  minWidth: 'auto'
                                }}
                              >
                                {deletingCliente === cliente.id ? (
                                  <i className="bi bi-arrow-repeat"></i>
                                ) : (
                                  <i className="bi bi-trash"></i>
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <Empty message="No hay clientes registrados" />
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA AGENDA */}
        {activeTab === 'agenda' && (
          <div>
            <div className="categorias-main-title">
              <h4 style={{ margin: 0 }}>Agenda</h4>
              <div className="categorias-main-title">
                <Button onClick={() => setShowCitaModal(true)}>
                  + Nueva Cita
                </Button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>

            <Modal show={showCitaModal} onClose={() => setShowCitaModal(false)}>
              <h4 style={{ marginBottom: '1.5rem', fontWeight: '700', color: '#333' }}>
                Agendar Cita
              </h4>
              <form onSubmit={handleCreateCita} className="form-layout">
                <Input
                  label="Hora *"
                  type="time"
                  value={citaForm.hora_inicio}
                  onChange={(e) => setCitaForm({ ...citaForm, hora_inicio: e.target.value })}
                  required
                  autoFocus
                />
                <Select
                  label="Servicio *"
                  value={citaForm.servicio}
                  onChange={(e) => {
                    const servicioId = e.target.value;
                    setCitaForm({ ...citaForm, servicio: servicioId });
                    if (servicioId) {
                      const servicioSeleccionado = servicios.find(s => s.id === parseInt(servicioId));
                      if (servicioSeleccionado?.duracion) {
                        setCitaForm(prev => ({
                          ...prev,
                          duracion: servicioSeleccionado.duracion.toString()
                        }));
                      }
                    }
                  }}
                  options={servicios}
                  required
                />
                <Input
                  label="Duración (minutos) *"
                  type="number"
                  value={citaForm.duracion}
                  onChange={(e) => setCitaForm({ ...citaForm, duracion: e.target.value })}
                  min="15"
                  step="15"
                  required
                  disabled={!citaForm.servicio}
                />
                <Select
                  label="Cliente *"
                  value={citaForm.cliente}
                  onChange={(e) => setCitaForm({ ...citaForm, cliente: e.target.value })}
                  options={clientes}
                  required
                />
                <Select
                  label="Empleado *"
                  value={citaForm.encargado}
                  onChange={(e) => setCitaForm({ ...citaForm, encargado: e.target.value })}
                  options={empleados}
                  required
                  disabled={isEmpleado}
                />
                <div className="form-actions">
                  <Button variant="primary" disabled={saving}>
                    {saving ? 'Creando...' : 'Crear Cita'}
                  </Button>
                  <Button variant="secondary" onClick={() => setShowCitaModal(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </Modal>

            <div className="citas-grid" style={{ marginTop: '1.5rem' }}>
              {loading ? (
                <Loading />
              ) : citas.length > 0 ? (
                citas.map(cita => (
                  <Card key={cita.id} className="cita-card">
                    <div className="cita-card-header">
                      <div>
                        <div className="cita-hora">
                          <i className="bi bi-clock-history"></i> {cita.hora_inicio} - {cita.hora_fin}
                        </div>
                        <h5 className="cita-cliente">{cita.clienteInfo?.nombre} {cita.clienteInfo?.apellido}</h5>
                        <p className="cita-empleado">
                          <i className="bi bi-person-badge"></i> {cita.encargadoInfo?.nombre}
                        </p>
                      </div>
                      <span className={`badge badge-${cita.estado || 'pendiente'}`}>
                        {cita.estado || 'Pendiente'}
                      </span>
                    </div>
                    <div className="cita-card-body">
                      <p><i className="bi bi-briefcase"></i> {cita.servicioInfo?.nombre || 'Sin servicio'}</p>
                      <p><i className="bi bi-telephone"></i> {cita.clienteInfo?.telefono || 'Sin teléfono'}</p>
                      <p><i className="bi bi-hourglass-split"></i> {cita.duracion} minutos</p>
                    </div>
                    {cita.estado !== 'completada' && cita.estado !== 'cancelada' && (
                      <div className="cita-card-actions">
                        {(!cita.estado || cita.estado === 'pendiente') && (
                          <Button onClick={() => handleCambiarEstadoCita(cita.id, 'confirmada')} variant="primary" size="sm">
                            <i className="bi bi-check-circle"></i> Confirmar
                          </Button>
                        )}
                        {cita.estado === 'confirmada' && (
                          <Button onClick={() => handleCambiarEstadoCita(cita.id, 'completada')} variant="success" size="sm">
                            <i className="bi bi-check2-circle"></i> Completar
                          </Button>
                        )}
                        {(!cita.estado || cita.estado === 'pendiente' || cita.estado === 'confirmada') && (
                          <Button onClick={() => handleCambiarEstadoCita(cita.id, 'cancelada')} variant="secondary" size="sm">
                            <i className="bi bi-x-circle"></i> Cancelar
                          </Button>
                        )}
                      </div>
                    )}
                  </Card>
                ))
              ) : (
                <Empty message={`No hay citas para ${fecha} en ${categoria.nombre}`} />
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}