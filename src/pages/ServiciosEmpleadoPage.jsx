import React, { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { logger } from '../services/logger';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { Card, Input, Loading, Empty } from '../components/common/Components';
import { AlertSimple } from '../components/common/AlertSimple';
import { useAlert } from '../hooks/useAlert';
import { AuthContext } from '../context/AuthContext';
import '../pages/Pages.css';

export function ServiciosEmpleadoPage() {
  const [servicios, setServicios] = useState([]);
  const [serviciosFiltrados, setServiciosFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { alert, error: showError } = useAlert();
  const { user } = useContext(AuthContext);

  const empleadoId = user?.id;

  useEffect(() => {
    if (empleadoId) {
      fetchServiciosDesdeCitas();
    }
  }, [empleadoId]);

  const fetchServiciosDesdeCitas = async () => {
    if (!empleadoId) {
      return;
    }

    setLoading(true);
    try {
      const res = await api.getAgendaEmpleado(empleadoId);
      const citasData = res.data || [];

      const serviciosUnicos = obtenerServiciosUnicosDesdeCitas(citasData);

      const serviciosConCategoria = await obtenerInformacionCompletaServicios(serviciosUnicos);

      setServicios(serviciosConCategoria);
      setServiciosFiltrados(serviciosConCategoria);

      if (serviciosConCategoria.length > 0) {
        logger.success('Servicios cargados', `${serviciosConCategoria.length} servicios obtenidos de las citas`);
      } else {
        logger.info('Sin servicios', 'No tienes servicios en tus citas');
      }
    } catch (err) {
      logger.error('Error al cargar servicios desde citas', err.message);
      showError(err.message || 'Error al cargar servicios desde citas');
    }
    setLoading(false);
  };

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

  if (!empleadoId && loading) {
    return <Loading />;
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
            <div className="dashboard-header">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h1 className="dashboard-title">Mis Servicios</h1>
                  <p className="dashboard-subtitle">
                    {servicios.length > 0
                      ? `Total: ${servicios.length} servicio${servicios.length !== 1 ? 's' : ''}`
                      : 'No tienes servicios asociados'
                    }
                  </p>
                </div>
              </div>
            </div>

            {alert && <AlertSimple message={alert.message} type={alert.type} />}

            <div style={{ marginBottom: '1.5rem' }}>
              <Input
                placeholder="Buscar servicios en mis citas ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ maxWidth: '400px' }}
                icon="search"
              />
            </div>

            <div className="table-container">
              {loading ? (
                <Loading />
              ) : serviciosFiltrados.length > 0 ? (
                <Card>
                  <div className="card-header">
                    <h3 className="title">Servicios</h3>
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
                    ? "No se encontraron servicios en tus citas que coincidan con la búsqueda"
                    : empleadoId
                      ? "No tienes servicios en tus citas. Los servicios aparecerán aquí cuando tengas citas asignadas."
                      : "No se pudo cargar la información del empleado"
                } />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}