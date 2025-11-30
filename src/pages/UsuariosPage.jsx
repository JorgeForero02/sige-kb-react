import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { logger } from '../services/logger';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { Card, Button, Input, Select, Loading, Empty, Alert, Modal } from '../components/common/Components';
import { AlertSimple } from '../components/common/AlertSimple';
import { usePermissions } from '../hooks/usePermissions';
import { useAlert } from '../hooks/useAlert';
import { useNotification } from '../hooks/useNotification';
import '../pages/Pages.css';

// Componente personalizado para contraseña con toggle
const PasswordInput = ({ label, value, onChange, placeholder, required = false }) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="password-input-container" style={{ position: 'relative' }}>
      <label style={{
        display: 'block',
        marginBottom: '0.5rem',
        fontWeight: '600',
        color: '#374151',
        fontSize: '0.875rem'
      }}>
        {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          style={{
            width: '100%',
            padding: '0.75rem 2.5rem 0.75rem 0.75rem',
            border: '1px solid #D1D5DB',
            borderRadius: '6px',
            fontSize: '0.875rem',
            transition: 'all 0.2s',
            outline: 'none'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#3B82F6';
            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#D1D5DB';
            e.target.style.boxShadow = 'none';
          }}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          style={{
            position: 'absolute',
            right: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: '#6B7280',
            cursor: 'pointer',
            fontSize: '1rem',
            padding: '0.25rem',
            borderRadius: '4px',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.color = '#374151';
          }}
          onMouseLeave={(e) => {
            e.target.style.color = '#6B7280';
          }}
        >
          <i className={`bi ${showPassword ? 'bi-eye' : 'bi-eye-slash'}`}></i>
        </button>
      </div>
    </div>
  );
};

export function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [duplicateError, setDuplicateError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
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
  const { alert, success, error: showError, warning, clearAlert } = useAlert();
  const { addNotification } = useNotification();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  // Función para validaciones del formulario
  const validateForm = () => {
    const errors = {};

    // Validar nombre
    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es obligatorio';
    }

    // Validar documento
    if (!formData.documento.trim()) {
      errors.documento = 'El documento es obligatorio';
    }

    // Validar rol
    if (!formData.rol) {
      errors.rol = 'El rol es obligatorio';
    }

    // Validar contraseña
    if (!formData.contrasena) {
      errors.contrasena = 'La contraseña es obligatoria';
    } else if (formData.contrasena.length < 6) {
      errors.contrasena = 'La contraseña debe tener al menos 6 caracteres';
    }

    // Validar confirmación de contraseña
    if (!formData.confirmarContrasena) {
      errors.confirmarContrasena = 'Confirma la contraseña';
    } else if (formData.contrasena !== formData.confirmarContrasena) {
      errors.confirmarContrasena = 'Las contraseñas no coinciden';
    }

    // Validar email si está presente
    if (formData.email && !formData.email.includes('@')) {
      errors.email = 'El email debe contener @';
    }

    // Validar teléfono si está presente
    if (formData.telefono && !/^\d+$/.test(formData.telefono)) {
      errors.telefono = 'El teléfono debe contener solo números';
    }

    return errors;
  };

  // Función para verificar si el usuario ya existe
  const checkDuplicateUser = () => {
    const { documento, email } = formData;

    // Verificar duplicados por documento (campo único)
    const duplicateDocumento = usuarios.find(user =>
      user.documento === documento.trim() &&
      user.tipo_documento === formData.tipo_documento
    );

    // Verificar duplicados por email (si se proporciona)
    const duplicateEmail = email.trim() ? usuarios.find(user =>
      user.email && user.email.toLowerCase() === email.trim().toLowerCase()
    ) : null;

    if (duplicateDocumento) {
      return {
        isDuplicate: true,
        field: 'documento',
        message: `Ya existe un usuario con el documento ${formData.tipo_documento}: ${documento}`
      };
    }

    if (duplicateEmail) {
      return {
        isDuplicate: true,
        field: 'email',
        message: `Ya existe un usuario con el email: ${email}`
      };
    }

    return { isDuplicate: false };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Limpiar mensajes previos
    setDuplicateError('');
    setSuccessMessage('');
    setValidationErrors({});

    // Validar formulario
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Verificar duplicados antes de enviar
    const duplicateCheck = checkDuplicateUser();
    if (duplicateCheck.isDuplicate) {
      setDuplicateError(duplicateCheck.message);
      return;
    }

    setSaving(true);
    try {
      const dataToSend = {
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim() || null,
        tipo_documento: formData.tipo_documento,
        documento: formData.documento.trim(),
        email: formData.email.trim() || null,
        telefono: formData.telefono.trim() || null,
        rol: parseInt(formData.rol),
        contrasena: formData.contrasena
      };

      console.log('Enviando datos:', dataToSend);

      await api.crearUsuario(dataToSend);

      // Mostrar alerta de éxito
      setSuccessMessage('Usuario creado exitosamente!');
      success('Usuario creado exitosamente!', { title: 'Usuario creado', autoHide: false });

      // También usar notificación si está disponible
      if (addNotification) {
        addNotification({
          type: 'success',
          message: 'Usuario creado exitosamente!'
        });
      }

      logger.success('Usuario creado', formData.nombre);

      // Limpiar formulario
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

      // Cerrar modal después de 2 segundos
      setTimeout(() => {
        setShowModal(false);
        setSuccessMessage('');
        loadUsuarios();
      }, 2000);

    } catch (err) {
      logger.error('Error al crear usuario', err.message);

      // Manejar errores de validación del backend
      const errorData = err.response?.data;
      console.log('Error del backend:', errorData);

      if (errorData && errorData.errors) {
        // Si hay errores de validación específicos del backend
        const backendErrors = {};
        Object.keys(errorData.errors).forEach(key => {
          backendErrors[key] = errorData.errors[key].join(', ');
        });
        setValidationErrors(backendErrors);
      } else if (errorData && errorData.message) {
        setDuplicateError(errorData.message);
      } else {
        const errorMessage = err.message || 'Error al crear usuario';
        setDuplicateError(errorMessage);
      }
    }
    setSaving(false);
  };

  // Función para limpiar errores cuando el usuario modifica los campos
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Limpiar errores de validación cuando el usuario modifica el campo
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Limpiar error de duplicado cuando el usuario modifica el campo problemático
    if (duplicateError && (field === 'documento' || field === 'email' || field === 'tipo_documento')) {
      setDuplicateError('');
    }
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
    setDuplicateError('');
    setSuccessMessage('');
    setValidationErrors({});
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setDuplicateError('');
    setSuccessMessage('');
    setValidationErrors({});
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

        <div className="page-header">
          <div>
            <h4 className="dashboard-title">Usuarios</h4>
          </div>
          <h4 style={{ margin: 0, color: '#9CA3AF', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: '700' }}>
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
          {/* Alertas dentro del modal - encima del formulario */}
          {duplicateError && (
            <div style={{ marginBottom: '1.5rem' }}>
              <Alert type="danger">{duplicateError}</Alert>
            </div>
          )}

          {successMessage && (
            <div style={{ marginBottom: '1.5rem' }}>
              <Alert type="success">{successMessage}</Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="form-layout">
            <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <Input
                  label="Nombre *"
                  value={formData.nombre}
                  onChange={(e) => handleFieldChange('nombre', e.target.value)}
                  placeholder="Nombre"
                  required
                  autoFocus
                />
                {validationErrors.nombre && (
                  <div style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {validationErrors.nombre}
                  </div>
                )}
              </div>
              <div>
                <Input
                  label="Apellido"
                  value={formData.apellido}
                  onChange={(e) => handleFieldChange('apellido', e.target.value)}
                  placeholder="Apellido"
                />
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <Select
                  label="Tipo Documento *"
                  value={formData.tipo_documento}
                  onChange={(e) => handleFieldChange('tipo_documento', e.target.value)}
                  options={[
                    { id: 'CC', nombre: 'Cédula de Ciudadanía' },
                    { id: 'TI', nombre: 'Tarjeta de Identidad' },
                    { id: 'CE', nombre: 'Cédula de Extranjería' }
                  ]}
                  required
                />
              </div>
              <div>
                <Input
                  label="Documento *"
                  value={formData.documento}
                  onChange={(e) => handleFieldChange('documento', e.target.value)}
                  placeholder="Número de documento"
                  required
                />
                {validationErrors.documento && (
                  <div style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {validationErrors.documento}
                  </div>
                )}
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <Input
                  label="Email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  placeholder="email@example.com"
                />
                {validationErrors.email && (
                  <div style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {validationErrors.email}
                  </div>
                )}
              </div>
              <div>
                <Input
                  label="Teléfono"
                  value={formData.telefono}
                  onChange={(e) => handleFieldChange('telefono', e.target.value)}
                  placeholder="Número de teléfono"
                />
                {validationErrors.telefono && (
                  <div style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {validationErrors.telefono}
                  </div>
                )}
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <Select
                  label="Rol *"
                  value={formData.rol}
                  onChange={(e) => handleFieldChange('rol', e.target.value)}
                  options={roles}
                  required
                />
                {validationErrors.rol && (
                  <div style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {validationErrors.rol}
                  </div>
                )}
              </div>
              <div>
                <PasswordInput
                  label="Contraseña *"
                  value={formData.contrasena}
                  onChange={(e) => handleFieldChange('contrasena', e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
                {validationErrors.contrasena && (
                  <div style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {validationErrors.contrasena}
                  </div>
                )}
              </div>
            </div>

            <div>
              <PasswordInput
                label="Confirmar Contraseña *"
                value={formData.confirmarContrasena}
                onChange={(e) => handleFieldChange('confirmarContrasena', e.target.value)}
                placeholder="Repite la contraseña"
                required
              />
              {validationErrors.confirmarContrasena && (
                <div style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {validationErrors.confirmarContrasena}
                </div>
              )}
            </div>

            <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
              <Button variant="primary" disabled={saving || !!successMessage}>
                {saving ? 'Creando...' : successMessage ? '¡Creado!' : 'Crear Usuario'}
              </Button>
              <Button variant="secondary" onClick={handleCloseModal} disabled={saving}>
                {successMessage ? 'Cerrar' : 'Cancelar'}
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
      </main>
    </div>
  );
}