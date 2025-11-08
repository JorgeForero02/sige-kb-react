import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { logger } from '../services/logger';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, Button, Input, Loading, Empty } from '../components/common/Components';
import { AlertSimple } from '../components/common/AlertSimple';
import { useAlert } from '../hooks/useAlert';
import '../pages/Pages.css';

export function IngresosPage() {
  const [ingresos, setIngresos] = useState([]);
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().slice(0, 10));
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [totales, setTotales] = useState({ total: 0, cantidad: 0 });
  const { alert, success, error: showError } = useAlert();

  useEffect(() => {
    fetchIngresos();
  }, [fechaInicio, fechaFin]);

  const fetchIngresos = async () => {
    setLoading(true);
    try {
      const res = await api.getIngresos(`?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`);
      setIngresos(res.data?.ingresos || []);
      setTotales({
        total: res.data?.total || 0,
        cantidad: res.data?.cantidad || 0
      });
      logger.success('Ingresos cargados', `${res.data?.cantidad || 0} registros`);
    } catch (err) {
      logger.error('Error al cargar ingresos', err.message);
      showError(err.message || 'Error al cargar ingresos');
    }
    setLoading(false);
  };

  return (
    <MainLayout title="Ingresos">
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
        <Button onClick={fetchIngresos}>
          <i className="bi bi-arrow-clockwise"></i> Actualizar
        </Button>
      </div>

      <div className="stats-grid" style={{marginBottom: '2rem'}}>
        <div className="stat-card stat-success">
          <div className="stat-icon"><i className="bi bi-cash-stack"></i></div>
          <div className="stat-info">
            <p className="stat-label">Total Ingresos</p>
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

      {loading ? (
        <Loading />
      ) : ingresos.length > 0 ? (
        <Card>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Servicio</th>
                  <th>Empleado</th>
                  <th>Valor</th>
                  <th>Extra</th>
                  <th>Total</th>
                  <th>Medio Pago</th>
                </tr>
              </thead>
              <tbody>
                {ingresos.map(ing => (
                  <tr key={ing.id}>
                    <td>{new Date(ing.fecha).toLocaleDateString('es-CO')}</td>
                    <td>{ing.servicioInfo?.nombre || 'N/A'}</td>
                    <td>{ing.empleadoInfo?.nombre} {ing.empleadoInfo?.apellido}</td>
                    <td className="text-success">${parseFloat(ing.valor).toLocaleString('es-CO')}</td>
                    <td>{ing.extra > 0 ? `$${parseFloat(ing.extra).toLocaleString('es-CO')}` : '-'}</td>
                    <td className="text-success fw-bold">
                      ${(parseFloat(ing.valor) + parseFloat(ing.extra || 0)).toLocaleString('es-CO')}
                    </td>
                    <td>
                      <span className="badge" style={{background: '#E0F2FE', color: '#0284C7'}}>
                        {ing.medio_pago}
                      </span>
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