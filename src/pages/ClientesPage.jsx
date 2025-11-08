import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { logger } from '../services/logger';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, Button, Input, Select, Loading, Empty } from '../components/common/Components';
import { AlertSimple } from '../components/common/AlertSimple';
import { useAlert } from '../hooks/useAlert';
import '../pages/Pages.css';

export function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
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

  const handleEdit = (cliente) => {
    setEditingId(cliente.id);
    setFormData({
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      tipo_documento: cliente.tipo_documento,
      documento: cliente.documento,
      telefono: cliente.telefono || ''
    });
    setShowForm(true);
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
      setShowForm(false);
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

  return (
    <MainLayout title="Gestión de Clientes">
      {alert && <AlertSimple message={alert.message} type={alert.type} />}

      <div className="page-header">
        <h4 style={{margin: 0, color: '#9CA3AF', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: '700'}}>
          Total: {clientes.length} clientes
        </h4>
        <Button onClick={() => {setShowForm(!showForm); setEditingId(null); setFormData({nombre: '', apellido: '', tipo_documento: 'CC', documento: '', telefono: ''})}}>
          <i className="bi bi-plus-circle"></i> Nuevo Cliente
        </Button>
      </div>

      <div style={{marginBottom: '1.5rem', display: 'flex', gap: '0.8rem'}}>
        <Input
          placeholder="Buscar por nombre o documento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{flex: 1}}
        />
        <Button onClick={handleBuscar} variant="secondary">Buscar</Button>
        {search && (
          <Button onClick={() => {setSearch(''); fetchClientes();}} variant="secondary">Limpiar</Button>
        )}
      </div>

      {showForm && (
        <Card>
          <h4 style={{marginBottom: '1.5rem', fontWeight: '700', fontSize: '1.2rem', color: '#1F2937'}}>
            {editingId ? 'Editar Cliente' : 'Crear Cliente'}
          </h4>
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
                label="Apellido *"
                value={formData.apellido}
                onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                placeholder="Apellido"
                required
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

            <Input
              label="Telefono"
              value={formData.telefono}
              onChange={(e) => setFormData({...formData, telefono: e.target.value})}
              placeholder="3001234567"
            />

            <div className="form-actions" style={{gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.8rem'}}>
              <Button variant="primary" disabled={saving}>
                {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
              </Button>
              <Button variant="secondary" onClick={() => {setShowForm(false); setEditingId(null);}}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="table-container">
        {loading ? (
          <Loading />
        ) : clientes.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Documento</th>
                <th>Tipo</th>
                <th>Telefono</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.nombre} {c.apellido}</strong></td>
                  <td>{c.documento}</td>
                  <td><span style={{fontSize: '0.75rem', fontWeight: '600', color: '#666'}}>{c.tipo_documento}</span></td>
                  <td>{c.telefono || '-'}</td>
                  <td>
                    <Button onClick={() => handleEdit(c)} variant="secondary" style={{fontSize: '0.85rem', padding: '0.4rem 0.8rem'}}>
                      <i className="bi bi-pencil"></i> Editar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty message="No hay clientes registrados" />
        )}
      </div>
    </MainLayout>
  );
}