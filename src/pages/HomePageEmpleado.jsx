import React, { useState, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { Card, Loading } from '../components/common/Components';
import { AlertSimple } from '../components/common/AlertSimple';
import { useAlert } from '../hooks/useAlert';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import '../pages/Pages.css';

export function HomePageEmpleado() {
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('resumen');

    // Estados para datos
    const [servicios, setServicios] = useState([]);
    const [citas, setCitas] = useState([]);
    const [nominas, setNominas] = useState([]);
    const [stats, setStats] = useState({
        totalServicios: 0,
        citasHoy: 0,
        citasPendientes: 0,
        totalGanado: 0
    });

    const { alert, error: showError } = useAlert();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Obtener agenda del empleado para extraer servicios
            const agendaRes = await api.getAgendaEmpleado(user.id);
            if (agendaRes.success) {
                const citasData = agendaRes.data || [];
                setCitas(citasData);
                
                // Obtener servicios únicos desde las citas (misma lógica que ServiciosEmpleadoPage)
                const serviciosUnicos = obtenerServiciosUnicosDesdeCitas(citasData);
                const serviciosConCategoria = await obtenerInformacionCompletaServicios(serviciosUnicos);
                
                setServicios(serviciosConCategoria);
            }

            // Obtener nóminas del empleado
            const nominasRes = await api.getNominas();
            if (nominasRes.success) {
                setNominas(nominasRes.data || []);
            }

            // Calcular estadísticas
            const citasHoy = agendaRes.data?.filter(cita =>
                cita.fecha === new Date().toISOString().split('T')[0]
            ).length || 0;

            const citasPendientes = agendaRes.data?.filter(cita =>
                cita.estado === 'pendiente'
            ).length || 0;

            const totalGanado = nominasRes.data?.reduce((total, nomina) =>
                total + parseFloat(nomina.total || 0), 0
            ) || 0;

            setStats({
                totalServicios: servicios.length,
                citasHoy,
                citasPendientes,
                totalGanado
            });

        } catch (err) {
            showError(err.message || 'Error al cargar datos del dashboard');
        }
        setLoading(false);
    };

    // Función para obtener servicios únicos desde citas (igual que en ServiciosEmpleadoPage)
    const obtenerServiciosUnicosDesdeCitas = (citas) => {
        if (!citas || citas.length === 0) {
            return [];
        }

        const serviciosMap = new Map();

        citas.forEach(cita => {
            if (cita.servicioInfo && cita.servicioInfo.id) {
                const servicioId = cita.servicioInfo.id;

                if (!serviciosMap.has(servicioId)) {
                    serviciosMap.set(servicioId, {
                        id: servicioId,
                        nombre: cita.servicioInfo.nombre || 'Sin nombre',
                        descripcion: cita.servicioInfo.descripcion || '',
                        precio: Math.abs(parseFloat(cita.servicioInfo.precio)) || 0,
                        duracion: cita.servicioInfo.duracion || cita.duracion || 0,
                        porcentaje: cita.servicioInfo.porcentaje || null,
                        estado: 'ACTIVO'
                    });
                }
            }
        });

        return Array.from(serviciosMap.values());
    };

    // Función para obtener información completa de servicios
    const obtenerInformacionCompletaServicios = async (serviciosBasicos) => {
        if (!serviciosBasicos || serviciosBasicos.length === 0) {
            return [];
        }

        try {
            const serviciosCompletos = await Promise.all(
                serviciosBasicos.map(async (servicio) => {
                    try {
                        const res = await api.getServiciosById(servicio.id);
                        const servicioCompleto = res.data;

                        return {
                            ...servicio,
                            categoriaInfo: servicioCompleto.categoriaInfo || { nombre: '-' }
                        };
                    } catch (error) {
                        return {
                            ...servicio,
                            categoriaInfo: { nombre: '-' }
                        };
                    }
                })
            );

            return serviciosCompletos;
        } catch (error) {
            return serviciosBasicos.map(servicio => ({
                ...servicio,
                categoriaInfo: { nombre: '-' }
            }));
        }
    };

    const formatCurrency = (amount) => {
        if (!amount) return '$0';
        const numericAmount = parseFloat(amount);
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(numericAmount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '-';
            return date.toLocaleDateString('es-ES');
        } catch (error) {
            return '-';
        }
    };

    const getProximaCita = () => {
        const hoy = new Date().toISOString().split('T')[0];
        const citasFuturas = citas.filter(cita =>
            cita.fecha >= hoy && cita.estado !== 'cancelada'
        ).sort((a, b) => {
            if (a.fecha === b.fecha) {
                return a.hora_inicio.localeCompare(b.hora_inicio);
            }
            return a.fecha.localeCompare(b.fecha);
        });

        return citasFuturas.length > 0 ? citasFuturas[0] : null;
    };

    const proximaCita = getProximaCita();

    if (loading) {
        return (
            <div className="app-layout">
                <Header />
                <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
                <main className="content">
                    <div className="content-wrapper">
                        <div className="page-container">
                            <Loading />
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            <Header />
            <div className="dashboard-container">
                <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
                <div className="main-content">
                    <button
                        className="hamburger content-hamburger"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <i className="bi bi-list"></i>
                    </button>

                    <div className="page-container">
                        {/* Header del dashboard */}
                        <div className="dashboard-header">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <div>
                                    <h1 className="dashboard-title">Mi Dashboard</h1>
                                    <p className="dashboard-subtitle">
                                        Bienvenido/a, {user?.nombre || 'Empleado'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {alert && <AlertSimple message={alert.message} type={alert.type} />}

                        {activeSection === 'resumen' ? (
                            <>
                                {/* Estadísticas rápidas */}
                                <div className="stats-grid-compact mb-4">
                                    <div className="stat-card-compact">
                                        <div className="stat-label-compact">Servicios en Citas</div>
                                        <div className="stat-value-compact">{stats.totalServicios}</div>
                                    </div>
                                    <div className="stat-card-compact">
                                        <div className="stat-label-compact">Citas Hoy</div>
                                        <div className="stat-value-compact">{stats.citasHoy}</div>
                                    </div>
                                    <div className="stat-card-compact">
                                        <div className="stat-label-compact">Citas Pendientes</div>
                                        <div className="stat-value-compact">{stats.citasPendientes}</div>
                                    </div>
                                    <div className="stat-card-compact">
                                        <div className="stat-label-compact">Total Ganado</div>
                                        <div className="stat-value-compact">{formatCurrency(stats.totalGanado)}</div>
                                    </div>
                                </div>

                                <div className="dashboard-grid">
                                    {/* Próxima cita */}
                                    <Card>
                                        <div className="card-header">
                                            <h3 className="title">Próxima Cita</h3>
                                        </div>
                                        <div className="card-body">
                                            {proximaCita ? (
                                                <div className="cita-item">
                                                    <div className="cita-time">
                                                        <i className="bi bi-clock"></i>
                                                        {proximaCita.hora_inicio.substring(0, 5)}
                                                    </div>
                                                    <div className="cita-info">
                                                        <div className="cita-cliente">
                                                            {proximaCita.clienteInfo?.nombre} {proximaCita.clienteInfo?.apellido}
                                                        </div>
                                                        <div className="cita-empleado">
                                                            <i className="bi bi-scissors"></i>
                                                            {proximaCita.servicioInfo?.nombre}
                                                        </div>
                                                        <span className={`badge badge-${proximaCita.estado}`}>
                                                            {proximaCita.estado === 'pendiente' ? 'Programada' :
                                                                proximaCita.estado === 'confirmada' ? 'Confirmada' :
                                                                    proximaCita.estado}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="empty-text">No hay citas programadas</p>
                                            )}
                                        </div>
                                    </Card>

                                    {/* Mis servicios destacados */}
                                    <Card>
                                        <div className="card-header">
                                            <h3 className="title">Mis Servicios en Citas</h3>
                                        </div>
                                        <div className="card-body">
                                            {servicios.length > 0 ? (
                                                <div className="servicios-list">
                                                    {servicios.slice(0, 4).map(servicio => (
                                                        <div key={servicio.id} className="servicio-item">
                                                            <div className="servicio-nombre">
                                                                <strong>{servicio.nombre}</strong>
                                                                {servicio.categoriaInfo?.nombre && (
                                                                    <small className="text-muted d-block">
                                                                        {servicio.categoriaInfo.nombre}
                                                                    </small>
                                                                )}
                                                            </div>
                                                            <div className="servicio-info">
                                                                <span>{servicio.duracion} min</span>
                                                                <span style={{ color: '#059669', fontWeight: '600' }}>
                                                                    ${servicio.precio?.toLocaleString('es-CO')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {servicios.length > 4 && (
                                                        <div className="text-center mt-2">
                                                            <small className="text-muted">
                                                                +{servicios.length - 4} servicios más
                                                            </small>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="empty-text">No tienes servicios en tus citas</p>
                                            )}
                                        </div>
                                    </Card>

                                    {/* Últimas nóminas */}
                                    <Card>
                                        <div className="card-header">
                                            <h3 className="title">Últimas Nóminas</h3>
                                        </div>
                                        <div className="card-body">
                                            {nominas.length > 0 ? (
                                                <div className="nominas-list">
                                                    {nominas.slice(0, 2).map(nomina => (
                                                        <div key={nomina.id} className="nomina-item">
                                                            <div className="nomina-periodo">
                                                                {formatDate(nomina.fecha_inicio)} - {formatDate(nomina.fecha_fin)}
                                                            </div>
                                                            <div className={`nomina-total ${parseFloat(nomina.total || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                                                                {formatCurrency(nomina.total)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {nominas.length > 2 && (
                                                        <div className="text-center mt-2">
                                                            <small className="text-muted">
                                                                +{nominas.length - 2} nóminas más
                                                            </small>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="empty-text">No hay nóminas registradas</p>
                                            )}
                                        </div>
                                    </Card>
                                </div>
                            </>
                        ) : (
                            /* Vista de servicios detallada */
                            <div className="table-container">
                                <Card>
                                    <div className="card-header">
                                        <h3 className="title">Mis Servicios en Citas</h3>
                                        <p className="card-subtitle">
                                            Servicios obtenidos de tus citas asignadas
                                        </p>
                                    </div>
                                    <div className="table-responsive">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Servicio</th>
                                                    <th>Categoría</th>
                                                    <th>Descripción</th>
                                                    <th>Duración</th>
                                                    <th>Precio</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {servicios.map(servicio => (
                                                    <tr key={servicio.id}>
                                                        <td>
                                                            <strong>{servicio.nombre}</strong>
                                                        </td>
                                                        <td>
                                                            {servicio.categoriaInfo?.nombre || '-'}
                                                        </td>
                                                        <td style={{ maxWidth: '200px' }}>
                                                            <span style={{
                                                                color: '#6B7280',
                                                                fontSize: '0.85rem',
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient: 'vertical',
                                                                overflow: 'hidden'
                                                            }}>
                                                                {servicio.descripcion || 'Sin descripción'}
                                                            </span>
                                                        </td>
                                                        <td style={{ fontWeight: '500' }}>
                                                            {servicio.duracion} min
                                                        </td>
                                                        <td style={{ fontWeight: '600', color: '#059669' }}>
                                                            ${servicio.precio?.toLocaleString('es-CO')}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}