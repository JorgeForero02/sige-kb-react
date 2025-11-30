import React, { useEffect, useState } from 'react';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { Card, Button, Loading, Empty } from '../components/common/Components';
import { AlertSimple } from '../components/common/AlertSimple';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import '../pages/Pages.css';

export function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState(null);
  const [citasHoy, setCitasHoy] = useState([]);
  const [proximasCitas, setProximasCitas] = useState([]);
  const [resumenMes, setResumenMes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingResumen, setLoadingResumen] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { can } = usePermissions();

  useEffect(() => {
    loadDashboard();
    if (can('VIEW_REPORTES')) {
      loadResumenMes();
    }
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().slice(0, 10);
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

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
        nombre: user?.nombre || 'Usuario',
        rol: user?.rolInfo?.nombre || 'Desconocido',
        totalClientes: responses[0].data?.length || 0,
        totalServicios: responses[1].data?.length || 0,
        totalCitasHoy: responses[2].data?.length || 0,
        citasManana: responses[3].data?.length || 0,
        ingresoHoy: can('VIEW_CAJA') ? (responses[4]?.data?.total || 0) : null,
        egresoHoy: can('VIEW_CAJA') ? (responses[5]?.data?.total || 0) : null
      };

      setData(dashboardData);
      setCitasHoy((responses[2].data || []).slice(0, 5));
      setProximasCitas((responses[3].data || []).slice(0, 3));

    } catch (err) {
      console.error('Error al cargar dashboard:', err);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadResumenMes = async () => {
    try {
      setLoadingResumen(true);
      const hoy = new Date();
      const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

      const fechaInicio = primerDiaMes.toISOString().slice(0, 10);
      const fechaFin = ultimoDiaMes.toISOString().slice(0, 10);

      // Obtener datos del mes actual
      const [
        clientesRes,
        serviciosRes,
        citasRes,
        ingresosRes,
        egresosRes,
        citasMesPasadoRes,
        ingresosMesPasadoRes
      ] = await Promise.all([
        api.getClientes(`?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`),
        api.getServicios(),
        api.getCitas(`?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}&estado=completada`),
        api.getIngresos(`?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`),
        api.getEgresos(`?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`),
        // Datos del mes anterior para comparación
        api.getCitas(`?fecha_inicio=${new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1).toISOString().slice(0, 10)}&fecha_fin=${new Date(hoy.getFullYear(), hoy.getMonth(), 0).toISOString().slice(0, 10)}&estado=completada`),
        api.getIngresos(`?fecha_inicio=${new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1).toISOString().slice(0, 10)}&fecha_fin=${new Date(hoy.getFullYear(), hoy.getMonth(), 0).toISOString().slice(0, 10)}`)
      ]);

      const clientesNuevos = clientesRes.data?.filter(cliente => {
        const fechaCreacion = new Date(cliente.created_at || cliente.fecha_creacion);
        return fechaCreacion >= primerDiaMes && fechaCreacion <= ultimoDiaMes;
      }) || [];

      const serviciosCompletados = citasRes.data || [];
      const totalIngresos = ingresosRes.data?.ingresos || [];
      const totalEgresos = egresosRes.data?.egresos || [];

      // Calcular métricas
      const ingresosTotales = totalIngresos.reduce((sum, ingreso) =>
        sum + parseFloat(ingreso.valor) + parseFloat(ingreso.extra || 0), 0
      );

      const egresosTotales = totalEgresos.reduce((sum, egreso) =>
        sum + parseFloat(egreso.valor), 0
      );

      const gananciaNeta = ingresosTotales - egresosTotales;

      // Calcular comparación con mes anterior
      const serviciosMesPasado = citasMesPasadoRes.data?.length || 0;
      const ingresosMesPasado = ingresosMesPasadoRes.data?.ingresos?.reduce((sum, ingreso) =>
        sum + parseFloat(ingreso.valor) + parseFloat(ingreso.extra || 0), 0
      ) || 0;

      const crecimientoServicios = serviciosMesPasado > 0 ?
        ((serviciosCompletados.length - serviciosMesPasado) / serviciosMesPasado * 100) : 100;

      const crecimientoIngresos = ingresosMesPasado > 0 ?
        ((ingresosTotales - ingresosMesPasado) / ingresosMesPasado * 100) : 100;

      // Calcular efectividad (citas completadas vs totales del mes)
      const citasTotalesMes = await api.getCitas(`?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`);
      const totalCitasMes = citasTotalesMes.data?.length || 0;
      const efectividad = totalCitasMes > 0 ?
        (serviciosCompletados.length / totalCitasMes * 100) : 0;

      setResumenMes({
        clientesNuevos: clientesNuevos.length,
        serviciosRealizados: serviciosCompletados.length,
        ingresosTotales,
        gananciaNeta,
        efectividad: Math.round(efectividad),
        crecimientoServicios: Math.round(crecimientoServicios),
        crecimientoIngresos: Math.round(crecimientoIngresos),
        citasTotales: totalCitasMes
      });

    } catch (err) {
      console.error('Error al cargar resumen del mes:', err);
      // No mostramos error para no afectar la experiencia principal
    } finally {
      setLoadingResumen(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (percent) => {
    return `${percent >= 0 ? '+' : ''}${percent}%`;
  };

  const getEstadoBadge = (estado) => {
    const estados = {
      pendiente: { class: 'badge-pendiente', text: 'Pendiente' },
      confirmada: { class: 'badge-confirmada', text: 'Confirmada' },
      completada: { class: 'badge-completada', text: 'Completada' },
      cancelada: { class: 'badge-cancelada', text: 'Cancelada' }
    };

    const estadoInfo = estados[estado] || estados.pendiente;
    return <span className={`badge ${estadoInfo.class}`}>{estadoInfo.text}</span>;
  };

  const getTrendColor = (value) => {
    return value >= 0 ? '#059669' : '#dc2626'; // Verde para positivo, rojo para negativo
  };

  if (loading) {
    return (
      <div className="page-container">
        <Header />
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <main className="main-content">
          <div className="content">
            <Loading />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Header />
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <main className="main-content">
        <div className="content">
          <button
            className="hamburger content-hamburger"
            onClick={toggleSidebar}
            aria-label="Toggle menu"
          >
            <i className="bi bi-list"></i>
          </button>

          {error && (
            <AlertSimple
              show={true}
              type="error"
              title="Error"
              message={error}
              confirmText="Aceptar"
            />
          )}

          <div className="dashboard-header">
            <div>
              <h1 className="dashboard-title">Dashboard</h1>
              <p className="dashboard-subtitle">
                Bienvenido, {data?.nombre} - {new Date().toLocaleDateString('es-CO', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Estadísticas Principales */}
          <div className="stats-grid">
            <div className="stat-card stat-primary">
              <div className="stat-icon">
                <i className="bi bi-people"></i>
              </div>
              <div className="stat-info">
                <p className="stat-label">Total Clientes</p>
                <p className="stat-value">{data?.totalClientes}</p>
              </div>
            </div>

            <div className="stat-card stat-success">
              <div className="stat-icon">
                <i className="bi bi-briefcase"></i>
              </div>
              <div className="stat-info">
                <p className="stat-label">Servicios Activos</p>
                <p className="stat-value">{data?.totalServicios}</p>
              </div>
            </div>

            <div className="stat-card stat-warning">
              <div className="stat-icon">
                <i className="bi bi-calendar-check"></i>
              </div>
              <div className="stat-info">
                <p className="stat-label">Citas Hoy</p>
                <p className="stat-value">{data?.totalCitasHoy}</p>
              </div>
            </div>

            <div className="stat-card stat-info">
              <div className="stat-icon">
                <i className="bi bi-arrow-right-circle"></i>
              </div>
              <div className="stat-info">
                <p className="stat-label">Citas Mañana</p>
                <p className="stat-value">{data?.citasManana}</p>
              </div>
            </div>

            {data?.ingresoHoy !== null && (
              <>
                <div className="stat-card stat-success">
                  <div className="stat-icon">
                    <i className="bi bi-arrow-down-circle"></i>
                  </div>
                  <div className="stat-info">
                    <p className="stat-label">Ingresos Hoy</p>
                    <p className="stat-value">${formatCurrency(data?.ingresoHoy)}</p>
                  </div>
                </div>

                <div className="stat-card stat-danger">
                  <div className="stat-icon">
                    <i className="bi bi-arrow-up-circle"></i>
                  </div>
                  <div className="stat-info">
                    <p className="stat-label">Egresos Hoy</p>
                    <p className="stat-value">${formatCurrency(data?.egresoHoy)}</p>
                  </div>
                </div>

                <div className={`stat-card ${(data?.ingresoHoy - data?.egresoHoy) >= 0 ? 'stat-success' : 'stat-danger'}`}>
                  <div className="stat-icon">
                    <i className="bi bi-graph-up-arrow"></i>
                  </div>
                  <div className="stat-info">
                    <p className="stat-label">Ganancia Neta</p>
                    <p className="stat-value">${formatCurrency(data?.ingresoHoy - data?.egresoHoy)}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Grid de Contenido */}
          <div className="dashboard-grid">
            {/* Citas de Hoy */}
            <Card>
              <div className="card-header">
                <i className="bi bi-calendar-event" style={{ color: '#F74780' }}></i>
                <h4 className="card-title">Citas de Hoy</h4>
              </div>
              <div className="card-body">
                {citasHoy.length > 0 ? (
                  <div className="citas-list">
                    {citasHoy.map(cita => (
                      <div key={cita.id} className="cita-item">
                        <div className="cita-time">
                          <i className="bi bi-clock"></i>
                          {cita.hora_inicio}
                        </div>
                        <div className="cita-info">
                          <div className="cita-cliente">
                            {cita.clienteInfo?.nombre} {cita.clienteInfo?.apellido}
                          </div>
                          <div className="cita-empleado">
                            <i className="bi bi-person"></i>
                            {cita.encargadoInfo?.nombre}
                          </div>
                          {getEstadoBadge(cita.estado || 'pendiente')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty message="No hay citas para hoy" />
                )}
              </div>
            </Card>

            {/* Próximas Citas */}
            {proximasCitas.length > 0 && (
              <Card>
                <div className="card-header">
                  <i className="bi bi-calendar-date" style={{ color: '#F74780' }}></i>
                  <h4 className="card-title">Próximas Citas</h4>
                </div>
                <div className="card-body">
                  <div className="citas-list">
                    {proximasCitas.map(cita => (
                      <div key={cita.id} className="cita-item">
                        <div className="cita-time">
                          <i className="bi bi-clock"></i>
                          {cita.hora_inicio}
                        </div>
                        <div className="cita-info">
                          <div className="cita-cliente">
                            {cita.clienteInfo?.nombre} {cita.clienteInfo?.apellido}
                          </div>
                          <div className="cita-empleado">
                            <i className="bi bi-person"></i>
                            {cita.encargadoInfo?.nombre}
                          </div>
                          {getEstadoBadge(cita.estado || 'pendiente')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Estadísticas Adicionales para Administradores */}
          {can('VIEW_REPORTES') && (
            <div style={{ marginTop: '2rem' }}>
              <Card>
                <div className="card-header">
                  <i className="bi bi-graph-up" style={{ color: '#F74780' }}></i>
                  <h4 className="card-title">
                    Resumen del Mes {new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
                    {loadingResumen && <small style={{ marginLeft: '0.5rem', color: '#6b7280' }}>(cargando...)</small>}
                  </h4>
                </div>
                <div className="card-body">
                  {resumenMes ? (
                    <div className="stats-grid-compact">
                      <div className="stat-card-compact">
                        <div className="stat-label-compact">Clientes Nuevos</div>
                        <div className="stat-value-compact">{resumenMes.clientesNuevos}</div>
                        <span className="stat-subtitulo">
                          Este mes
                        </span>
                      </div>

                      <div className="stat-card-compact">
                        <div className="stat-label-compact">Servicios Realizados</div>
                        <div className="stat-value-compact">{resumenMes.serviciosRealizados}</div>
                        <span
                          className="stat-subtitulo"
                          style={{ color: getTrendColor(resumenMes.crecimientoServicios) }}
                        >
                          {formatPercent(resumenMes.crecimientoServicios)} vs mes anterior
                        </span>
                      </div>

                      <div className="stat-card-compact">
                        <div className="stat-label-compact">Ingresos Totales</div>
                        <div className="stat-value-compact">${formatCurrency(resumenMes.ingresosTotales)}</div>
                        <span
                          className="stat-subtitulo"
                          style={{ color: getTrendColor(resumenMes.crecimientoIngresos) }}
                        >
                          {formatPercent(resumenMes.crecimientoIngresos)} vs mes anterior
                        </span>
                      </div>

                      <div className="stat-card-compact">
                        <div className="stat-label-compact">Ganancia Neta</div>
                        <div className="stat-value-compact">${formatCurrency(resumenMes.gananciaNeta)}</div>
                        <span className="stat-subtitulo">
                          {resumenMes.efectividad}% de efectividad
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                      <i className="bi bi-graph-up" style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block' }}></i>
                      {loadingResumen ? 'Cargando datos del mes...' : 'No hay datos disponibles para el mes actual'}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}