import React, { useState, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { AlertSimple } from '../components/common/AlertSimple';
import APIClient from '../services/api';
import './Pages.css';

export function ReportesPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ show: false, type: 'info', title: '', message: '' });
    const [reporteData, setReporteData] = useState(null);
    const [tipoReporte, setTipoReporte] = useState('mensual');

    const [filtros, setFiltros] = useState({
        mes: new Date().getMonth() + 1,
        anio: new Date().getFullYear(),
        fecha_inicio: '',
        fecha_fin: ''
    });

    useEffect(() => {
        const hoy = new Date();
        const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

        setFiltros(prev => ({
            ...prev,
            fecha_inicio: primerDiaMes.toISOString().split('T')[0],
            fecha_fin: ultimoDiaMes.toISOString().split('T')[0]
        }));
    }, []);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const mostrarAlerta = (type, title, message) => {
        setAlert({ show: true, type, title, message });
    };

    const generarReporte = async () => {
        setLoading(true);
        try {
            let data;

            if (tipoReporte === 'mensual') {
                data = await APIClient.getReporteMensual(filtros.mes, filtros.anio);
            } else {
                data = await APIClient.getReportePersonalizado(filtros.fecha_inicio, filtros.fecha_fin);
            }

            if (data.success) {
                setReporteData(data.data);
                mostrarAlerta('success', 'Reporte generado', 'El reporte se ha generado exitosamente');
            } else {
                throw new Error(data.message || 'Error al generar el reporte');
            }
        } catch (error) {
            console.error('Error generando reporte:', error);
            mostrarAlerta('error', 'Error', error.message || 'No se pudo generar el reporte');
        } finally {
            setLoading(false);
        }
    };

    const handleFiltroChange = (campo, valor) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }));
    };

    const formatearMoneda = (valor) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(valor);
    };

    const formatearPorcentaje = (valor, total) => {
        if (total === 0) return '0%';
        return `${((valor / total) * 100).toFixed(1)}%`;
    };

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const TarjetaEstadistica = ({ titulo, valor, subtitulo, tipo = 'primary', icono }) => (
        <div className={`stat-card stat-${tipo}`}>
            <div className="stat-icon">
                <i className={`bi ${icono}`}></i>
            </div>
            <div className="stat-info">
                <p className="stat-label">{titulo}</p>
                <h3 className="stat-value">{valor}</h3>
                {subtitulo && <span className="stat-subtitulo">{subtitulo}</span>}
            </div>
        </div>
    );

    const GraficoBarrasSimple = ({ datos, titulo, campoValor, campoEtiqueta }) => (
        <div className="grafico-card">
            <div className="card-header">
                <i className="bi bi-bar-chart-fill"></i>
                <h4 className="card-title">{titulo}</h4>
            </div>
            <div className="grafico-barras">
                {datos.map((item, index) => (
                    <div key={index} className="barra-item">
                        <div className="barra-etiqueta">{item[campoEtiqueta]}</div>
                        <div className="barra-contenedor">
                            <div
                                className="barra-progreso"
                                style={{
                                    width: `${(item[campoValor] / Math.max(...datos.map(d => d[campoValor]))) * 90}%`
                                }}
                            >
                                <span className="barra-valor">{formatearMoneda(item[campoValor])}</span>
                            </div>
                        </div>
                        <div className="barra-cantidad">{item.cantidad} trans.</div>
                    </div>
                ))}
            </div>
        </div>
    );

    const DetallesIngresos = ({ detalles }) => (
        <div className="detalles-section">
            <div className="card-header">
                <h4 className="card-title">Detalles de Ingresos</h4>
                <span className="badge badge-confirmada">{detalles.length} registros</span>
            </div>
            <div className="table-responsive">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Servicio</th>
                            <th>Empleado</th>
                            <th>Medio de Pago</th>
                            <th>Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {detalles.map((ingreso, index) => (
                            <tr key={ingreso.id || index}>
                                <td>{formatearFecha(ingreso.fecha)}</td>
                                <td>
                                    <strong>{ingreso.servicio}</strong>
                                    {ingreso.descripcion && (
                                        <div className="text-muted small">{ingreso.descripcion}</div>
                                    )}
                                </td>
                                <td>{ingreso.empleado}</td>
                                <td>
                                    <span className={`badge ${ingreso.medio_pago === 'Efectivo' ? 'badge-success' :
                                        ingreso.medio_pago === 'Tarjeta' ? 'badge-primary' :
                                            'badge-warning'
                                        }`}>
                                        {ingreso.medio_pago}
                                    </span>
                                </td>
                                <td className="text-success fw-bold">{formatearMoneda(ingreso.valor)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const DetallesEgresos = ({ detalles }) => (
        <div className="detalles-section">
            <div className="card-header">
                <h4 className="card-title">Detalles de Egresos</h4>
                <span className="badge badge-cancelada">{detalles.length} registros</span>
            </div>
            <div className="table-responsive">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Categoría</th>
                            <th>Proveedor</th>
                            <th>Medio de Pago</th>
                            <th>Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {detalles.map((egreso, index) => (
                            <tr key={egreso.id || index}>
                                <td>{formatearFecha(egreso.fecha)}</td>
                                <td>
                                    <strong>{egreso.categoria}</strong>
                                    {egreso.descripcion && (
                                        <div className="text-muted small">{egreso.descripcion}</div>
                                    )}
                                </td>
                                <td>{egreso.proveedor || 'N/A'}</td>
                                <td>
                                    <span className={`badge ${egreso.medio_pago === 'Efectivo' ? 'badge-success' :
                                        egreso.medio_pago === 'Tarjeta' ? 'badge-primary' :
                                            'badge-warning'
                                        }`}>
                                        {egreso.medio_pago}
                                    </span>
                                </td>
                                <td className="text-danger fw-bold">{formatearMoneda(egreso.valor)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="reportes-page">
            <Header />
            <Sidebar
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
            />

            <main className="main-content">
                <button
                    className="hamburger content-hamburger"
                    onClick={toggleSidebar}
                    aria-label="Toggle menu"
                >
                    <i className="bi bi-list"></i>
                </button>
                <div className="dashboard-header">
                    <h1 className="dashboard-title">Reportes y Estadísticas</h1>
                    <p className="dashboard-subtitle">Analiza el rendimiento financiero del negocio</p>
                </div>

                <div className="filtros-panel">
                    <div className="page-header">
                        <h4>Generar Reporte</h4>
                        <div className="tabs-container">
                            <button
                                className={`tab ${tipoReporte === 'mensual' ? 'tab-active' : ''}`}
                                onClick={() => setTipoReporte('mensual')}
                            >
                                Mensual
                            </button>
                            <button
                                className={`tab ${tipoReporte === 'personalizado' ? 'tab-active' : ''}`}
                                onClick={() => setTipoReporte('personalizado')}
                            >
                                Personalizado
                            </button>
                        </div>
                    </div>

                    <div className="filtros-content">
                        {tipoReporte === 'mensual' ? (
                            <div className="filtros-row">
                                <div className="filtro-group">
                                    <label>Mes</label>
                                    <select
                                        value={filtros.mes}
                                        onChange={(e) => handleFiltroChange('mes', parseInt(e.target.value))}
                                        className="form-select"
                                    >
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <option key={i + 1} value={i + 1}>
                                                {new Date(2000, i).toLocaleString('es', { month: 'long' })}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="filtro-group">
                                    <label>Año</label>
                                    <select
                                        value={filtros.anio}
                                        onChange={(e) => handleFiltroChange('anio', parseInt(e.target.value))}
                                        className="form-select"
                                    >
                                        {Array.from({ length: 5 }, (_, i) => {
                                            const year = new Date().getFullYear() - 2 + i;
                                            return <option key={year} value={year}>{year}</option>;
                                        })}
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div className="filtros-row">
                                <div className="filtro-group">
                                    <label>Fecha Inicio</label>
                                    <input
                                        type="date"
                                        value={filtros.fecha_inicio}
                                        onChange={(e) => handleFiltroChange('fecha_inicio', e.target.value)}
                                        className="form-control"
                                    />
                                </div>
                                <div className="filtro-group">
                                    <label>Fecha Fin</label>
                                    <input
                                        type="date"
                                        value={filtros.fecha_fin}
                                        onChange={(e) => handleFiltroChange('fecha_fin', e.target.value)}
                                        className="form-control"
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            className="btn btn-primary generar-btn"
                            onClick={generarReporte}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    Generando...
                                </>
                            ) : (
                                <>
                                    Generar
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {reporteData && (
                    <div className="reporte-content">
                        <div className="periodo-header">
                            <h2 className="title">
                                {tipoReporte === 'mensual'
                                    ? `Reporte Mensual - ${new Date(reporteData.periodo.anio, reporteData.periodo.mes - 1).toLocaleString('es', { month: 'long', year: 'numeric' })}`
                                    : `Reporte Personalizado - ${new Date(reporteData.periodo.fecha_inicio).toLocaleDateString()} al ${new Date(reporteData.periodo.fecha_fin).toLocaleDateString()}`
                                }
                            </h2>
                        </div>

                        <div className="stats-grid">
                            <TarjetaEstadistica
                                titulo="Total Ingresos"
                                valor={formatearMoneda(reporteData.resumen.total_ingresos)}
                                subtitulo={`${reporteData.resumen.cantidad_ingresos} transacciones`}
                                tipo="success"
                                icono="bi-arrow-up-circle"
                            />
                            <TarjetaEstadistica
                                titulo="Total Egresos"
                                valor={formatearMoneda(reporteData.resumen.total_egresos)}
                                subtitulo={`${reporteData.resumen.cantidad_egresos} transacciones`}
                                tipo="danger"
                                icono="bi-arrow-down-circle"
                            />
                            <TarjetaEstadistica
                                titulo="Balance Neto"
                                valor={formatearMoneda(reporteData.resumen.balance)}
                                subtitulo={formatearPorcentaje(reporteData.resumen.balance, reporteData.resumen.total_ingresos)}
                                tipo={reporteData.resumen.balance >= 0 ? 'primary' : 'danger'}
                                icono="bi-graph-up-arrow"
                            />
                            <TarjetaEstadistica
                                titulo="Margen de Ganancia"
                                valor={formatearPorcentaje(reporteData.resumen.balance, reporteData.resumen.total_ingresos)}
                                subtitulo="Del total de ingresos"
                                tipo="warning"
                                icono="bi-percent"
                            />
                        </div>

                        <div className="dashboard-grid">
                            {reporteData.ingresos_por_servicio && reporteData.ingresos_por_servicio.length > 0 && (
                                <GraficoBarrasSimple
                                    datos={reporteData.ingresos_por_servicio}
                                    titulo="Ingresos por Servicio"
                                    campoValor="total"
                                    campoEtiqueta="nombre"
                                />
                            )}

                            {reporteData.egresos_por_categoria && reporteData.egresos_por_categoria.length > 0 && (
                                <GraficoBarrasSimple
                                    datos={reporteData.egresos_por_categoria}
                                    titulo="Egresos por Categoría"
                                    campoValor="total"
                                    campoEtiqueta="nombre"
                                />
                            )}

                            {reporteData.ingresos_por_medio_pago && reporteData.ingresos_por_medio_pago.length > 0 && (
                                <div className="grafico-card">
                                    <div className="card-header">
                                        <i className="bi bi-credit-card-fill"></i>
                                        <h4 className="card-title">Ingresos por Medio de Pago</h4>
                                    </div>
                                    <div className="medios-pago-grid">
                                        {reporteData.ingresos_por_medio_pago.map((medio, index) => (
                                            <div key={index} className="medio-pago-item">
                                                <div className="medio-pago-info">
                                                    <span className="medio-pago-nombre">{medio.medio_pago}</span>
                                                    <span className="medio-pago-cantidad">{medio.cantidad} trans.</span>
                                                </div>
                                                <div className="medio-pago-total">{formatearMoneda(medio.total)}</div>
                                                <div className="medio-pago-porcentaje">
                                                    {formatearPorcentaje(medio.total, reporteData.resumen.total_ingresos)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {tipoReporte === 'personalizado' && reporteData.ingresos_por_dia && (
                                <div className="grafico-card">
                                    <div className="card-header">
                                        <i className="bi bi-calendar-week"></i>
                                        <h4 className="card-title">Ingresos por Día</h4>
                                    </div>
                                    <div className="ingresos-dia-grid">
                                        {reporteData.ingresos_por_dia.map((dia, index) => (
                                            <div key={index} className="dia-item">
                                                <div className="dia-fecha">{new Date(dia.fecha).toLocaleDateString('es', { weekday: 'short', day: 'numeric' })}</div>
                                                <div className="dia-total">{formatearMoneda(dia.total)}</div>
                                                <div className="dia-cantidad">{dia.cantidad} servicios</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="detalles-container">
                            {reporteData.detalle_ingresos && reporteData.detalle_ingresos.length > 0 && (
                                <DetallesIngresos detalles={reporteData.detalle_ingresos} />
                            )}

                            {reporteData.detalle_egresos && reporteData.detalle_egresos.length > 0 && (
                                <DetallesEgresos detalles={reporteData.detalle_egresos} />
                            )}
                        </div>
                    </div>
                )}

                {!reporteData && !loading && (
                    <div className="estado-vacio">
                        <h3>Selecciona los filtros y genera un reporte</h3>
                        <p>Visualiza estadísticas detalladas de ingresos, egresos y balances</p>
                    </div>
                )}
            </main>

            <AlertSimple
                show={alert.show}
                type={alert.type}
                title={alert.title}
                message={alert.message}
                onClose={() => setAlert({ ...alert, show: false })}
                confirmText="Aceptar"
            />
        </div>
    );
}