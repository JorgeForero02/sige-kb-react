import React, { useState, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { Modal } from '../components/common/Modal';
import apiClient from '../services/api';
import { useAuth } from '../hooks/useAuth';
import '../pages/Pages.css';

export const AgendaEmpleadoPage = () => {
    const { user } = useAuth();
    const [citas, setCitas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filtroEstado, setFiltroEstado] = useState('todas');
    const [filtroFecha, setFiltroFecha] = useState('');
    const [modalAbierto, setModalAbierto] = useState(false);
    const [citaSeleccionada, setCitaSeleccionada] = useState(null);

    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        cargarAgenda();
    }, []);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    const cargarAgenda = async () => {
        try {
            setLoading(true);
            const response = await apiClient.getAgendaEmpleado(user.id);

            if (response.success) {
                setCitas(response.data);
            } else {
                setError('Error al cargar la agenda');
            }
        } catch (err) {
            setError('Error de conexión al cargar la agenda');
            console.error('Error cargando agenda:', err);
        } finally {
            setLoading(false);
        }
    };

    // Función para abrir el modal de detalles
    const abrirModalDetalles = (cita) => {
        setCitaSeleccionada(cita);
        setModalAbierto(true);
    };

    // Función para cerrar el modal
    const cerrarModal = () => {
        setModalAbierto(false);
        setCitaSeleccionada(null);
    };

    // Filtrar citas según los filtros aplicados
    const citasFiltradas = citas.filter(cita => {
        const coincideEstado = filtroEstado === 'todas' || cita.estado === filtroEstado;
        const coincideFecha = !filtroFecha || cita.fecha === filtroFecha;
        return coincideEstado && coincideFecha;
    });

    // Agrupar citas por fecha
    const citasPorFecha = citasFiltradas.reduce((grupos, cita) => {
        const fecha = cita.fecha;
        if (!grupos[fecha]) {
            grupos[fecha] = [];
        }
        grupos[fecha].push(cita);
        return grupos;
    }, {});

    // Ordenar fechas
    const fechasOrdenadas = Object.keys(citasPorFecha).sort();

    // Formatear fecha en español
    const formatearFecha = (fecha) => {
        const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', opciones);
    };

    const getBadgeClass = (estado) => {
        switch (estado) {
            case 'pendiente': return 'badge badge-pendiente';
            case 'confirmada': return 'badge badge-confirmada';
            case 'completada': return 'badge badge-completada';
            case 'cancelada': return 'badge badge-cancelada';
            default: return 'badge';
        }
    };

    // Traducir estado
    const traducirEstado = (estado) => {
        const estados = {
            'pendiente': 'Pendiente',
            'confirmada': 'Confirmada',
            'completada': 'Completada',
            'cancelada': 'Cancelada'
        };
        return estados[estado] || estado;
    };

    // Formatear hora
    const formatearHora = (hora) => {
        return hora.substring(0, 5); // Quita los segundos
    };

    if (loading) {
        return (
            <div className="dashboard-layout">
                <Header />
                <div className="dashboard-container">
                    <Sidebar />
                    <div className="main-content">
                        <div className="content-area">
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Cargando agenda...</span>
                                </div>
                                <p className="mt-2">Cargando tu agenda...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            <Header />
            <div className="dashboard-container">
                <Sidebar
                    isOpen={sidebarOpen}
                    setIsOpen={setSidebarOpen} 
                />
                <div className="main-content">
                    <div className="content-area">
                        <button
                            className="hamburger content-hamburger"
                            onClick={toggleSidebar}
                            aria-label="Toggle menu"
                        >
                            <i className="bi bi-list"></i>
                        </button>
                        <div className="dashboard-header">
                            <h1 className="dashboard-title">Mi Agenda</h1>
                            <p className="dashboard-subtitle">
                                Gestiona tus citas y horarios programados
                            </p>
                        </div>

                        {/* Filtros */}
                        <div className="citas-filters">
                            <div className="row g-3 align-items-center">
                                <div className="col-auto">
                                    <label htmlFor="filtroEstado" className="form-label mb-0">
                                        <strong>Filtrar por estado:</strong>
                                    </label>
                                </div>
                                <div className="col-auto">
                                    <select
                                        id="filtroEstado"
                                        className="form-select"
                                        value={filtroEstado}
                                        onChange={(e) => setFiltroEstado(e.target.value)}
                                    >
                                        <option value="todas">Todas las citas</option>
                                        <option value="pendiente">Programada</option>
                                        <option value="confirmada">Confirmadas</option>
                                        <option value="completada">Atendida</option>
                                        <option value="cancelada">Canceladas</option>
                                    </select>
                                </div>

                                <div className="col-auto">
                                    <label htmlFor="filtroFecha" className="form-label mb-0">
                                        <strong>Filtrar por fecha:</strong>
                                    </label>
                                </div>
                                <div className="col-auto">
                                    <input
                                        type="date"
                                        id="filtroFecha"
                                        className="form-control"
                                        value={filtroFecha}
                                        onChange={(e) => setFiltroFecha(e.target.value)}
                                    />
                                </div>

                                <div className="col-auto">
                                    <button
                                        className="btn btn-outline-secondary"
                                        onClick={() => {
                                            setFiltroEstado('todas');
                                            setFiltroFecha('');
                                        }}
                                    >
                                        Limpiar filtros
                                    </button>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="alert alert-danger" role="alert">
                                {error}
                            </div>
                        )}

                        {/* Estadísticas rápidas */}
                        <div className="stats-grid-compact mb-4">
                            <div className="stat-card-compact">
                                <div className="stat-label-compact">Total Citas</div>
                                <div className="stat-value-compact">{citas.length}</div>
                            </div>
                            <div className="stat-card-compact">
                                <div className="stat-label-compact">Confirmadas</div>
                                <div className="stat-value-compact">
                                    {citas.filter(c => c.estado === 'confirmada').length}
                                </div>
                            </div>
                            <div className="stat-card-compact">
                                <div className="stat-label-compact">Pendientes</div>
                                <div className="stat-value-compact">
                                    {citas.filter(c => c.estado === 'pendiente').length}
                                </div>
                            </div>
                            <div className="stat-card-compact">
                                <div className="stat-label-compact">Hoy</div>
                                <div className="stat-value-compact">
                                    {citas.filter(c => c.fecha === new Date().toISOString().split('T')[0]).length}
                                </div>
                            </div>
                        </div>

                        {/* Lista de citas agrupadas por fecha */}
                        {fechasOrdenadas.length === 0 ? (
                            <div className="text-center py-5">
                                <div className="empty-text">
                                    <i className="bi bi-calendar-x" style={{ fontSize: '3rem', color: '#6b7280', marginBottom: '1rem' }}></i>
                                    <h4>No hay citas programadas</h4>
                                    <p>No se encontraron citas con los filtros aplicados.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="citas-agenda">
                                {fechasOrdenadas.map(fecha => (
                                    <div key={fecha} className="fecha-grupo mb-5">
                                        <div className="card">
                                            <div className="card-header bg-light">
                                                <h5 className="card-title mb-0">
                                                    <i className="bi bi-calendar-date"></i>
                                                    {formatearFecha(fecha)}
                                                </h5>
                                                <span className="badge bg-primary">
                                                    {citasPorFecha[fecha].length} cita(s)
                                                </span>
                                            </div>
                                            <div className="card-body p-0">
                                                <div className="citas-grid">
                                                    {citasPorFecha[fecha]
                                                        .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
                                                        .map(cita => (
                                                            <div key={cita.id} className="cita-card card">
                                                                <div className="cita-card-header">
                                                                    <div className="cita-info">
                                                                        <div className="cita-hora">
                                                                            <i className="bi bi-clock"></i>
                                                                            {formatearHora(cita.hora_inicio)} - {formatearHora(cita.hora_fin)}
                                                                        </div>
                                                                        <h6 className="cita-cliente mb-1">
                                                                            {cita.clienteInfo.nombre} {cita.clienteInfo.apellido}
                                                                        </h6>
                                                                        <div className="cita-empleado">
                                                                            <i className="bi bi-telephone"></i>
                                                                            {cita.clienteInfo.telefono}
                                                                        </div>
                                                                    </div>
                                                                    <span className={getBadgeClass(cita.estado)}>
                                                                        {traducirEstado(cita.estado)}
                                                                    </span>
                                                                </div>

                                                                <div className="cita-card-body">
                                                                    <p className="mb-2">
                                                                        <i className="bi bi-scissors"></i>
                                                                        <strong>Servicio:</strong> {cita.servicioInfo.nombre}
                                                                    </p>
                                                                    <p className="mb-2">
                                                                        <i className="bi bi-clock-history"></i>
                                                                        <strong>Duración:</strong> {cita.duracion} minutos
                                                                    </p>
                                                                    <p className="mb-0">
                                                                        <i className="bi bi-currency-dollar"></i>
                                                                        <strong>Precio:</strong> ${parseFloat(cita.servicioInfo.precio).toLocaleString()}
                                                                    </p>
                                                                </div>

                                                                <div className="cita-card-actions">
                                                                    <button
                                                                        className="btn btn-outline-primary btn-sm"
                                                                        onClick={() => abrirModalDetalles(cita)}
                                                                    >
                                                                        <i className="bi bi-eye"></i> Detalles
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de detalles de cita */}
            <Modal
                show={modalAbierto}
                onClose={cerrarModal}
                title="Detalles de la Cita"
                size="md"
            >
                {citaSeleccionada && (
                    <div className="cita-detalles-modal">
                        {/* Header con fecha y estado */}
                        <div className="cita-modal-header">
                            <div className="cita-fecha-estado">
                                <div className="cita-fecha-grande">
                                    {formatearFecha(citaSeleccionada.fecha)}
                                </div>
                                <div className={getBadgeClass(citaSeleccionada.estado) + ' cita-estado-grande'}>
                                    {traducirEstado(citaSeleccionada.estado)}
                                </div>
                            </div>
                        </div>

                        {/* Información del cliente */}
                        <div className="cita-seccion">
                            <h6 className="cita-seccion-titulo">
                                CLIENTE
                            </h6>
                            <div className="cita-info-cliente">
                                <div className="cita-nombre-cliente">
                                    {citaSeleccionada.clienteInfo.nombre} {citaSeleccionada.clienteInfo.apellido}
                                </div>
                                <div className="cita-telefono">
                                    {citaSeleccionada.clienteInfo.telefono}
                                </div>
                            </div>
                        </div>

                        {/* Horario */}
                        <div className="cita-seccion">
                            <h6 className="cita-seccion-titulo">
                                HORARIO
                            </h6>
                            <div className="cita-horario">
                                {formatearHora(citaSeleccionada.hora_inicio)} - {formatearHora(citaSeleccionada.hora_fin)}
                            </div>
                        </div>

                        {/* Servicio */}
                        <div className="cita-seccion">
                            <h6 className="cita-seccion-titulo">
                                SERVICIO
                            </h6>
                            <div className="cita-info-servicio">
                                <div className="cita-nombre-servicio">
                                    {citaSeleccionada.servicioInfo.nombre}
                                </div>
                                {citaSeleccionada.servicioInfo.descripcion && (
                                    <div className="cita-descripcion-servicio">
                                        {citaSeleccionada.servicioInfo.descripcion}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Detalles adicionales */}
                        <div className="cita-detalles-adicionales">
                            <div className="row">
                                <div className="col-6">
                                    <div className="detalle-item">
                                        <div className="detalle-label">Duración</div>
                                        <div className="detalle-valor">
                                            {citaSeleccionada.duracion} minutos
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="detalle-item">
                                        <div className="detalle-label">Precio</div>
                                        <div className="detalle-valor precio">
                                            ${parseFloat(citaSeleccionada.servicioInfo.precio).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Empleado */}
                        <div className="cita-seccion">
                            <h6 className="cita-seccion-titulo">
                                EMPLEADO
                            </h6>
                            <div className="cita-info-empleado">
                                {citaSeleccionada.encargadoInfo.nombre} {citaSeleccionada.encargadoInfo.apellido}
                            </div>
                        </div>

                        {/* Acciones */}
                        <div className="modal-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={cerrarModal}
                            >
                                Cerrar
                            </button>
                            {citaSeleccionada.estado === 'pendiente' && (
                                <button
                                    className="btn btn-primary"
                                    onClick={() => {
                                        console.log('Confirmar cita desde modal:', citaSeleccionada.id);
                                        cerrarModal();
                                    }}
                                >
                                    Confirmar Cita
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};