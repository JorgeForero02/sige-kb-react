import React, { useState, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import apiClient from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { AlertSimple } from '../components/common/AlertSimple';
import '../pages/Pages.css';

export function NominaPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('pre-nomina');
    const [nominas, setNominas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCalculateModal, setShowCalculateModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [detalleNomina, setDetalleNomina] = useState(null);
    const [loadingDetalle, setLoadingDetalle] = useState(false);

    const [showAlert, setShowAlert] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        type: 'success',
        message: '',
        title: ''
    });

    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [filtrosDescuentos, setFiltrosDescuentos] = useState({
        empleado: 'todos',
        mes: '',
        fecha: ''
    });

    const [descuentos, setDescuentos] = useState([]);
    const [loadingDescuentos, setLoadingDescuentos] = useState(false);
    const [showDescuentoModal, setShowDescuentoModal] = useState(false);
    const [descuentoData, setDescuentoData] = useState({
        descripcion: '',
        valor: '',
        fechaDescuento: new Date().toISOString().split('T')[0],
        idEmpleado: ''
    });

    const [filters, setFilters] = useState({
        colaboradora: 'todas',
        fecha_inicio: '',
        fecha_fin: ''
    });

    // Estados para el cálculo de nómina
    const [calculateData, setCalculateData] = useState({
        empleado: '',
        fecha_inicio: '',
        fecha_fin: '',
        tipo_periodo: 'semanal'
    });

    const [empleados, setEmpleados] = useState([]);

    useEffect(() => {
        const loadEmpleados = async () => {
            try {
                const response = await apiClient.getUsuarios('?rol=3'); // Rol empleado
                setEmpleados(response.data || []);
            } catch (error) {
                console.error('Error cargando empleados:', error);
            }
        };
        loadEmpleados();
    }, []);

    const handleAlertClose = () => {
        setShowAlert(false);
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    const loadDescuentos = async (filtros = {}) => {
        setLoadingDescuentos(true);
        try {
            // Primero cargar todos los descuentos
            const response = await apiClient.getDescuentosNomina();
            let descuentosData = response.data || [];

            // Aplicar filtros en el frontend
            if (filtros.empleado && filtros.empleado !== 'todos') {
                descuentosData = descuentosData.filter(descuento =>
                    descuento.idEmpleado == filtros.empleado
                );
            }

            if (filtros.mes) {
                descuentosData = descuentosData.filter(descuento => {
                    if (!descuento.fechaDescuento) return false;
                    const fecha = new Date(descuento.fechaDescuento);
                    const mesDescuento = String(fecha.getMonth() + 1).padStart(2, '0');
                    return mesDescuento === filtros.mes;
                });
            }

            if (filtros.fecha) {
                descuentosData = descuentosData.filter(descuento =>
                    descuento.fechaDescuento === filtros.fecha
                );
            }

            setDescuentos(descuentosData);
        } catch (error) {
            setAlertConfig({
                type: 'error',
                title: 'Error',
                message: 'Error al cargar los descuentos'
            });
            setShowAlert(true);
            setDescuentos([]);
        } finally {
            setLoadingDescuentos(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'ajustes') {
            loadDescuentos();
        }
    }, [activeTab]);

    const handleCreateDescuento = async () => {
        if (!descuentoData.descripcion || !descuentoData.valor || !descuentoData.fechaDescuento || !descuentoData.idEmpleado) {
            setAlertConfig({
                type: 'error',
                title: 'Campos requeridos',
                message: 'Por favor complete todos los campos requeridos'
            });
            setShowAlert(true);
            return;
        }

        setLoading(true);
        try {
            await apiClient.crearDescuentoNomina(descuentoData);
            setAlertConfig({
                type: 'success',
                title: '¡Éxito!',
                message: 'Descuento creado exitosamente'
            });
            setShowAlert(true);
            setShowDescuentoModal(false);
            setDescuentoData({
                descripcion: '',
                valor: '',
                fechaDescuento: new Date().toISOString().split('T')[0],
                idEmpleado: ''
            });
            loadDescuentos();
        } catch (error) {
            setAlertConfig({
                type: 'error',
                title: 'Error',
                message: 'Error creando descuento: ' + error.message
            });
            setShowAlert(true);
        } finally {
            setLoading(false);
        }
    };

    // Cargar nóminas con detalles - MEJORADA
    const loadNominas = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();

            if (filters.colaboradora !== 'todas') {
                params.append('empleado', filters.colaboradora);
            }

            if (filters.fecha_inicio) {
                params.append('fecha_inicio', filters.fecha_inicio);
            }

            if (filters.fecha_fin) {
                params.append('fecha_fin', filters.fecha_fin);
            }

            const queryString = params.toString();
            const endpoint = queryString ? `?${queryString}` : '';

            const response = await apiClient.getNominas(endpoint);
            const nominasBasicas = response.data || [];

            // Cargar detalles para cada nómina
            const nominasConDetalles = await Promise.all(
                nominasBasicas.map(async (nomina) => {
                    try {
                        const detalleResponse = await apiClient.getIdNomina(nomina.id);
                        const detalleData = detalleResponse.data;

                        return {
                            ...nomina,
                            detalle: detalleData?.detalle || [],
                            descuentos: detalleData?.descuentos || [],
                            // Asegurar que tenemos la información de servicios
                            servicios: detalleData?.detalle || [],
                            resumen: {
                                total_servicios: detalleData?.detalle?.length || 0,
                                total_comisiones: nomina.total || 0
                            }
                        };
                    } catch (error) {
                        console.error(`Error cargando detalle para nómina ${nomina.id}:`, error);
                        return {
                            ...nomina,
                            detalle: [],
                            descuentos: [],
                            servicios: [],
                            resumen: {
                                total_servicios: 0,
                                total_comisiones: nomina.total || 0
                            }
                        };
                    }
                })
            );

            setNominas(nominasConDetalles);
        } catch (error) {
            console.error('Error cargando nóminas:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNominas();
    }, [filters]);

    useEffect(() => {
        if (nominas.length > 0) {
            console.log('Datos completos de nóminas:', nominas);
            console.log('Primera nómina completa:', nominas[0]);
            console.log('¿Tiene detalle la primera nómina?', nominas[0].detalle);
            console.log('¿Tiene servicios la primera nómina?', nominas[0].servicios);
            console.log('¿Tiene resumen la primera nómina?', nominas[0].resumen);
        }
    }, [nominas]);

    const handleVerDetalles = async (nomina) => {
        setLoadingDetalle(true);
        try {
            const response = await apiClient.getIdNomina(nomina.id);
            setDetalleNomina(response.data);
            setShowDetailsModal(true);
        } catch (error) {
            console.error('Error cargando detalle:', error);
            setAlertConfig({
                type: 'error',
                title: 'Error',
                message: 'Error al cargar los detalles de la nómina'
            });
            setShowAlert(true);
        } finally {
            setLoadingDetalle(false);
        }
    };

    const handleAplicarFiltrosDescuentos = () => {
        loadDescuentos(filtrosDescuentos);
    };

    const handleClearDescuentosFilters = () => {
        setFiltrosDescuentos({
            empleado: 'todos',
            mes: '',
            fecha: ''
        });
        loadDescuentos();
    };

    const handleClearFilters = () => {
        setFilters({
            colaboradora: 'todas',
            fecha_inicio: '',
            fecha_fin: ''
        });
    };

    const handleCalculateNomina = async () => {
        if (!calculateData.empleado || !calculateData.fecha_inicio || !calculateData.fecha_fin) {
            setAlertConfig({
                type: 'error',
                title: 'Campos requeridos',
                message: 'Por favor complete todos los campos requeridos'
            });
            setShowAlert(true);
            return;
        }

        setLoading(true);
        try {
            const response = await apiClient.calcularNomina(calculateData);
            setAlertConfig({
                type: 'success',
                title: '¡Éxito!',
                message: 'Nómina calculada exitosamente'
            });
            setShowAlert(true);
            setShowCalculateModal(false);
            setCalculateData({
                empleado: '',
                fecha_inicio: '',
                fecha_fin: '',
                tipo_periodo: 'semanal'
            });
            loadNominas();
        } catch (error) {
            setAlertConfig({
                type: 'error',
                title: 'Error',
                message: 'Error calculando nómina: ' + error.message
            });
            setShowAlert(true);
        } finally {
            setLoading(false);
        }
    };

    // Calcular estadísticas - MEJORADA
    const totalDevengado = nominas.reduce((sum, nomina) => {
        const totalNomina = parseFloat(nomina.total) || 0;
        return sum + totalNomina;
    }, 0);

    const totalServicios = nominas.reduce((sum, nomina) => {
        // Priorizar diferentes fuentes de información de servicios
        if (nomina.resumen?.total_servicios !== undefined) {
            return sum + (nomina.resumen.total_servicios || 0);
        }
        if (nomina.detalle && Array.isArray(nomina.detalle)) {
            return sum + nomina.detalle.length;
        }
        if (nomina.servicios && Array.isArray(nomina.servicios)) {
            return sum + nomina.servicios.length;
        }
        return sum + 0;
    }, 0);

    // Calcular total de descuentos aplicados a las nóminas
    const totalDescuentosAplicados = nominas.reduce((sum, nomina) => {
        if (nomina.descuentos && Array.isArray(nomina.descuentos)) {
            const descuentosNomina = nomina.descuentos.reduce((subSum, descuento) => {
                return subSum + parseFloat(descuento.valor || 0);
            }, 0);
            return sum + descuentosNomina;
        }
        return sum;
    }, 0);

    // Neto estimado = Total devengado - Total descuentos aplicados
    const totalNetoEstimado = totalDevengado - totalDescuentosAplicados;

    return (
        <div className="page-container">
            <Header />
            <Sidebar
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
            />

            <main className="main-content">
                <div className="container-fluid">
                    <button
                        className="hamburger content-hamburger"
                        onClick={toggleSidebar}
                        aria-label="Toggle menu"
                    >
                        <i className="bi bi-list"></i>
                    </button>
                    <div className="dashboard-header">
                        <h1 className="dashboard-title">Nómina</h1>
                        <p className="dashboard-subtitle">Gestión de nóminas y pagos a empleados</p>
                    </div>

                    {/* Tabs y Botón Calcular Pre-nómina */}
                    <div className="d-flex justify-content-between align-items-center mb-4" style={{ gap: '1rem' }}>
                        <div className="tabs-container" style={{ flex: 1 }}>
                            <button
                                className={`tab ${activeTab === 'pre-nomina' ? 'tab-active' : ''}`}
                                onClick={() => setActiveTab('pre-nomina')}
                            >
                                Pre-nómina
                            </button>
                            <button
                                className={`tab ${activeTab === 'ajustes' ? 'tab-active' : ''}`}
                                onClick={() => setActiveTab('ajustes')}
                            >
                                Ajustes
                            </button>
                        </div>

                        {activeTab === 'pre-nomina' && (
                            <button
                                className="btn btn-primary calculate-nomina-btn"
                                onClick={() => setShowCalculateModal(true)}
                            >
                                Calcular Pre-nómina
                            </button>
                        )}

                        {activeTab === 'ajustes' && (
                            <button
                                className="btn btn-primary calculate-nomina-btn"
                                onClick={() => setShowDescuentoModal(true)}
                            >
                                Crear Descuento
                            </button>
                        )}
                    </div>

                    {activeTab === 'pre-nomina' && (
                        <div className="content-section">
                            {/* Filtros */}
                            <div className="card mb-4">
                                <div className="card-body">
                                    <h6 className="card-title" style={{ color: '#8A5A6B', fontWeight: '600', marginBottom: '1.5rem' }}>Filtros de búsqueda</h6>
                                    <div className="row g-3">
                                        <div className="col-md-4">
                                            <label className="form-label" style={{ fontWeight: '600', color: '#333' }}>Colaboradora</label>
                                            <select
                                                className="form-select"
                                                value={filters.colaboradora}
                                                onChange={(e) => setFilters({ ...filters, colaboradora: e.target.value })}
                                                style={{ borderRadius: '8px', border: '1px solid #ddd' }}
                                            >
                                                <option value="todas">Todas</option>
                                                {empleados.map(emp => (
                                                    <option key={emp.id} value={emp.id}>
                                                        {emp.nombre} {emp.apellido}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-md-3">
                                            <label className="form-label" style={{ fontWeight: '600', color: '#333' }}>Fecha Inicio</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={filters.fecha_inicio}
                                                onChange={(e) => setFilters({ ...filters, fecha_inicio: e.target.value })}
                                                style={{ borderRadius: '8px', border: '1px solid #ddd' }}
                                            />
                                        </div>

                                        <div className="col-md-3">
                                            <label className="form-label" style={{ fontWeight: '600', color: '#333' }}>Fecha Fin</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={filters.fecha_fin}
                                                onChange={(e) => setFilters({ ...filters, fecha_fin: e.target.value })}
                                                style={{ borderRadius: '8px', border: '1px solid #ddd' }}
                                            />
                                        </div>

                                        <div className="col-md-2 d-flex align-items-end">
                                            <button
                                                className="btn btn-outline-secondary w-100"
                                                onClick={handleClearFilters}
                                                style={{ borderRadius: '8px', border: '1px solid #ddd' }}
                                            >
                                                Limpiar filtros
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Estadísticas */}
                            <div className="stats-grid-compact mb-4">
                                <div className="stat-card-compact">
                                    <div className="stat-label-compact">Total Pre-nóminas</div>
                                    <div className="stat-value-compact">{nominas.length}</div>
                                </div>
                                <div className="stat-card-compact">
                                    <div className="stat-label-compact">Total Devengado</div>
                                    <div className="stat-value-compact">${totalDevengado.toLocaleString()}</div>
                                </div>
                                <div className="stat-card-compact">
                                    <div className="stat-label-compact">Servicios Totales</div>
                                    <div className="stat-value-compact">{totalServicios}</div>
                                </div>
                                <div className="stat-card-compact">
                                    <div className="stat-label-compact">Neto Estimado</div>
                                    <div className="stat-value-compact">${totalNetoEstimado.toLocaleString()}</div>
                                </div>
                            </div>

                            {/* Lista de Pre-nóminas - ACTUALIZADA */}
                            <div className="card">
                                <div className="card-body">
                                    {loading ? (
                                        <div className="text-center">
                                            <div className="spinner-border" role="status">
                                                <span className="visually-hidden">Cargando...</span>
                                            </div>
                                        </div>
                                    ) : nominas.length === 0 ? (
                                        <p className="empty-text">No hay pre-nóminas calculadas</p>
                                    ) : (
                                        <div className="nominas-grid">
                                            {nominas.map((nomina) => {
                                                // Calcular la cantidad de servicios para esta nómina
                                                let cantidadServicios = 0;

                                                // Diferentes formas de obtener la cantidad de servicios
                                                if (nomina.resumen?.total_servicios !== undefined) {
                                                    cantidadServicios = nomina.resumen.total_servicios || 0;
                                                } else if (nomina.detalle && Array.isArray(nomina.detalle)) {
                                                    cantidadServicios = nomina.detalle.length;
                                                } else if (nomina.servicios && Array.isArray(nomina.servicios)) {
                                                    cantidadServicios = nomina.servicios.length;
                                                }

                                                // Si después de todo no tenemos servicios, mostrar 0
                                                cantidadServicios = cantidadServicios || 0;

                                                // Calcular total de descuentos para esta nómina específica
                                                const totalDescuentosNomina = nomina.descuentos && Array.isArray(nomina.descuentos)
                                                    ? nomina.descuentos.reduce((sum, descuento) => sum + parseFloat(descuento.valor || 0), 0)
                                                    : 0;

                                                // Total devengado para esta nómina (sin descuentos)
                                                const totalDevengadoNomina = parseFloat(nomina.total) + totalDescuentosNomina;

                                                // Neto estimado para esta nómina (con descuentos aplicados)
                                                const netoEstimadoNomina = parseFloat(nomina.total) || 0;

                                                return (
                                                    <div key={nomina.id} className="nomina-card">
                                                        <div className="nomina-header">
                                                            <div className="nomina-empleado">
                                                                <h3 className="nomina-nombre">
                                                                    {nomina.empleadoInfo?.nombre} {nomina.empleadoInfo?.apellido}
                                                                </h3>
                                                                <p className="nomina-periodo">
                                                                    {nomina.fecha_inicio} al {nomina.fecha_fin}
                                                                </p>
                                                            </div>
                                                            <button
                                                                className="btn-detalles"
                                                                onClick={() => handleVerDetalles(nomina)}
                                                                disabled={loadingDetalle}
                                                            >
                                                                {loadingDetalle ? 'Cargando...' : 'Detalles'}
                                                            </button>
                                                        </div>

                                                        <hr className="nomina-divider" />

                                                        <div className="nomina-info-grid">
                                                            <div className="info-col">
                                                                <div className="info-item">
                                                                    <span className="info-label">Servicios</span>
                                                                    <span className="info-value servicios">{cantidadServicios}</span>
                                                                </div>
                                                            </div>
                                                            <div className="info-col">
                                                                <div className="info-item">
                                                                    <span className="info-label">Total Devengado</span>
                                                                    <span className="info-value devengado">$ {totalDevengadoNomina.toLocaleString()}</span>
                                                                </div>
                                                            </div>
                                                            <div className="info-col">
                                                                <div className="info-item">
                                                                    <span className="info-label">Neto Estimado</span>
                                                                    <span className="info-value neto">$ {netoEstimadoNomina.toLocaleString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Mostrar descuentos si existen para esta nómina */}
                                                        {totalDescuentosNomina > 0 && (
                                                            <div className="mt-2 text-center">
                                                                <small className="text-danger">
                                                                    Descuentos aplicados: $ {totalDescuentosNomina.toLocaleString()}
                                                                </small>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ajustes' && (
                        <div className="content-section">
                            <div className="card">
                                <div className="card-body">
                                    <h5 className="card-title mb-4">Gestión de Descuentos de Nómina</h5>
                                    <p className="text-muted mb-4">
                                        Los descuentos aplicados aquí se restarán automáticamente al calcular la nómina de cada empleado.
                                    </p>

                                    {/* FILTROS PARA DESCUENTOS - AGREGAR ESTO */}
                                    <div className="card mb-4">
                                        <div className="card-body">
                                            <h6 className="card-title" style={{ color: '#8A5A6B', fontWeight: '600', marginBottom: '1.5rem' }}>
                                                Filtros de Descuentos
                                            </h6>
                                            <div className="row g-3">
                                                <div className="col-md-3">
                                                    <label className="form-label" style={{ fontWeight: '600', color: '#333' }}>Empleado</label>
                                                    <select
                                                        className="form-select"
                                                        value={filtrosDescuentos.empleado}
                                                        onChange={(e) => setFiltrosDescuentos({ ...filtrosDescuentos, empleado: e.target.value })}
                                                        style={{ borderRadius: '8px', border: '1px solid #ddd' }}
                                                    >
                                                        <option value="todos">Todos los empleados</option>
                                                        {empleados.map(emp => (
                                                            <option key={emp.id} value={emp.id}>
                                                                {emp.nombre} {emp.apellido}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="col-md-3">
                                                    <label className="form-label" style={{ fontWeight: '600', color: '#333' }}>Mes</label>
                                                    <select
                                                        className="form-select"
                                                        value={filtrosDescuentos.mes}
                                                        onChange={(e) => setFiltrosDescuentos({ ...filtrosDescuentos, mes: e.target.value })}
                                                        style={{ borderRadius: '8px', border: '1px solid #ddd' }}
                                                    >
                                                        <option value="">Todos los meses</option>
                                                        <option value="01">Enero</option>
                                                        <option value="02">Febrero</option>
                                                        <option value="03">Marzo</option>
                                                        <option value="04">Abril</option>
                                                        <option value="05">Mayo</option>
                                                        <option value="06">Junio</option>
                                                        <option value="07">Julio</option>
                                                        <option value="08">Agosto</option>
                                                        <option value="09">Septiembre</option>
                                                        <option value="10">Octubre</option>
                                                        <option value="11">Noviembre</option>
                                                        <option value="12">Diciembre</option>
                                                    </select>
                                                </div>

                                                <div className="col-md-3 d-flex align-items-end gap-2">
                                                    <button
                                                        className="btn btn-primary w-50"
                                                        onClick={handleAplicarFiltrosDescuentos}
                                                        style={{ borderRadius: '8px' }}
                                                    >
                                                        Aplicar
                                                    </button>
                                                    <button
                                                        className="btn btn-outline-secondary w-50"
                                                        onClick={handleClearDescuentosFilters}
                                                        style={{ borderRadius: '8px', border: '1px solid #ddd' }}
                                                    >
                                                        Limpiar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Lista de descuentos */}
                                    {loadingDescuentos ? (
                                        <div className="text-center">
                                            <div className="spinner-border" role="status">
                                                <span className="visually-hidden">Cargando...</span>
                                            </div>
                                        </div>
                                    ) : descuentos.length === 0 ? (
                                        <div className="text-center py-4">
                                            <p className="text-muted">No hay descuentos registrados</p>
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-striped">
                                                <thead>
                                                    <tr>
                                                        <th>Empleado</th>
                                                        <th>Descripción</th>
                                                        <th>Valor</th>
                                                        <th>Fecha</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {descuentos.map((descuento) => (
                                                        <tr key={descuento.id}>
                                                            <td>
                                                                {descuento.empleadoInfo ?
                                                                    `${descuento.empleadoInfo.nombre} ${descuento.empleadoInfo.apellido}` :
                                                                    'N/A'
                                                                }
                                                            </td>
                                                            <td>{descuento.descripcion}</td>
                                                            <td className="text-danger">
                                                                <strong>$ {parseFloat(descuento.valor).toLocaleString()}</strong>
                                                            </td>
                                                            <td>{descuento.fechaDescuento ? descuento.fechaDescuento.split('T')[0] : 'N/A'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Modal Calcular Pre-nómina */}
                    {showCalculateModal && (
                        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                            <div className="modal-dialog modal-dialog-centered">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h5 className="modal-title">Calcular Pre-nómina</h5>
                                        <button
                                            type="button"
                                            className="btn-close"
                                            onClick={() => setShowCalculateModal(false)}
                                        ></button>
                                    </div>
                                    <div className="modal-body">
                                        <div className="mb-3">
                                            <label className="form-label">Empleado *</label>
                                            <select
                                                className="form-select"
                                                value={calculateData.empleado}
                                                onChange={(e) => setCalculateData({ ...calculateData, empleado: e.target.value })}
                                                required
                                            >
                                                <option value="">Seleccionar empleado</option>
                                                {empleados.map(emp => (
                                                    <option key={emp.id} value={emp.id}>
                                                        {emp.nombre} {emp.apellido}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="row mb-3">
                                            <div className="col-md-6">
                                                <label className="form-label">Período Inicio *</label>
                                                <input
                                                    type="date"
                                                    className="form-control"
                                                    value={calculateData.fecha_inicio}
                                                    onChange={(e) => setCalculateData({ ...calculateData, fecha_inicio: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Período Fin *</label>
                                                <input
                                                    type="date"
                                                    className="form-control"
                                                    value={calculateData.fecha_fin}
                                                    onChange={(e) => setCalculateData({ ...calculateData, fecha_fin: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Tipo de Período</label>
                                            <select
                                                className="form-select"
                                                value={calculateData.tipo_periodo}
                                                onChange={(e) => setCalculateData({ ...calculateData, tipo_periodo: e.target.value })}
                                            >
                                                <option value="semanal">Semanal</option>
                                                <option value="quincenal">Quincenal</option>
                                                <option value="mensual">Mensual</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => setShowCalculateModal(false)}
                                            disabled={loading}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={handleCalculateNomina}
                                            disabled={loading}
                                        >
                                            {loading ? 'Calculando...' : 'Calcular Pre-nómina'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Modal Detalles de Nómina - CORREGIDO */}
                    {showDetailsModal && detalleNomina && (
                        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                            <div className="modal-dialog modal-dialog-centered modal-lg">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h5 className="modal-title">Detalles de Nómina</h5>
                                        <button
                                            type="button"
                                            className="btn-close"
                                            onClick={() => setShowDetailsModal(false)}
                                        ></button>
                                    </div>
                                    <div className="modal-body">
                                        <div className="detalle-header mb-4">
                                            <h6>{detalleNomina.nomina?.empleadoInfo?.nombre} {detalleNomina.nomina?.empleadoInfo?.apellido}</h6>
                                            <p className="text-muted">
                                                Período: {detalleNomina.nomina?.fecha_inicio} al {detalleNomina.nomina?.fecha_fin}
                                            </p>
                                        </div>

                                        {detalleNomina.detalle && detalleNomina.detalle.length > 0 ? (
                                            <>
                                                <div className="table-responsive">
                                                    <table className="table table-striped">
                                                        <thead>
                                                            <tr>
                                                                <th>Fecha</th>
                                                                <th>Servicio</th>
                                                                <th>Valor Servicio</th>
                                                                <th>% Comisión</th>
                                                                <th>Comisión Ganada</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {detalleNomina.detalle.map((servicio, index) => (
                                                                <tr key={index}>
                                                                    <td>{servicio.fecha}</td>
                                                                    <td>{servicio.servicio}</td>
                                                                    <td>${servicio.valor_servicio?.toLocaleString()}</td>
                                                                    <td className={servicio.porcentaje_comision < 0 ? 'text-danger' : 'text-success'}>
                                                                        {servicio.porcentaje_comision}%
                                                                    </td>
                                                                    <td className={servicio.comision_ganada < 0 ? 'text-danger' : 'text-success'}>
                                                                        ${servicio.comision_ganada?.toLocaleString()}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Mostrar descuentos si existen */}
                                                {detalleNomina.descuentos && detalleNomina.descuentos.length > 0 && (
                                                    <div className="descuentos-section mt-4">
                                                        <h6 className="mb-3">Descuentos Aplicados</h6>
                                                        <div className="table-responsive">
                                                            <table className="table table-sm">
                                                                <thead>
                                                                    <tr>
                                                                        <th>Concepto</th>
                                                                        <th>Valor</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {detalleNomina.descuentos.map((descuento, index) => (
                                                                        <tr key={index} className="text-danger">
                                                                            <td>{descuento.concepto || 'Descuento'}</td>
                                                                            <td>${descuento.valor?.toLocaleString()}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="detalle-resumen mt-4 p-3 bg-light rounded">
                                                    <h6>Resumen</h6>
                                                    <div className="row">
                                                        <div className="col-md-4">
                                                            <p><strong>Total Servicios:</strong> {detalleNomina.detalle.length}</p>
                                                        </div>
                                                        <div className="col-md-4">
                                                            <p><strong>Total Comisiones:</strong> ${detalleNomina.nomina?.total?.toLocaleString()}</p>
                                                        </div>
                                                        <div className="col-md-4">
                                                            <p><strong>Período:</strong> {detalleNomina.nomina?.fecha_inicio} al {detalleNomina.nomina?.fecha_fin}</p>
                                                        </div>
                                                    </div>

                                                    {/* Mostrar total de descuentos si existen */}
                                                    {detalleNomina.descuentos && detalleNomina.descuentos.length > 0 && (
                                                        <div className="row mt-2">
                                                            <div className="col-md-12">
                                                                <p className="text-danger">
                                                                    <strong>Total Descuentos:</strong> $
                                                                    {detalleNomina.descuentos.reduce((sum, descuento) => sum + (parseFloat(descuento.valor) || 0), 0).toLocaleString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center py-4">
                                                <p className="text-muted">No hay servicios registrados para este período.</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="modal-footer">
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => setShowDetailsModal(false)}
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Modal Crear Descuento */}
                    {showDescuentoModal && (
                        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                            <div className="modal-dialog modal-dialog-centered">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h5 className="modal-title">Registrar Descuento de Nómina</h5>
                                        <button
                                            type="button"
                                            className="btn-close"
                                            onClick={() => setShowDescuentoModal(false)}
                                        ></button>
                                    </div>
                                    <div className="modal-body">
                                        <div className="alert alert-info">
                                            <small>
                                                <i className="bi bi-info-circle"></i> Este descuento se aplicará automáticamente al calcular la nómina del empleado.
                                            </small>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Empleado *</label>
                                            <select
                                                className="form-select"
                                                value={descuentoData.idEmpleado}
                                                onChange={(e) => setDescuentoData({ ...descuentoData, idEmpleado: e.target.value })}
                                                required
                                            >
                                                <option value="">Seleccionar empleado</option>
                                                {empleados.map(emp => (
                                                    <option key={emp.id} value={emp.id}>
                                                        {emp.nombre} {emp.apellido}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Descripción del descuento *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={descuentoData.descripcion} // Con 'c'
                                                onChange={(e) => setDescuentoData({ ...descuentoData, descripcion: e.target.value })} // Con 'c'
                                                placeholder="Ej: Adelanto de salario, Préstamo, Deducible, etc."
                                                required
                                            />
                                        </div>
                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label">Valor del descuento *</label>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        value={descuentoData.valor}
                                                        onChange={(e) => setDescuentoData({ ...descuentoData, valor: e.target.value })}
                                                        placeholder="000"
                                                        min="0"
                                                        step="0.01"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label">Fecha del descuento *</label>
                                                    <input
                                                        type="date"
                                                        className="form-control"
                                                        value={descuentoData.fechaDescuento}
                                                        onChange={(e) => setDescuentoData({ ...descuentoData, fechaDescuento: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => setShowDescuentoModal(false)}
                                            disabled={loading}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={handleCreateDescuento}
                                            disabled={loading}
                                        >
                                            {loading ? 'Registrando...' : 'Registrar Descuento'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <AlertSimple
                show={showAlert}
                onClose={handleAlertClose}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                confirmText="Aceptar"
                showCancel={false}
            />
        </div>
    );
}