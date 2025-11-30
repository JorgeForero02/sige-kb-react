import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { logger } from '../services/logger';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { Card, Input, Loading, Empty } from '../components/common/Components';
import { AlertSimple } from '../components/common/AlertSimple';
import { useAlert } from '../hooks/useAlert';
import '../pages/Pages.css';

export function ServiciosEmpleadoPage() {
  const [servicios, setServicios] = useState([]);
  const [serviciosFiltrados, setServiciosFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { alert, error: showError } = useAlert();

  useEffect(() => {
    fetchServicios();
  }, []);

  const fetchServicios = async () => {
    setLoading(true);
    try {
      const res = await api.getServicios();
      const serviciosData = res.data || [];
      
      setServicios(serviciosData);
      setServiciosFiltrados(serviciosData);
      
      logger.success('Servicios cargados', `${serviciosData.length} servicios asignados`);
    } catch (err) {
      logger.error('Error al cargar servicios', err.message);
      showError(err.message || 'Error al cargar servicios');
    }
    setLoading(false);
  };

  const getEstadoServicio = (servicio) => {
    if (servicio.estado !== undefined && servicio.estado !== null) {
      return String(servicio.estado).toUpperCase();
    }
    return 'ACTIVO';
  };

  const getColorEstado = (estado) => {
    const estadoUpper = String(estado).toUpperCase();

    if (estadoUpper === 'ACTIVO' || estadoUpper === 'ACTIVA' || estadoUpper === '1' || estadoUpper === 'TRUE') {
      return {
        background: '#DCFCE7',
        color: '#166534',
        text: 'Activo'
      };
    } else if (estadoUpper === 'INACTIVO' || estadoUpper === 'INACTIVA' || estadoUpper === '0' || estadoUpper === 'FALSE') {
      return {
        background: '#FEE2E2',
        color: '#7F1D1D',
        text: 'Inactivo'
      };
    } else {
      return {
        background: '#FEF3C7',
        color: '#92400E',
        text: 'Desconocido'
      };
    }
  };

  const formatFecha = (fechaString) => {
    if (!fechaString) return '-';
    
    try {
      const fecha = new Date(fechaString);
      if (isNaN(fecha.getTime())) return '-';
      return fecha.toLocaleDateString('es-ES');
    } catch (error) {
      return '-';
    }
  };

  // Filtrar servicios basado en la búsqueda
  useEffect(() => {
    if (!searchTerm) {
      setServiciosFiltrados(servicios);
    } else {
      const filtered = servicios.filter(servicio =>
        servicio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (servicio.descripcion && servicio.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (servicio.categoriaInfo?.nombre && servicio.categoriaInfo.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setServiciosFiltrados(filtered);
    }
  }, [searchTerm, servicios]);

  return (
    <div className="app-layout">
      <Header />
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <main className="content">
        <div className="content-wrapper">
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
                  <h1 className="dashboard-title">Mis Servicios</h1>
                  <p className="dashboard-subtitle">
                    {servicios.length > 0 
                      ? `Total: ${servicios.length} servicio${servicios.length !== 1 ? 's' : ''} asignado${servicios.length !== 1 ? 's' : ''}`
                      : 'No tienes servicios asignados'
                    }
                  </p>
                </div>
              </div>
            </div>

            {alert && <AlertSimple message={alert.message} type={alert.type} />}

            {/* Barra de búsqueda */}
            <div style={{ marginBottom: '1.5rem' }}>
              <Input
                placeholder="Buscar servicios ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ maxWidth: '400px' }}
                icon="search"
              />
            </div>

            {/* Tabla de servicios */}
            <div className="table-container">
              {loading ? (
                <Loading />
              ) : serviciosFiltrados.length > 0 ? (
                <Card>
                  <div className="card-header">
                    <h3 className="title">Lista de Servicios</h3>
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
                          <th>Comisión</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {serviciosFiltrados.map(servicio => {
                          const estado = getEstadoServicio(servicio);
                          const estadoInfo = getColorEstado(estado);
                          
                          return (
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
                              <td style={{ color: '#7C3AED' }}>
                                {servicio.porcentaje ? `${servicio.porcentaje}%` : '-'}
                              </td>
                              <td>
                                <span
                                  style={{
                                    padding: '0.35rem 0.9rem',
                                    borderRadius: '20px',
                                    fontSize: '0.75rem',
                                    fontWeight: '700',
                                    backgroundColor: estadoInfo.background,
                                    color: estadoInfo.color,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                  }}
                                >
                                  {estadoInfo.text}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              ) : (
                <Empty message={
                  searchTerm
                    ? "No se encontraron servicios que coincidan con la búsqueda"
                    : "No tienes servicios asignados"
                } />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}