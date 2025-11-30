import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { logger } from '../services/logger';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { Card, Button, Input, Select, Loading, Empty } from '../components/common/Components';
import { AlertSimple } from '../components/common/AlertSimple';
import { useAlert } from '../hooks/useAlert';
import { usePermissions } from '../hooks/usePermissions';
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
        maxWidth: '700px',
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

export function EmpleadosPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [empleados, setEmpleados] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingState, setChangingState] = useState(null);
  const [editingEmpleado, setEditingEmpleado] = useState(null);
  const [changingPassword, setChangingPassword] = useState(null);
  const [roles, setRoles] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [searchEmpleado, setSearchEmpleado] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    tipo_documento: 'CC',
    documento: '',
    telefono: '',
    contrasena: '',
    categorias: [],
    fecha_salida: ''
  });
  const [passwordData, setPasswordData] = useState({
    nuevaContrasena: '',
    confirmarContrasena: ''
  });
  const { alert, success, error: showError, warning, clearAlert } = useAlert();
  const { can } = usePermissions();
  const [estadoConfirm, setEstadoConfirm] = useState({
    show: false,
    empleado: null,
    nuevoEstado: 1,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    type: 'warning'
  });
  const [estadoLoading, setEstadoLoading] = useState(false);

  // Verificación de permisos
  if (!can('VIEW_EMPLEADOS')) {
    return (
      <div className="empleados-page">
        <Header />
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <main className="main-content">
          <AlertSimple
            show={true}
            type="error"
            title="Acceso denegado"
            message="No tienes permiso para acceder a esta sección"
            confirmText="Aceptar"
          />
        </main>
      </div>
    );
  }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, rolRes, catRes] = await Promise.all([
        api.getUsuarios(),
        api.getRoles(),
        api.getCategorias()
      ]);

      const usuariosEmpleados = (empRes.data || []).filter(usuario =>
        usuario.rolInfo?.nombre === 'Empleado'
      );

      const empleadosConCategorias = await Promise.all(
        usuariosEmpleados.map(async (empleado) => {
          try {
            const usuarioDetalle = await api.getUsuarioById(empleado.id);
            return {
              ...empleado,
              categorias: usuarioDetalle.data?.categorias || []
            };
          } catch (error) {
            return {
              ...empleado,
              categorias: []
            };
          }
        })
      );

      setEmpleados(empleadosConCategorias);
      setRoles(rolRes.data || []);
      setCategorias(catRes.data || []);
      logger.success('Empleados cargados', `${empleadosConCategorias.length} empleados`);
    } catch (err) {
      logger.error('Error al cargar empleados', err.message);
      showError('Error al cargar la lista de empleados');
    }
    setLoading(false);
  };

  const empleadosFiltrados = empleados.filter(empleado =>
    empleado.nombre.toLowerCase().includes(searchEmpleado.toLowerCase()) ||
    empleado.apellido.toLowerCase().includes(searchEmpleado.toLowerCase()) ||
    empleado.documento.includes(searchEmpleado) ||
    empleado.email.toLowerCase().includes(searchEmpleado.toLowerCase())
  );

  const formatFecha = (fechaString) => {
    if (!fechaString) return '-';

    try {
      const fecha = new Date(fechaString);
      if (isNaN(fecha.getTime())) return '-';
      return fecha.toLocaleDateString('es-ES');
    } catch (error) {
      return '-';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre.trim() || !formData.documento.trim() || !formData.contrasena.trim()) {
      warning('Completa todos los campos obligatorios: Nombre, Documento y Contraseña');
      return;
    }

    if (formData.contrasena.length < 6) {
      warning('La contraseña debe tener mínimo 6 caracteres');
      return;
    }

    setSaving(true);
    try {
      const rolEmpleado = roles.find(rol => rol.nombre === 'Empleado');
      if (!rolEmpleado) {
        throw new Error('No se encontró el rol Empleado');
      }

      const dataToSend = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        tipo_documento: formData.tipo_documento,
        documento: formData.documento,
        email: formData.email || undefined,
        telefono: formData.telefono || undefined,
        rol: rolEmpleado.id,
        contrasena: formData.contrasena,
        categorias: formData.categorias.length > 0 ? formData.categorias : undefined
      };

      await api.crearUsuario(dataToSend);

      success(
        'El empleado ha sido registrado en el sistema',
        { title: 'Empleado creado', autoHide: false }
      );
      logger.success('Empleado creado', formData.nombre);

      setFormData({
        nombre: '',
        apellido: '',
        email: '',
        tipo_documento: 'CC',
        documento: '',
        telefono: '',
        contrasena: '',
        categorias: []
      });
      setShowModal(false);
      fetchData();
    } catch (err) {
      logger.error('Error al crear empleado', err.message);
      showError(err.message || 'Error al crear el empleado');
    }
    setSaving(false);
  };

  const handleEdit = (empleado) => {
    if (empleado.estado === 0) {
      showError('No se puede editar la información de un empleado inactivo. Active primero al empleado para poder editarlo.');
      return;
    }

    const categoriasIds = Array.isArray(empleado.categorias)
      ? empleado.categorias
        .map(cat => cat?.id || null)
        .filter(Boolean)
      : [];

    setEditingEmpleado(empleado);
    setFormData({
      nombre: empleado.nombre || '',
      apellido: empleado.apellido || '',
      email: empleado.email || '',
      tipo_documento: empleado.tipo_documento || 'CC',
      documento: empleado.documento || '',
      telefono: empleado.telefono || '',
      contrasena: '',
      categorias: categoriasIds,
      fecha_salida: empleado.fecha_salida ? empleado.fecha_salida.split('T')[0] : ''
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!editingEmpleado || !formData.nombre.trim() || !formData.documento.trim()) {
      warning('Completa los campos obligatorios: Nombre y Documento');
      return;
    }

    setSaving(true);
    try {
      const dataToSend = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        tipo_documento: formData.tipo_documento,
        documento: formData.documento,
        email: formData.email || undefined,
        telefono: formData.telefono || undefined,
        categorias: formData.categorias.length > 0 ? formData.categorias : undefined,
        fecha_salida: formData.fecha_salida || undefined
      };

      await api.actualizarUsuario(editingEmpleado.id, dataToSend);

      success(
        'Los cambios han sido guardados correctamente',
        { title: 'Empleado actualizado', autoHide: false }
      );
      logger.success('Empleado actualizado', formData.nombre);

      setFormData({
        nombre: '',
        apellido: '',
        email: '',
        tipo_documento: 'CC',
        documento: '',
        telefono: '',
        contrasena: '',
        categorias: [],
        fecha_salida: ''
      });
      setEditingEmpleado(null);
      setShowEditModal(false);
      fetchData();
    } catch (err) {
      logger.error('Error al actualizar empleado', err.message);
      showError(err.message || 'Error al actualizar el empleado');
    }
    setSaving(false);
  };

  const handleToggleEstado = (empleado) => {
    const nuevoEstado = empleado.estado === 1 ? 0 : 1;
    const accion = nuevoEstado === 1 ? 'activar' : 'desactivar';

    setEstadoConfirm({
      show: true,
      empleado,
      nuevoEstado,
      title: `${accion === 'activar' ? 'Activar' : 'Desactivar'} Empleado`,
      message: `¿Está seguro de que desea ${accion} al empleado "${empleado.nombre} ${empleado.apellido}"?`,
      confirmText: accion === 'activar' ? 'Activar' : 'Desactivar',
      type: accion === 'activar' ? 'success' : 'warning'
    });
  };

  const closeEstadoConfirm = () => {
    if (estadoLoading) return;
    setEstadoConfirm(prev => ({ ...prev, show: false, empleado: null }));
  };

  const confirmToggleEstado = async () => {
    if (!estadoConfirm.empleado) return;

    const { empleado, nuevoEstado } = estadoConfirm;
    const accion = nuevoEstado === 1 ? 'activar' : 'desactivar';
    const accionTexto = nuevoEstado === 1 ? 'activado' : 'desactivado';

    setEstadoLoading(true);
    setChangingState(empleado.id);
    try {
      await api.cambiarEstadoUsuario(empleado.id, nuevoEstado);

      success(
        `¡Empleado ${accionTexto} exitosamente!`,
        { title: `Empleado ${accionTexto}`, autoHide: false }
      );
      logger.success(`Empleado ${accionTexto}`, empleado.nombre);

      fetchData();
      closeEstadoConfirm();
    } catch (err) {
      logger.error(`Error al ${accion} empleado`, err.message);
      showError(err.message || `Error al ${accion} el empleado`);
    } finally {
      setEstadoLoading(false);
      setChangingState(null);
    }
  };

  const handleOpenPasswordModal = (empleado) => {
    setChangingPassword(empleado);
    setPasswordData({
      nuevaContrasena: '',
      confirmarContrasena: ''
    });
    setShowPasswordModal(true);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!passwordData.nuevaContrasena.trim() || !passwordData.confirmarContrasena.trim()) {
      warning('Completa ambos campos de contraseña');
      return;
    }

    if (passwordData.nuevaContrasena.length < 6) {
      warning('La contraseña debe tener mínimo 6 caracteres');
      return;
    }

    if (passwordData.nuevaContrasena !== passwordData.confirmarContrasena) {
      warning('Las contraseñas no coinciden');
      return;
    }

    setSaving(true);
    try {
      await api.cambiarPasswordUsuario(changingPassword.id, passwordData.nuevaContrasena);

      success(
        'La contraseña ha sido actualizada correctamente',
        { title: 'Contraseña actualizada', autoHide: false }
      );
      logger.success('Contraseña cambiada', changingPassword.nombre);

      setPasswordData({
        nuevaContrasena: '',
        confirmarContrasena: ''
      });
      setChangingPassword(null);
      setShowPasswordModal(false);
    } catch (err) {
      logger.error('Error al cambiar contraseña', err.message);
      showError(err.message || 'Error al cambiar la contraseña');
    }
    setSaving(false);
  };

  const handleCategoriaToggle = (catId) => {
    setFormData(prev => ({
      ...prev,
      categorias: prev.categorias.includes(catId)
        ? prev.categorias.filter(c => c !== catId)
        : [...prev.categorias, catId]
    }));
  };

  const handleOpenModal = () => {
    setShowModal(true);
    setFormData({
      nombre: '',
      apellido: '',
      email: '',
      tipo_documento: 'CC',
      documento: '',
      telefono: '',
      contrasena: '',
      categorias: []
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setShowEditModal(false);
    setShowPasswordModal(false);
    setEditingEmpleado(null);
    setChangingPassword(null);
    setFormData({
      nombre: '',
      apellido: '',
      email: '',
      tipo_documento: 'CC',
      documento: '',
      telefono: '',
      contrasena: '',
      categorias: []
    });
    setPasswordData({
      nuevaContrasena: '',
      confirmarContrasena: ''
    });
  };

  const getEstadoColor = (estado) => {
    return estado === 1
      ? { background: '#DCFCE7', color: '#166534', text: 'Activo' }
      : { background: '#FEE2E2', color: '#7F1D1D', text: 'Inactivo' };
  };

  const getNombresCategorias = (empleado) => {
    if (!empleado.categorias || !Array.isArray(empleado.categorias) || empleado.categorias.length === 0) {
      return 'Sin categorías asignadas';
    }

    return empleado.categorias.map(cat => cat.nombre).filter(Boolean).join(', ');
  };

  return (
    <div className="empleados-page">
      <Header />
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <main className="main-content">
        <button
          className="hamburger content-hamburger"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          <i className="bi bi-list"></i>
        </button>

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
        {estadoConfirm.show && (
          <AlertSimple
            show={estadoConfirm.show}
            title={estadoConfirm.title}
            message={estadoConfirm.message}
            type={estadoConfirm.type}
            confirmText={estadoConfirm.confirmText}
            cancelText="Cancelar"
            showCancel
            onConfirm={confirmToggleEstado}
            onCancel={closeEstadoConfirm}
            onClose={closeEstadoConfirm}
            loading={estadoLoading}
            closeOnOverlayClick={!estadoLoading}
          />
        )}

        <div>

          <div className="page-header">
            <div>
              <h4 className="dashboard-title">Empleados </h4>
            </div>
            {can('CREATE_EMPLEADO') && (
              <Button onClick={handleOpenModal}>+ Nuevo Empleado</Button>
            )}
          </div>
          <p style={{ color: '#6B7280', margin: '0.5rem 0 0 0' }}>
            Total: {empleados.length} empleado{empleados.length !== 1 ? 's' : ''}
            {searchEmpleado && (
              <span style={{ marginLeft: '1rem', fontStyle: 'italic' }}>
                (Filtrados: {empleadosFiltrados.length})
              </span>
            )}
          </p>

          <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
            <Input
              placeholder="Buscar por nombre..."
              value={searchEmpleado}
              onChange={(e) => setSearchEmpleado(e.target.value)}
              style={{ flex: 1, maxWidth: '400px' }}
            />
            {searchEmpleado && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSearchEmpleado('')}
                style={{ padding: '0.5rem 1rem' }}
              >
                Limpiar
              </Button>
            )}
          </div>
        </div>

        {/* Modal para CREAR empleado */}
        <Modal show={showModal} onClose={handleCloseModal}>
          <h4 style={{ marginBottom: '1.5rem', fontWeight: '700', fontSize: '1.2rem', color: '#1F2937' }}>Crear Empleado</h4>
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
                label="Apellido"
                value={formData.apellido}
                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                placeholder="Apellido"
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

            <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
              <Input
                label="Telefono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <Input
                label="Contraseña *"
                type="password"
                value={formData.contrasena}
                onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>

            {categorias.length > 0 && (
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ marginBottom: '0.8rem', fontWeight: '600', color: '#1F2937' }}>Categorías de Servicios</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.8rem' }}>
                  {categorias.map(cat => (
                    <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem', background: '#F3F4F6', borderRadius: '6px' }}>
                      <input
                        type="checkbox"
                        checked={formData.categorias.includes(cat.id)}
                        onChange={() => handleCategoriaToggle(cat.id)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{cat.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
              <Button variant="primary" disabled={saving}>
                {saving ? 'Creando...' : 'Crear Empleado'}
              </Button>
              <Button variant="secondary" onClick={handleCloseModal}>
                Cancelar
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal para EDITAR empleado */}
        <Modal show={showEditModal} onClose={handleCloseModal}>
          <h4 style={{ marginBottom: '1.5rem', fontWeight: '700', fontSize: '1.2rem', color: '#1F2937' }}>
            Editar Empleado: {editingEmpleado?.nombre} {editingEmpleado?.apellido}
          </h4>
          <form onSubmit={handleUpdate} className="form-layout">
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
                label="Apellido"
                value={formData.apellido}
                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                placeholder="Apellido"
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

            <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
              <Input
                label="Telefono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="3001234567"
              />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <Input
                label="Fecha de Salida"
                type="date"
                value={formData.fecha_salida}
                onChange={(e) => setFormData({ ...formData, fecha_salida: e.target.value })}
                placeholder="Fecha de salida (opcional)"
              />
            </div>

            {categorias.length > 0 && (
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ marginBottom: '0.8rem', fontWeight: '600', color: '#1F2937' }}>Categorías de Servicios</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.8rem' }}>
                  {categorias.map(cat => (
                    <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem', background: '#F3F4F6', borderRadius: '6px' }}>
                      <input
                        type="checkbox"
                        checked={formData.categorias.includes(cat.id)}
                        onChange={() => handleCategoriaToggle(cat.id)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{cat.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
              <Button variant="primary" disabled={saving}>
                {saving ? 'Actualizando...' : 'Actualizar Empleado'}
              </Button>
              <Button variant="secondary" onClick={handleCloseModal}>
                Cancelar
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal para CAMBIAR CONTRASEÑA */}
        <Modal show={showPasswordModal} onClose={handleCloseModal}>
          <h4 style={{ marginBottom: '1.5rem', fontWeight: '700', fontSize: '1.2rem', color: '#1F2937' }}>
            Cambiar Contraseña: {changingPassword?.nombre} {changingPassword?.apellido}
          </h4>
          <form onSubmit={handleChangePassword} className="form-layout">
            <Input
              label="Nueva Contraseña *"
              type="password"
              value={passwordData.nuevaContrasena}
              onChange={(e) => setPasswordData({ ...passwordData, nuevaContrasena: e.target.value })}
              placeholder="Mínimo 6 caracteres"
              required
              autoFocus
            />
            <Input
              label="Confirmar Contraseña *"
              type="password"
              value={passwordData.confirmarContrasena}
              onChange={(e) => setPasswordData({ ...passwordData, confirmarContrasena: e.target.value })}
              placeholder="Repite la contraseña"
              required
            />
            <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
              <Button variant="primary" disabled={saving}>
                {saving ? 'Cambiando...' : 'Cambiar Contraseña'}
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
          ) : empleadosFiltrados.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Documento</th>
                  <th>Categorías</th>
                  <th>Teléfono</th>
                  <th>Fecha Registro</th>
                  <th>Fecha Salida</th>
                  <th>Estado</th>
                  {can('EDIT_EMPLEADO') && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {empleadosFiltrados.map(empleado => {
                  const estadoInfo = getEstadoColor(empleado.estado);
                  const categoriasNombres = getNombresCategorias(empleado);

                  return (
                    <tr key={empleado.id}>
                      <td><strong>{empleado.nombre} {empleado.apellido}</strong></td>
                      <td>{empleado.email || '-'}</td>
                      <td>{empleado.tipo_documento}: {empleado.documento}</td>
                      <td style={{ maxWidth: '200px' }}>
                        <span style={{
                          color: '#6B7280',
                          fontSize: '0.85rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {categoriasNombres}
                        </span>
                      </td>
                      <td>{empleado.telefono || '-'}</td>
                      <td style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                        {formatFecha(empleado.fecha_registro)}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                        {formatFecha(empleado.fecha_salida)}
                      </td>
                      <td>
                        <span style={{
                          padding: '0.35rem 0.9rem',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          backgroundColor: estadoInfo.background,
                          color: estadoInfo.color,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {estadoInfo.text}
                        </span>
                      </td>
                      {can('EDIT_EMPLEADO') && (
                        <td>
                          <div className="table-actions" style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleEdit(empleado)}
                              title={empleado.estado === 0 ? "No se puede editar empleados inactivos" : "Editar empleado"}
                              disabled={changingState === empleado.id || empleado.estado === 0}
                              style={{
                                padding: '0.2rem 0.5rem',
                                fontSize: '0.75rem',
                                minWidth: 'auto',
                                opacity: empleado.estado === 0 ? 0.5 : 1,
                                cursor: empleado.estado === 0 ? 'not-allowed' : 'pointer'
                              }}
                            >
                              <i className="bi bi-pencil"></i>
                            </Button>
                            <Button
                              variant={empleado.estado === 1 ? 'warning' : 'success'}
                              size="sm"
                              onClick={() => handleToggleEstado(empleado)}
                              title={empleado.estado === 1 ? 'Desactivar empleado' : 'Activar empleado'}
                              disabled={changingState === empleado.id}
                              style={{
                                padding: '0.2rem 0.5rem',
                                fontSize: '0.75rem',
                                minWidth: 'auto'
                              }}
                            >
                              {changingState === empleado.id ? (
                                <i className="bi bi-arrow-repeat"></i>
                              ) : (
                                <i className={empleado.estado === 1 ? 'bi bi-trash' : 'bi bi-play'}></i>
                              )}
                            </Button>
                            <Button
                              variant="info"
                              size="sm"
                              onClick={() => handleOpenPasswordModal(empleado)}
                              title="Cambiar contraseña"
                              disabled={changingState === empleado.id}
                              style={{
                                padding: '0.2rem 0.5rem',
                                fontSize: '0.75rem',
                                minWidth: 'auto'
                              }}
                            >
                              <i className="bi bi-key"></i>
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
            <Empty message={searchEmpleado ? "No se encontraron empleados que coincidan con la búsqueda" : "No hay empleados registrados"} />
          )}
        </div>
      </main >
    </div >
  );
}