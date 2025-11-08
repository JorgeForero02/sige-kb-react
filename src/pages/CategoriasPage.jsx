import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { logger } from '../services/logger';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, Button, Input, Loading, Empty } from '../components/common/Components';
import { AlertSimple } from '../components/common/AlertSimple';
import { useAlert } from '../hooks/useAlert';
import { usePermissions } from '../hooks/usePermissions';
import '../pages/Pages.css';

export function CategoriasPage() {
  const [categorias, setCategorias] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: ''
  });
  const { alert, success, error: showError, warning } = useAlert();
  const { can } = usePermissions();

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
      const res = await api.getCategorias();
      setCategorias(res.data || []);
      logger.success('Categorias cargadas', `${res.data?.length || 0} categorias`);
    } catch (err) {
      logger.error('Error al cargar categorias', err.message);
      showError(err.message || 'Error al cargar categorias');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      warning('El nombre es obligatorio');
      return;
    }

    setSaving(true);
    try {
      await api.crearCategoria(formData);
      success('Categoria creada exitosamente!');
      logger.success('Categoria creada', formData.nombre);
      setFormData({ nombre: '', descripcion: '' });
      setShowForm(false);
      fetchCategorias();
    } catch (err) {
      logger.error('Error al crear categoria', err.message);
      showError(err.message || 'Error al crear categoria');
    }
    setSaving(false);
  };

  return (
    <MainLayout title="Categorias de Servicios">
      {alert && <AlertSimple message={alert.message} type={alert.type} />}

      <div className="page-header">
        <h4 style={{margin: 0}}>Total: {categorias.length} categorias</h4>
        {can('CREATE_CATEGORIA') && (
          <Button onClick={() => setShowForm(!showForm)}>+ Nueva Categoria</Button>
        )}
      </div>

      {showForm && (
        <Card>
          <h4 style={{marginBottom: '1.5rem', fontWeight: '700'}}>Agregar Categoria</h4>
          <form onSubmit={handleSubmit} className="form-layout">
            <Input
              label="Nombre *"
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              placeholder="Nombre de la categoria"
              required
            />
            <Input
              label="Descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              placeholder="Descripcion"
            />
            <div className="form-actions">
              <Button variant="primary" disabled={saving}>
                {saving ? 'Guardando...' : 'Crear Categoria'}
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
        ) : categorias.length > 0 ? (
          categorias.map(c => (
            <Card key={c.id}>
              <h5 style={{marginBottom: '0.5rem', fontWeight: '700'}}>{c.nombre}</h5>
              <p style={{color: '#666', fontSize: '0.85rem', margin: '0.5rem 0'}}>
                {c.descripcion || 'Sin descripcion'}
              </p>
            </Card>
          ))
        ) : (
          <Empty message="No hay categorias registradas" />
        )}
      </div>
    </MainLayout>
  );
}