import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { logger } from '../services/logger';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, Button, Input, Select, Loading, Empty } from '../components/common/Components';
import { AlertSimple } from '../components/common/AlertSimple';
import { useAlert } from '../hooks/useAlert';
import { usePermissions } from '../hooks/usePermissions';
import '../pages/Pages.css';

export function EmpleadosPage() {
  const [empleados, setEmpleados] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    tipo_documento: 'CC',
    documento: '',
    telefono: '',
    rol: '',
    contrasena: '',
    categorias: []
  });
  const { alert, success, error: showError, warning } = useAlert();
  const { can } = usePermissions();

  if (!can('VIEW_EMPLEADOS')) {
    return (
      <MainLayout title="Empleados">
        <AlertSimple message="No tienes permiso para acceder a esta seccion" type="error" />
      </MainLayout>
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
      setEmpleados(empRes.data || []);
      setRoles(rolRes.data || []);
      setCategorias(catRes.data || []);
      logger.success('Empleados cargados', `${empRes.data?.length || 0} empleados`);
    } catch (err) {
      logger.error('Error al cargar empleados', err.message);
      showError(err.message || 'Error al cargar empleados');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre.trim() || !formData.documento.trim() || !formData.rol || !formData.contrasena.trim()) {
      warning('Completa: Nombre, Documento, Rol y Contraseña');
      return;
    }

    if (formData.contrasena.length < 6) {
      warning('La contraseña debe tener mínimo 6 caracteres');
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
        rol: parseInt(formData.rol),
        contrasena: formData.contrasena,
        categorias: formData.categorias.length > 0 ? formData.categorias.map(c => parseInt(c)) : undefined
      };

      await api.crearUsuario(dataToSend);
      success('Empleado creado exitosamente!');
      logger.success('Empleado creado', formData.nombre);
      
      setFormData({
        nombre: '',
        apellido: '',
        email: '',
        tipo_documento: 'CC',
        documento: '',
        telefono: '',
        rol: '',
        contrasena: '',
        categorias: []
      });
      setShowForm(false);
      fetchData();
    } catch (err) {
      logger.error('Error al crear empleado', err.message);
      showError(err.message || 'Error al crear empleado');
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

  return (
    <MainLayout title="Gestión de Empleados">
      {alert && <AlertSimple message={alert.message} type={alert.type} />}

      <div className="page-header">
        <h4 style={{margin: 0, color: '#9CA3AF', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: '700'}}>
          Total: {empleados.length} empleados
        </h4>
        {can('CREATE_EMPLEADO') && (
          <Button onClick={() => setShowForm(!showForm)}>+ Nuevo Empleado</Button>
        )}
      </div>

      {showForm && (
        <Card>
          <h4 style={{marginBottom: '1.5rem', fontWeight: '700', fontSize: '1.2rem', color: '#1F2937'}}>Crear Empleado</h4>
          <form onSubmit={handleSubmit} className="form-layout">
            <div style={{gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'}}>
              <Input
                label="Nombre *"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                placeholder="Nombre"
                required
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
                label="Telefono"
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

            {categorias.length > 0 && (
              <div style={{gridColumn: '1 / -1'}}>
                <p style={{marginBottom: '0.8rem', fontWeight: '600', color: '#1F2937'}}>Categorías de Servicios</p>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.8rem'}}>
                  {categorias.map(cat => (
                    <label key={cat.id} style={{display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem', background: '#F3F4F6', borderRadius: '6px'}}>
                      <input
                        type="checkbox"
                        checked={formData.categorias.includes(cat.id)}
                        onChange={() => handleCategoriaToggle(cat.id)}
                        style={{cursor: 'pointer'}}
                      />
                      <span style={{fontSize: '0.9rem', fontWeight: '500'}}>{cat.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="form-actions" style={{gridColumn: '1 / -1'}}>
              <Button variant="primary" disabled={saving}>
                {saving ? 'Creando...' : 'Crear Empleado'}
              </Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="table-container">
        {loading ? (
          <Loading />
        ) : empleados.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Documento</th>
                <th>Rol</th>
                <th>Telefono</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {empleados.map(e => (
                <tr key={e.id}>
                  <td><strong>{e.nombre} {e.apellido}</strong></td>
                  <td>{e.email || '-'}</td>
                  <td>{e.tipo_documento}: {e.documento}</td>
                  <td><span style={{padding: '0.3rem 0.8rem', background: '#E0E7FF', color: '#3730A3', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600'}}>{e.rolInfo?.nombre}</span></td>
                  <td>{e.telefono || '-'}</td>
                  <td><span style={{padding: '0.3rem 0.8rem', background: e.estado === 1 ? '#D1FAE5' : '#FEE2E2', color: e.estado === 1 ? '#065F46' : '#7F1D1D', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600'}}>{e.estado === 1 ? 'Activo' : 'Inactivo'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty message="No hay empleados registrados" />
        )}
      </div>
    </MainLayout>
  );
}