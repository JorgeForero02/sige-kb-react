import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { logger } from '../services/logger';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, Button, Input, Select, Loading, Empty, Alert, Modal } from '../components/common/Components';
import { usePermissions } from '../hooks/usePermissions';
import { useAlert } from '../hooks/useAlert';
import '../pages/Pages.css';

export function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    tipo_documento: 'CC',
    documento: '',
    telefono: '',
    rol: '',
    contrasena: '',
    confirmarContrasena: ''
  });
  const { alert, success, error: showError, warning } = useAlert();
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
    loadRoles();
  }, []);

  const loadUsuarios = async () => {
    setLoading(true);
    try {
      const res = await api.getUsuarios();
      setUsuarios(res.data || []);
    } catch (err) {
      showError(err.message || 'Error al cargar usuarios');
    }
    setLoading(false);
  };

  const loadRoles = async () => {
    try {
      const res = await api.getRoles();
      setRoles(res.data || []);
    } catch (err) {
      console.error('Error al cargar roles:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre.trim() || !formData.documento.trim() || !formData.rol || !formData.contrasena) {
      warning('Completa los campos obligatorios: Nombre, Documento, Rol y Contraseña');
      return;
    }

    if (formData.contrasena.length < 6) {
      warning('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (formData.contrasena !== formData.confirmarContrasena) {
      warning('Las contraseñas no coinciden');
      return;
    }

    setSaving(true);
    try {
      const dataToSend = {
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        tipo_documento: formData.tipo_documento,
        documento: formData.documento.trim(),
        email: formData.email.trim() || undefined,
        telefono: formData.telefono.trim() || undefined,
        rol: parseInt(formData.rol),
        contrasena: formData.contrasena
      };

      await api.crearUsuario(dataToSend);
      success('Usuario creado exitosamente!');
      logger.success('Usuario creado', formData.nombre);
      
      setFormData({
        nombre: '',
        apellido: '',
        email: '',
        tipo_documento: 'CC',
        documento: '',
        telefono: '',
        rol: '',
        contrasena: '',
        confirmarContrasena: ''
      });
      setShowModal(false);
      loadUsuarios(); 
    } catch (err) {
      logger.error('Error al crear usuario', err.message);
      showError(err.response?.data?.message || err.message || 'Error al crear usuario');
    }
    setSaving(false);
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
      rol: '',
      contrasena: '',
      confirmarContrasena: ''
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <MainLayout title="Gestión de Usuarios">
      {alert && <Alert type={alert.type}>{alert.message}</Alert>}

      <div className="page-header">
        <h4 style={{margin: 0, color: '#9CA3AF', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: '700'}}>
          Total: {usuarios.length} usuarios
        </h4>
        {can('CREATE_USUARIO') && (
          <Button onClick={handleOpenModal}>+ Nuevo Usuario</Button>
        )}
      </div>

      {/* Modal para crear usuario */}
      <Modal 
        show={showModal} 
        onClose={handleCloseModal}
        title="Crear Usuario"
        size="md"
      >
        <form onSubmit={handleSubmit} className="form-layout">
          <div style={{gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'}}>
            <Input
              label="Nombre *"
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              placeholder="Nombre"
              required
              autoFocus
            />
            <Input
              label="Apellido"
              value={formData.apellido}
              onChange={(e) => setFormData({...formData, apellido: e.target.value})}
              placeholder="Apellido"
            />
          </div>

          <div style={{gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'}}>
            <Select
              label="Tipo Documento *"
              value={formData.tipo_documento}
              onChange={(e) => setFormData({...formData, tipo_documento: e.target.value})}
              options={[
                {id: 'CC', nombre: 'Cédula de Ciudadanía'},
                {id: 'TI', nombre: 'Tarjeta de Identidad'},
                {id: 'CE', nombre: 'Cédula de Extranjería'}
              ]}
              required
            />
            <Input
              label="Documento *"
              value={formData.documento}
              onChange={(e) => setFormData({...formData, documento: e.target.value})}
              placeholder="Número de documento"
              required
            />
          </div>

          <div style={{gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'}}>
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="email@example.com"
            />
            <Input
              label="Teléfono"
              value={formData.telefono}
              onChange={(e) => setFormData({...formData, telefono: e.target.value})}
              placeholder="3001234567"
            />
          </div>

          <div style={{gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'}}>
            <Select
              label="Rol *"
              value={formData.rol}
              onChange={(e) => setFormData({...formData, rol: e.target.value})}
              options={roles}
              required
            />
            <Input
              label="Contraseña *"
              type="password"
              value={formData.contrasena}
              onChange={(e) => setFormData({...formData, contrasena: e.target.value})}
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          <Input
            label="Confirmar Contraseña *"
            type="password"
            value={formData.confirmarContrasena}
            onChange={(e) => setFormData({...formData, confirmarContrasena: e.target.value})}
            placeholder="Repite la contraseña"
            required
          />

          <div className="form-actions" style={{gridColumn: '1 / -1'}}>
            <Button variant="primary" disabled={saving}>
              {saving ? 'Creando...' : 'Crear Usuario'}
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
        ) : usuarios.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Documento</th>
                <th>Rol</th>
                <th>Teléfono</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.nombre} {u.apellido}</strong></td>
                  <td>{u.email || '-'}</td>
                  <td>{u.tipo_documento}: {u.documento}</td>
                  <td>
                    <span style={{
                      padding: '0.3rem 0.8rem',
                      background: '#E0E7FF',
                      color: '#3730A3',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {u.rolInfo?.nombre}
                    </span>
                  </td>
                  <td>{u.telefono || '-'}</td>
                  <td>
                    <span style={{
                      padding: '0.3rem 0.8rem',
                      background: u.estado === 1 ? '#D1FAE5' : '#FEE2E2',
                      color: u.estado === 1 ? '#065F46' : '#7F1D1D',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {u.estado === 1 ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty message="No hay usuarios registrados" />
        )}
      </div>
    </MainLayout>
  );
}