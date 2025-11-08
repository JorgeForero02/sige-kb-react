import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { logger } from '../services/logger';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, Button, Input, Select, Loading, Empty } from '../components/common/Components';
import { AlertSimple } from '../components/common/AlertSimple';
import { useAlert } from '../hooks/useAlert';
import '../pages/Pages.css';

export function ServiciosPage() {
  const [servicios, setServicios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    duracion: '',
    categoria: '',
    precio: '',
    porcentaje: ''
  });
  const { alert, success, error: showError, warning } = useAlert();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [servRes, catRes] = await Promise.all([
        api.getServicios(),
        api.getCategorias()
      ]);
      setServicios(servRes.data || []);
      setCategorias(catRes.data || []);
      logger.success('Servicios cargados', `${servRes.data?.length || 0} servicios`);
    } catch (err) {
      logger.error('Error al cargar servicios', err.message);
      showError(err.message || 'Error al cargar servicios');
    }
    setLoading(false);
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

  return (
    <MainLayout title="Servicios">
      {alert && <AlertSimple message={alert.message} type={alert.type} />}

      <div className="page-header">
        <h4 style={{margin: 0}}>Total: {servicios.length} servicios</h4>
        <Button onClick={() => setShowForm(!showForm)}>+ Nuevo Servicio</Button>
      </div>

      {showForm && (
        <Card>
          <h4 style={{marginBottom: '1.5rem', fontWeight: '700'}}>Agregar Servicio</h4>
          <form onSubmit={handleSubmit} className="form-layout">
            <Input
              label="Nombre *"
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              placeholder="Nombre del servicio"
              required
            />
            <Input
              label="Descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              placeholder="Descripcion"
            />
            <Input
              label="Duracion (minutos) *"
              type="number"
              value={formData.duracion}
              onChange={(e) => setFormData({...formData, duracion: e.target.value})}
              required
            />
            <Select
              label="Categoria *"
              value={formData.categoria}
              onChange={(e) => setFormData({...formData, categoria: e.target.value})}
              options={categorias}
              required
            />
            <Input
              label="Precio *"
              type="number"
              value={formData.precio}
              onChange={(e) => setFormData({...formData, precio: e.target.value})}
              placeholder="0.00"
              required
            />
            <Input
              label="Porcentaje comision"
              type="number"
              value={formData.porcentaje}
              onChange={(e) => setFormData({...formData, porcentaje: e.target.value})}
              placeholder="0"
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

      <div className="servicios-grid">
        {loading ? (
          <Loading />
        ) : servicios.length > 0 ? (
          servicios.map(s => (
            <Card key={s.id}>
              <h5 style={{marginBottom: '0.5rem', fontWeight: '700'}}>{s.nombre}</h5>
              <p style={{color: '#9CA3AF', fontSize: '0.9rem', margin: '0.5rem 0'}}>
                {s.categoriaInfo?.nombre}
              </p>
              <p style={{color: '#666', fontSize: '0.85rem', margin: '0.5rem 0'}}>
                {s.descripcion}
              </p>
              <div className="servicio-footer">
                <span><strong>${s.precio}</strong></span>
                <span style={{color: '#999', fontSize: '0.85rem'}}>{s.duracion} min</span>
              </div>
            </Card>
          ))
        ) : (
          <Empty message="No hay servicios registrados" />
        )}
      </div>
    </MainLayout>
  );
}