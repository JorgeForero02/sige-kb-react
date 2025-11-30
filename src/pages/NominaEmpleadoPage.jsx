import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { AlertSimple } from '../components/common/AlertSimple';
import APIClient from '../services/api';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import './Pages.css';

export function NominaEmpleadoPage() {
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('nominas');
    const [nominas, setNominas] = useState([]);
    const [descuentos, setDescuentos] = useState([]);
    const [loadingNominas, setLoadingNominas] = useState(false);
    const [loadingDescuentos, setLoadingDescuentos] = useState(false);
    const [error, setError] = useState('');
    const [selectedNomina, setSelectedNomina] = useState(null);
    const [showDetallesModal, setShowDetallesModal] = useState(false);

    const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
    const [filtroFechaFin, setFiltroFechaFin] = useState('');
    const [filtroMes, setFiltroMes] = useState('');

    const fetchNominas = async () => {
        try {
            setLoadingNominas(true);
            let params = '';
            if (filtroFechaInicio && filtroFechaFin) {
                params = `?fecha_inicio=${filtroFechaInicio}&fecha_fin=${filtroFechaFin}`;
            }
            const response = await APIClient.getNominas(params);
            if (response.success) {
                setNominas(response.data || []);
            } else {
                setError('Error al cargar las nóminas');
            }
        } catch (err) {
            setError('Error al conectar con el servidor: ' + err.message);
        } finally {
            setLoadingNominas(false);
        }
    };

    const fetchDescuentos = async () => {
        try {
            setLoadingDescuentos(true);
            const response = await APIClient.getDescuentosNomina();

            if (response.success) {
                setDescuentos(response.data || []);
            } else {
                setError('Error al cargar los descuentos');
            }
        } catch (err) {
            setError('Error al conectar con el servidor: ' + err.message);
        } finally {
            setLoadingDescuentos(false);
        }
    };

    const descuentosFiltrados = useMemo(() => {
        if (!filtroMes) return descuentos;

        const [year, month] = filtroMes.split('-');

        return descuentos.filter(descuento => {
            try {
                const fechaDescuento = new Date(descuento.fechaDescuento);
                const descuentoYear = fechaDescuento.getUTCFullYear();
                const descuentoMonth = String(fechaDescuento.getUTCMonth() + 1).padStart(2, '0');

                return descuentoYear === parseInt(year) && descuentoMonth === month;
            } catch (error) {
                return false;
            }
        });
    }, [descuentos, filtroMes]);

    useEffect(() => {
        if (activeTab === 'nominas') {
            fetchNominas();
        }
    }, [activeTab, filtroFechaInicio, filtroFechaFin]);

    useEffect(() => {
        if (activeTab === 'descuentos') {
            fetchDescuentos();
        }
    }, [activeTab]);

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
        if (!dateString) return 'Fecha no disponible';
        try {
            const date = new Date(dateString);
            if (!isNaN(date.getTime())) {
                return new Date(Date.UTC(
                    date.getUTCFullYear(),
                    date.getUTCMonth(),
                    date.getUTCDate()
                )).toLocaleDateString('es-CO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    timeZone: 'UTC'
                });
            }
            return 'Fecha inválida';
        } catch (error) {
            return 'Fecha inválida';
        }
    };

    const formatMonthYear = (monthString) => {
        if (!monthString) return '';
        try {
            const [year, month] = monthString.split('-');
            const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, 1));
            return date.toLocaleDateString('es-CO', {
                year: 'numeric',
                month: 'long',
                timeZone: 'UTC'
            });
        } catch (error) {
            return monthString;
        }
    };

    const handleVerDetalles = (nomina) => {
        setSelectedNomina(nomina);
        setShowDetallesModal(true);
    };

    const limpiarFiltroNominas = () => {
        setFiltroFechaInicio('');
        setFiltroFechaFin('');
    };

    const limpiarFiltroDescuentos = () => {
        setFiltroMes('');
    };

    const calcularTotalDescuentos = () => {
        return descuentosFiltrados.reduce((total, descuento) => total + parseFloat(descuento.valor || 0), 0);
    };

    const calcularTotalNominas = () => {
        return nominas.reduce((total, nomina) => total + parseFloat(nomina.total || 0), 0);
    };

    const stats = {
        totalNominas: nominas.length,
        totalPagado: calcularTotalNominas(),
        totalDescuentos: calcularTotalDescuentos(),
        nominasConDescuentos: nominas.filter(n => parseFloat(n.total || 0) < 0).length
    };

    const loading = loadingNominas || loadingDescuentos;

    if (loading && nominas.length === 0 && descuentos.length === 0) {
        return (
            <div className="app-container">
                <Header />
                <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
                <main className={`main-content`}>
                    <button
                        className="hamburger content-hamburger"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        aria-label="Toggle menu"
                    >
                        <i className="bi bi-list"></i>
                    </button>
                    <div className="content">
                        <div className="dashboard-header">
                            <h1 className="dashboard-title">Mi Nómina</h1>
                            <p className="dashboard-subtitle">Consulta tus nóminas y descuentos</p>
                        </div>
                        <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Cargando...</span>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="app-container">
            <Header />
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
            <main className={`main-content`}>
                <button
                    className="hamburger content-hamburger"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    aria-label="Toggle menu"
                >
                    <i className="bi bi-list"></i>
                </button>
                <div className="content">
                    <div className="dashboard-header">
                        <h1 className="dashboard-title">Mi Nómina</h1>
                        <p className="dashboard-subtitle">Consulta tus nóminas y descuentos</p>
                    </div>

                    {error && (
                        <AlertSimple
                            show={true}
                            type="error"
                            title="Error"
                            message={error}
                            onClose={() => setError('')}
                        />
                    )}

                    <div className="stats-grid-compact">
                        <div className="stat-card-compact">
                            <div className="stat-label-compact">Total Nóminas</div>
                            <div className="stat-value-compact">{stats.totalNominas}</div>
                        </div>
                        <div className="stat-card-compact">
                            <div className="stat-label-compact">Total Pagado</div>
                            <div className="stat-value-compact">{formatCurrency(stats.totalPagado)}</div>
                        </div>
                        <div className="stat-card-compact">
                            <div className="stat-label-compact">Total Descuentos</div>
                            <div className="stat-value-compact">{formatCurrency(stats.totalDescuentos)}</div>
                        </div>
                        <div className="stat-card-compact">
                            <div className="stat-label-compact">Nóminas con Descuentos</div>
                            <div className="stat-value-compact">{stats.nominasConDescuentos}</div>
                        </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div className="tabs-container">
                            <button
                                className={`tab ${activeTab === 'nominas' ? 'tab-active' : ''}`}
                                onClick={() => setActiveTab('nominas')}
                            >
                                Nóminas
                            </button>
                            <button
                                className={`tab ${activeTab === 'descuentos' ? 'tab-active' : ''}`}
                                onClick={() => setActiveTab('descuentos')}
                            >
                                Descuentos
                            </button>
                        </div>
                    </div>

                    {activeTab === 'nominas' && (
                        <>
                            <div className="row mb-4">
                                <div className="col-md-4">
                                    <label className="form-label">Fecha Inicio</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={filtroFechaInicio}
                                        onChange={(e) => setFiltroFechaInicio(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">Fecha Fin</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={filtroFechaFin}
                                        onChange={(e) => setFiltroFechaFin(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-4 d-flex align-items-end">
                                    <button
                                        className="btn-secondary"
                                        onClick={limpiarFiltroNominas}
                                    >
                                        Limpiar Filtro
                                    </button>
                                </div>
                            </div>

                            {loadingNominas ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Cargando nóminas...</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="nominas-grid">
                                    {nominas.length === 0 ? (
                                        <div className="text-center py-5">
                                            <i className="bi bi-journal-x" style={{ fontSize: '3rem', color: '#6c757d' }}></i>
                                            <p className="mt-3 text-muted">No hay nóminas registradas</p>
                                        </div>
                                    ) : (
                                        nominas.map((nomina) => (
                                            <div key={nomina.id} className="nomina-card">
                                                <div className="nomina-header">
                                                    <div className="nomina-empleado">
                                                        <h4 className="nomina-nombre">
                                                            Periodo: {formatDate(nomina.fecha_inicio)} - {formatDate(nomina.fecha_fin)}
                                                        </h4>
                                                    </div>
                                                    <button
                                                        className="btn-detalles"
                                                        onClick={() => handleVerDetalles(nomina)}
                                                    >
                                                        <i className="bi bi-eye"></i> Detalles
                                                    </button>
                                                </div>

                                                <hr className="nomina-divider" />

                                                <div className="nomina-info-grid">
                                                    <div className="info-col">
                                                        <div className="info-item">
                                                            <span className="info-label">Total</span>
                                                            <span className={`info-value ${parseFloat(nomina.total || 0) >= 0 ? 'servicios' : 'neto'}`}>
                                                                {formatCurrency(nomina.total)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="info-col">
                                                        <div className="info-item">
                                                            <span className="info-label">Estado</span>
                                                            <span className={`info-value ${parseFloat(nomina.total || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                                                                {parseFloat(nomina.total || 0) >= 0 ? 'Pagada' : 'Con descuentos'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'descuentos' && (
                        <>
                            <div className="row mb-4">
                                <div className="col-md-6">
                                    <label className="form-label">Filtrar por Mes</label>
                                    <input
                                        type="month"
                                        className="form-control"
                                        value={filtroMes}
                                        onChange={(e) => setFiltroMes(e.target.value)}
                                        placeholder="Selecciona un mes"
                                    />
                                </div>
                                <div className="col-md-6 d-flex align-items-end">
                                    <button
                                        className="btn-secondary"
                                        onClick={limpiarFiltroDescuentos}
                                    >
                                        Limpiar Filtro
                                    </button>
                                </div>
                            </div>

                            {loadingDescuentos ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Cargando descuentos...</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Fecha</th>
                                                <th>Descripción</th>
                                                <th>Valor</th>
                                                <th>Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {descuentosFiltrados.length === 0 ? (
                                                <tr>
                                                    <td colSpan="4" className="text-center py-4">
                                                        <i className="bi bi-cash-coin" style={{ fontSize: '2rem', color: '#6c757d' }}></i>
                                                        <p className="mt-2 text-muted">
                                                            {filtroMes
                                                                ? `No hay descuentos registrados para ${formatMonthYear(filtroMes)}`
                                                                : 'Selecciona un mes para filtrar los descuentos'
                                                            }
                                                        </p>
                                                        {filtroMes && descuentos.length > 0 && (
                                                            <small className="text-muted">
                                                                (Hay {descuentos.length} descuentos en total)
                                                            </small>
                                                        )}
                                                    </td>
                                                </tr>
                                            ) : (
                                                descuentosFiltrados.map((descuento) => (
                                                    <tr key={descuento.id}>
                                                        <td>
                                                            <strong>{formatDate(descuento.fechaDescuento)}</strong>
                                                        </td>
                                                        <td>
                                                            <div>
                                                                <strong>{descuento.descripcion}</strong>
                                                                <br />
                                                                <small className="text-muted">
                                                                    Registrado: {formatDate(descuento.createdAt)}
                                                                </small>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className="text-danger fw-bold">
                                                                -{formatCurrency(descuento.valor)}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="badge bg-danger">Aplicado</span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}

                    {showDetallesModal && selectedNomina && (
                        <div className="modal-overlay" onClick={() => setShowDetallesModal(false)}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <div className="detalle-header mb-4">
                                    <h6>Detalles de Nómina </h6>
                                </div>

                                <div className="row mb-4">
                                    <div className="col-md-6">
                                        <strong>Periodo:</strong><br />
                                        {formatDate(selectedNomina.fecha_inicio)} - {formatDate(selectedNomina.fecha_fin)}
                                    </div>
                                    <div className="col-md-6">
                                        <strong>Empleado:</strong><br />
                                        {selectedNomina.empleadoInfo?.nombre} {selectedNomina.empleadoInfo?.apellido}
                                    </div>
                                </div>

                                <div className="detalle-resumen p-3 mb-4">
                                    <h6>Resumen de Nómina</h6>
                                    <div className="row text-center">
                                        <div className="col-12">
                                            <h4 className={parseFloat(selectedNomina.total || 0) >= 0 ? 'text-success' : 'text-danger'}>
                                                {formatCurrency(selectedNomina.total)}
                                            </h4>
                                            <small className="text-muted">
                                                {parseFloat(selectedNomina.total || 0) >= 0 ? 'Total a pagar' : 'Total con descuentos'}
                                            </small>
                                        </div>
                                    </div>
                                </div>

                                <div className="descuentos-section">
                                    <h6>Descuentos Aplicados</h6>
                                    {descuentos.filter(d => {
                                        try {
                                            const descuentoDate = new Date(d.fechaDescuento);
                                            const inicioDate = new Date(selectedNomina.fecha_inicio);
                                            const finDate = new Date(selectedNomina.fecha_fin);
                                            return descuentoDate >= inicioDate && descuentoDate <= finDate;
                                        } catch (error) {
                                            return false;
                                        }
                                    }).length === 0 ? (
                                        <p className="text-muted">No hay descuentos aplicados en este periodo</p>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-sm">
                                                <thead>
                                                    <tr>
                                                        <th>Fecha</th>
                                                        <th>Descripción</th>
                                                        <th>Valor</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {descuentos
                                                        .filter(d => {
                                                            try {
                                                                const descuentoDate = new Date(d.fechaDescuento);
                                                                const inicioDate = new Date(selectedNomina.fecha_inicio);
                                                                const finDate = new Date(selectedNomina.fecha_fin);
                                                                return descuentoDate >= inicioDate && descuentoDate <= finDate;
                                                            } catch (error) {
                                                                return false;
                                                            }
                                                        })
                                                        .map((descuento) => (
                                                            <tr key={descuento.id}>
                                                                <td>{formatDate(descuento.fechaDescuento)}</td>
                                                                <td>{descuento.descripcion}</td>
                                                                <td className="text-danger">-{formatCurrency(descuento.valor)}</td>
                                                            </tr>
                                                        ))
                                                    }
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                <div className="modal-actions">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setShowDetallesModal(false)}
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}