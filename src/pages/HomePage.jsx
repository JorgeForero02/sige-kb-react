import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { logger } from '../services/logger';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, Loading, Alert } from '../components/common/Components';
import { usePermissions } from '../hooks/usePermissions';
import '../pages/Pages.css';

export function HomePage() {
  const [data, setData] = useState(null);
  const [citasHoy, setCitasHoy] = useState([]);
  const [proximasCitas, setProximasCitas] = useState([]);
  const [error, setError] = useState('');
  const { rol, can } = usePermissions();

  useEffect(() => {
    loadDashboard();
  }, [rol]);

  const loadDashboard = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      const profile = await api.getProfile();

      const requests = [
        api.getClientes(),
        api.getServicios(),
        api.getCitas(`?fecha_inicio=${today}&fecha_fin=${today}`),
        api.getCitas(`?fecha_inicio=${tomorrow}&fecha_fin=${tomorrow}`)
      ];

      if (can('VIEW_CAJA')) {
        requests.push(api.getTotalIngresosDia(today));
        requests.push(api.getTotalEgresosDia(today));
      }

      const responses = await Promise.all(requests);

      const dashboardData = {
        nombre: profile.data?.nombre || 'Usuario',
        rol: profile.data?.rolInfo?.nombre || 'Desconocido',
        totalClientes: responses[0].data?.length || 0,
        totalServicios: responses[1].data?.length || 0,
        totalCitasHoy: responses[2].data?.length || 0,
        citasMañana: responses[3].data?.length || 0,
        ingresoHoy: can('VIEW_CAJA') ? (responses[4]?.data?.total || 0) : null,
        egresoHoy: can('VIEW_CAJA') ? (responses[5]?.data?.total || 0) : null
      };

      setData(dashboardData);
      setCitasHoy((responses[2].data || []).slice(0, 5));
      setProximasCitas((responses[3].data || []).slice(0, 3));
      
      logger.success('Dashboard cargado', `${dashboardData.totalCitasHoy} citas hoy`);
    } catch (err) {
      logger.error('Error al cargar dashboard', err.message);
      setError('Error al cargar datos: ' + err.message);
    }
  };

  if (!data) return <MainLayout title="Dashboard"><Loading /></MainLayout>;

  return (
    <MainLayout title="Dashboard">
      {error && <Alert type="danger">{error}</Alert>}

      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">Bienvenido, {data.nombre}</h2>
          <p className="dashboard-subtitle">
            {data.rol} | {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-icon"><i className="bi bi-people"></i></div>
          <div className="stat-info">
            <p className="stat-label">Clientes</p>
            <p className="stat-value">{data.totalClientes}</p>
          </div>
        </div>
        <div className="stat-card stat-success">
          <div className="stat-icon"><i className="bi bi-briefcase"></i></div>
          <div className="stat-info">
            <p className="stat-label">Servicios</p>
            <p className="stat-value">{data.totalServicios}</p>
          </div>
        </div>
        <div className="stat-card stat-warning">
          <div className="stat-icon"><i className="bi bi-calendar-check"></i></div>
          <div className="stat-info">
            <p className="stat-label">Citas Hoy</p>
            <p className="stat-value">{data.totalCitasHoy}</p>
          </div>
        </div>
        <div className="stat-card stat-info">
          <div className="stat-icon"><i className="bi bi-arrow-right-circle"></i></div>
          <div className="stat-info">
            <p className="stat-label">Mañana</p>
            <p className="stat-value">{data.citasMañana}</p>
          </div>
        </div>
        {data.ingresoHoy !== null && (
          <>
            <div className="stat-card stat-success">
              <div className="stat-icon"><i className="bi bi-cash-coin"></i></div>
              <div className="stat-info">
                <p className="stat-label">Ingresos</p>
                <p className="stat-value">${data.ingresoHoy}</p>
              </div>
            </div>
            <div className="stat-card stat-danger">
              <div className="stat-icon"><i className="bi bi-arrow-up-circle"></i></div>
              <div className="stat-info">
                <p className="stat-label">Egresos</p>
                <p className="stat-value">${data.egresoHoy}</p>
              </div>
            </div>
            <div className={`stat-card stat-${data.ingresoHoy - data.egresoHoy >= 0 ? 'success' : 'danger'}`}>
              <div className="stat-icon"><i className="bi bi-graph-up"></i></div>
              <div className="stat-info">
                <p className="stat-label">Ganancia</p>
                <p className="stat-value">${data.ingresoHoy - data.egresoHoy}</p>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="dashboard-grid">
        <Card>
          <div className="card-header">
            <i className="bi bi-calendar-event"></i>
            <h4 className="card-title">Citas de Hoy</h4>
          </div>
          {citasHoy.length > 0 ? (
            <div className="citas-list">
              {citasHoy.map(cita => (
                <div key={cita.id} className="cita-item">
                  <div className="cita-time">
                    <i className="bi bi-clock"></i> {cita.hora_inicio}
                  </div>
                  <div className="cita-info">
                    <div className="cita-cliente">{cita.clienteInfo?.nombre} {cita.clienteInfo?.apellido}</div>
                    <div className="cita-empleado">
                      <i className="bi bi-person"></i> {cita.encargadoInfo?.nombre}
                    </div>
                  </div>
                  <span className="badge" style={{background: '#E0F2FE', color: '#0284C7'}}>Pendiente</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-text">Sin citas para hoy</p>
          )}
        </Card>

        {proximasCitas.length > 0 && (
          <Card>
            <div className="card-header">
              <i className="bi bi-calendar-date"></i>
              <h4 className="card-title">Próximas Citas</h4>
            </div>
            <div className="citas-list">
              {proximasCitas.map(cita => (
                <div key={cita.id} className="cita-item">
                  <div className="cita-time">
                    <i className="bi bi-clock"></i> {cita.hora_inicio}
                  </div>
                  <div className="cita-info">
                    <div className="cita-cliente">{cita.clienteInfo?.nombre} {cita.clienteInfo?.apellido}</div>
                    <div className="cita-empleado">
                      <i className="bi bi-person"></i> {cita.encargadoInfo?.nombre}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}