import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { logger } from '../services/logger';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, Button, Input, Select, Loading, Empty } from '../components/common/Components';
import { AlertSimple } from '../components/common/AlertSimple';
import { useAlert } from '../hooks/useAlert';
import '../pages/Pages.css';

function ModalIngreso({ show, onClose, usuarios, servicios, onSuccess }) {
  const [formData, setFormData] = useState({
    servicio: '',
    empleado: '',
    valor: '',
    extra: '',
    medio_pago: 'Efectivo',
    nota: ''
  });
  const [saving, setSaving] = useState(false);
  const { alert, success, error: showError } = useAlert();

  const empleados = usuarios.filter(usuario =>
    usuario.rolInfo?.nombre === 'Empleado'
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.servicio || !formData.empleado || !formData.valor) {
      showError('Completa los campos requeridos');
      return;
    }

    setSaving(true);
    try {
      await api.crearIngreso({
        fecha: new Date().toISOString().slice(0, 10),
        servicio: parseInt(formData.servicio),
        empleado: parseInt(formData.empleado),
        valor: parseFloat(formData.valor),
        extra: parseFloat(formData.extra || 0),
        medio_pago: formData.medio_pago,
        nota: formData.nota || null
      });

      success('Ingreso registrado exitosamente!');
      setFormData({
        servicio: '',
        empleado: '',
        valor: '',
        extra: '',
        medio_pago: 'Efectivo',
        nota: ''
      });
      onSuccess();
      onClose();
    } catch (err) {
      logger.error('Error al crear ingreso', err.message);
      showError(err.message || 'Error al registrar ingreso');
    }
    setSaving(false);
  };

  const handleClose = () => {
    setFormData({
      servicio: '',
      empleado: '',
      valor: '',
      extra: '',
      medio_pago: 'Efectivo',
      nota: ''
    });
    onClose();
  };

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
      <div className="card-component" style={{
        width: '90%',
        maxWidth: '500px',
        maxHeight: '90vh', // Altura máxima del 90% de la ventana
        display: 'flex',
        flexDirection: 'column',
        margin: '1rem'
      }}>
        {/* Header fijo */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem 2rem',
          borderBottom: '2px solid var(--border)',
          flexShrink: 0 // Evita que se encoja
        }}>
          <h4 style={{ margin: 0, fontWeight: '700', color: 'var(--dark)' }}>
            <i className="bi bi-plus-circle"></i> Nuevo Ingreso
          </h4>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--gray)',
              padding: 0,
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%'
            }}
          >
            ×
          </button>
        </div>

        {/* Contenido desplazable */}
        <div style={{
          padding: '2rem',
          overflowY: 'auto',
          flex: 1 
        }}>
          {alert && <AlertSimple message={alert.message} type={alert.type} />}

          <form onSubmit={handleSubmit} className="form-layout">
            <Select
              label="Servicio *"
              value={formData.servicio}
              onChange={(e) => setFormData({ ...formData, servicio: e.target.value })}
              options={servicios}
              required
            />
            <Select
              label="Empleado *"
              value={formData.empleado}
              onChange={(e) => setFormData({ ...formData, empleado: e.target.value })}
              options={empleados}
              required
            />
            <Input
              label="Valor *"
              type="number"
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              min="0"
              step="0.01"
              required
            />
            <Input
              label="Extra"
              type="number"
              value={formData.extra}
              onChange={(e) => setFormData({ ...formData, extra: e.target.value })}
              min="0"
              step="0.01"
            />
            <Select
              label="Medio de Pago *"
              value={formData.medio_pago}
              onChange={(e) => setFormData({ ...formData, medio_pago: e.target.value })}
              options={[
                { id: 'Efectivo', nombre: 'Efectivo' },
                { id: 'Tarjeta', nombre: 'Tarjeta' },
                { id: 'Transferencia', nombre: 'Transferencia' },
                { id: 'Bizum', nombre: 'Bizum' }
              ]}
              required
            />
            <div style={{ gridColumn: '1 / -1' }}>
              <Input
                label="Nota"
                type="text"
                value={formData.nota}
                onChange={(e) => setFormData({ ...formData, nota: e.target.value })}
                placeholder="Observaciones adicionales..."
              />
            </div>
            <div className="form-actions" style={{
              position: 'sticky',
              bottom: 0,
              background: 'white',
              paddingTop: '1rem',
              marginTop: '1rem',
              borderTop: '1px solid var(--border)'
            }}>
              <Button variant="primary" disabled={saving}>
                {saving ? 'Registrando...' : 'Registrar Ingreso'}
              </Button>
              <Button variant="secondary" onClick={handleClose}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function IngresosPage() {
  const [ingresos, setIngresos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().slice(0, 10));
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().slice(0, 10));
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totales, setTotales] = useState({ total: 0, cantidad: 0 });
  const { alert, success, error: showError } = useAlert();

  useEffect(() => {
    fetchData();
  }, [fechaInicio, fechaFin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ingresosRes, usuariosRes, serviciosRes] = await Promise.all([
        api.getIngresos(`?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`),
        api.getUsuarios(),
        api.getServicios()
      ]);

      const serviciosData = serviciosRes.data || [];
      const usuariosData = usuariosRes.data || [];
      const ingresosData = ingresosRes.data?.ingresos || [];
      const total = ingresosData.reduce((sum, ing) => sum + (parseFloat(ing.valor) + parseFloat(ing.extra || 0)), 0);
      const cantidad = ingresosData.length;

      setIngresos(ingresosData);
      setUsuarios(usuariosData);
      setServicios(serviciosData);
      setTotales({ total, cantidad });

      console.log('Todos los usuarios:', usuariosData);
      const empleadosCount = usuariosData.filter(u => u.rolInfo?.nombre === 'Empleado').length;
      console.log('Empleados encontrados:', empleadosCount);

      logger.success('Ingresos cargados', `${cantidad} registros, ${empleadosCount} empleados`);

    } catch (err) {
      logger.error('Error al cargar ingresos', err.message);
      showError(err.message || 'Error al cargar ingresos');
    }
    setLoading(false);
  };

  const handleNuevoIngreso = () => {
    setShowModal(true);
  };

  return (
    <MainLayout title="Ingresos">
      {alert && <AlertSimple message={alert.message} type={alert.type} />}

      <div className="page-header">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Button variant="primary" onClick={handleNuevoIngreso}>
            <i className="bi bi-plus-circle"></i> Nuevo Ingreso
          </Button>
          <Button onClick={fetchData}>
            <i className="bi bi-arrow-clockwise"></i> Actualizar
          </Button>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card stat-success">
          <div className="stat-icon"><i className="bi bi-cash-stack"></i></div>
          <div className="stat-info">
            <p className="stat-label">Total Ingresos</p>
            <p className="stat-value">${totales.total.toLocaleString('es-CO')}</p>
          </div>
        </div>
        <div className="stat-card stat-primary">
          <div className="stat-icon"><i className="bi bi-receipt"></i></div>
          <div className="stat-info">
            <p className="stat-label">Cantidad</p>
            <p className="stat-value">{totales.cantidad}</p>
          </div>
        </div>
      </div>

      <ModalIngreso
        show={showModal}
        onClose={() => setShowModal(false)}
        usuarios={usuarios}
        servicios={servicios}
        onSuccess={fetchData}
      />

      {loading ? (
        <Loading />
      ) : ingresos.length > 0 ? (
        <Card>
          <div className="card-header">
            <h3 className="card-title">
              <i className="bi bi-list-check"></i>
              Registros de Ingresos
            </h3>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha/Nota</th>
                  <th>Servicio</th>
                  <th>Empleado</th>
                  <th>Medio de Pago</th>
                  <th>Importe</th>
                </tr>
              </thead>
              <tbody>
                {ingresos.map(ingreso => (
                  <tr key={ingreso.id}>
                    <td>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem'
                      }}>
                        <span style={{
                          fontWeight: '600',
                          color: 'var(--dark)'
                        }}>
                          {new Date(ingreso.fecha).toLocaleDateString('es-CO')}
                          {ingreso.created_at && (
                            <span style={{
                              fontSize: '0.875rem',
                              color: 'var(--gray)',
                              marginLeft: '0.5rem'
                            }}>
                              {new Date(ingreso.created_at).toLocaleTimeString('es-CO', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </span>
                        {ingreso.nota && (
                          <span style={{
                            fontSize: '0.875rem',
                            color: 'var(--gray)',
                            fontStyle: 'italic'
                          }}>
                            {ingreso.nota}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{ingreso.servicioInfo?.nombre}</td>
                    <td>
                      {ingreso.empleadoInfo?.nombre} {ingreso.empleadoInfo?.apellido}
                    </td>
                    <td>
                      <span className="badge" style={{
                        background: ingreso.medio_pago === 'Efectivo' ? '#d1fae5' :
                          ingreso.medio_pago === 'Tarjeta' ? '#dbeafe' :
                            ingreso.medio_pago === 'Transferencia' ? '#f3e8ff' : '#fce7f3',
                        color: ingreso.medio_pago === 'Efectivo' ? '#065f46' :
                          ingreso.medio_pago === 'Tarjeta' ? '#1e40af' :
                            ingreso.medio_pago === 'Transferencia' ? '#7c3aed' : '#be185d'
                      }}>
                        {ingreso.medio_pago}
                      </span>
                    </td>
                    <td style={{
                      fontWeight: '700',
                      fontSize: '1.1rem',
                      color: '#10b981'
                    }}>
                      +${(parseFloat(ingreso.valor) + parseFloat(ingreso.extra || 0)).toLocaleString('es-CO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Empty message="No hay ingresos en el rango seleccionado" />
      )}
    </MainLayout>
  );
}