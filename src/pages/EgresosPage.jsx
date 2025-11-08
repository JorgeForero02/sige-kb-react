import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { logger } from '../services/logger';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, Button, Input, Select, Loading, Empty } from '../components/common/Components';
import { AlertSimple } from '../components/common/AlertSimple';
import { useAlert } from '../hooks/useAlert';
import '../pages/Pages.css';

export function EgresosPage() {
  const [egresos, setEgresos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().slice(0, 10));
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().slice(0, 10));
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [totales, setTotales] = useState({ total: 0, cantidad: 0 });
  const [formData, setFormData] = useState({
    categoria: '',
    valor: '',
    medio_pago: 'Efectivo',
    proveedor: '',
    descripcion: ''
  });
  const { alert, success, error: showError, warning } = useAlert();

  useEffect(() => {
    fetchData();
  }, [fechaInicio, fechaFin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [egresosRes, categoriasRes] = await Promise.all([
        api.getEgresos(`?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`),
        api.getCategoriasEgreso()
      ]);
      
      setEgresos(egresosRes.data?.egresos || []);
      setTotales({
        total: egresosRes.data?.total || 0,
        cantidad: egresosRes.data?.cantidad || 0
      });
      setCategorias(categoriasRes.data || []);
      
      logger.success('Egresos cargados', `${egresosRes.data?.cantidad || 0} registros`);
    } catch (err) {
      logger.error('Error al cargar egresos', err.message);
      showError(err.message || 'Error al cargar egresos');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.categoria || !formData.valor || !formData.medio_pago) {
      warning('Completa los campos requeridos');
      return;
    }

    setSaving(true);
    try {
      await api.crearEgreso({
        fecha: fechaInicio,
        categoria: parseInt(formData.categoria),
        valor: parseFloat(formData.valor),
        medio_pago: formData.medio_pago,
        proveedor: formData.proveedor || null,
        descripcion: formData.descripcion || null
      });
      
      success('Egreso registrado exitosamente!');
      setFormData({
        categoria: '',
        valor: '',
        medio_pago: 'Efectivo',
        proveedor: '',
        descripcion: ''
      });
      setShowForm(false);
      fetchData();
    } catch (err) {
      logger.error('Error al crear egreso', err.message);
      showError(err.message || 'Error al registrar egreso');
    }
    setSaving(false);
  };

  return (
    <MainLayout title="Egresos">
      {alert && <AlertSimple message={alert.message} type={alert.type} />}

      <div className="page-header">
        <div style={{display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap'}}>
          <Input 
            label="Desde" 
            type="date" 
            value={fechaInicio} 
            onChange={(e) => setFechaInicio(e.target.value)} 
          />
          <Input 
            label="Hasta" 
            type="date" 
            value={fechaFin} 
            onChange={(e) => setFechaFin(e.target.value)} 
          />
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <i className="bi bi-plus-circle"></i> Nuevo Egreso
        </Button>
      </div>

      <div className="stats-grid" style={{marginBottom: '2rem'}}>
        <div className="stat-card stat-danger">
          <div className="stat-icon"><i className="bi bi-cash-stack"></i></div>
          <div className="stat-info">
            <p className="stat-label">Total Egresos</p>
            <p className="stat-value">${totales.total.toLocaleString('es-CO')}</p>
          </div>
        </div>
        <div className="stat-card stat-info">
          <div className="stat-icon"><i className="bi bi-receipt"></i></div>
          <div className="stat-info">
            <p className="stat-label">Cantidad</p>
            <p className="stat-value">{totales.cantidad}</p>
          </div>
        </div>
      </div>

      {showForm && (
        <Card>
          <h4 className="form-title"><i className="bi bi-cash-coin"></i> Registrar Egreso</h4>
          <form onSubmit={handleSubmit} className="form-layout">
            <Select 
              label="Categoría *" 
              value={formData.categoria} 
              onChange={(e) => setFormData({...formData, categoria: e.target.value})} 
              options={categorias} 
              required 
            />
            <Input 
              label="Valor *" 
              type="number" 
              value={formData.valor} 
              onChange={(e) => setFormData({...formData, valor: e.target.value})} 
              min="0"
              step="0.01"
              required 
            />
            <Select 
              label="Medio de Pago *" 
              value={formData.medio_pago} 
              onChange={(e) => setFormData({...formData, medio_pago: e.target.value})} 
              options={[
                {id: 'Efectivo', nombre: 'Efectivo'},
                {id: 'Tarjeta', nombre: 'Tarjeta'},
                {id: 'Transferencia', nombre: 'Transferencia'}
              ]} 
              required 
            />
            <Input 
              label="Proveedor" 
              type="text" 
              value={formData.proveedor} 
              onChange={(e) => setFormData({...formData, proveedor: e.target.value})} 
            />
            <div style={{gridColumn: '1 / -1'}}>
              <Input 
                label="Descripción" 
                type="text" 
                value={formData.descripcion} 
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})} 
              />
            </div>
            <div className="form-actions">
              <Button variant="primary" disabled={saving}>
                {saving ? 'Registrando...' : 'Registrar'}
              </Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <Loading />
      ) : egresos.length > 0 ? (
        <Card>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Categoría</th>
                  <th>Proveedor</th>
                  <th>Valor</th>
                  <th>Medio Pago</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {egresos.map(egr => (
                  <tr key={egr.id}>
                    <td>{new Date(egr.fecha).toLocaleDateString('es-CO')}</td>
                    <td>{egr.categoriaInfo?.nombre || 'N/A'}</td>
                    <td>{egr.proveedor || '-'}</td>
                    <td className="text-danger fw-bold">${parseFloat(egr.valor).toLocaleString('es-CO')}</td>
                    <td>
                      <span className="badge" style={{background: '#FEE2E2', color: '#991B1B'}}>
                        {egr.medio_pago}
                      </span>
                    </td>
                    <td>{egr.descripcion || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Empty message="No hay egresos en el rango seleccionado" />
      )}
    </MainLayout>
  );
}