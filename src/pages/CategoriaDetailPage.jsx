import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, Button, Input, Loading, Empty, Select } from '../components/common/Components';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { AlertSimple } from '../components/common/AlertSimple';
import { useAlert } from '../hooks/useAlert';
import { useCategorias } from '../context/CategoriasContext';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import '../pages/Pages.css';
import { usePermissions } from '../hooks/usePermissions';

function ModalConfirmacionPersonalizado({ show, onClose, onConfirm, title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', isDanger = false }) {
  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 3000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '2rem',
        width: '90%',
        maxWidth: '400px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        position: 'relative',
        borderLeft: `5px solid ${isDanger ? '#ef4444' : '#f59e0b'}`
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#666',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#fee2e2';
            e.target.style.color = '#ef4444';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'none';
            e.target.style.color = '#666';
          }}
        >
          ×
        </button>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: isDanger ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            fontSize: '2rem',
            color: isDanger ? '#991b1b' : '#92400e',
            fontWeight: '700',
            boxShadow: `0 4px 12px rgba(${isDanger ? '239, 68, 68' : '245, 158, 11'}, 0.2)`
          }}>
            {isDanger ? '!' : '?'}
          </div>
          <h4 style={{
            margin: '0 0 0.8rem',
            color: '#1f2937',
            fontSize: '1.3rem',
            fontWeight: '700',
            letterSpacing: '-0.5px'
          }}>
            {title}
          </h4>
          <p style={{
            color: '#6b7280',
            margin: 0,
            lineHeight: '1.5',
            fontSize: '0.95rem'
          }}>
            {message}
          </p>
        </div>

        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center'
        }}>
          <Button
            variant="primary"
            onClick={onConfirm}
            style={{
              minWidth: '120px',
              background: isDanger ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #F74780 0%, #8A5A6B 100%)',
              border: 'none',
              borderRadius: '25px',
              fontWeight: '600',
              padding: '0.8rem 1.5rem',
              fontSize: '0.9rem'
            }}
          >
            {confirmText}
          </Button>
          <Button
            variant="secondary"
            onClick={onClose}
            style={{
              minWidth: '120px',
              background: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '25px',
              fontWeight: '600',
              padding: '0.8rem 1.5rem',
              fontSize: '0.9rem',
              color: '#6b7280'
            }}
          >
            {cancelText}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Modal({ show, onClose, children }) {
  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#666',
            zIndex: 1001
          }}
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

// Agregar el Modal de Tarifas
function ModalTarifas({ show, onClose, servicio }) {
  const [tarifasActuales, setTarifasActuales] = useState([]);
  const [tarifasHistorial, setTarifasHistorial] = useState([]);
  const [loading, setLoading] = useState(false);
  const { alert, error: showError } = useAlert();

  useEffect(() => {
    if (show && servicio) {
      loadTarifas();
    }
  }, [show, servicio]);

  const loadTarifas = async () => {
    if (!servicio) return;

    setLoading(true);
    try {
      const [tarifasActualesRes, tarifasHistorialRes] = await Promise.all([
        api.getTarifasActuales(servicio.id),
        api.getTarifasServicio(servicio.id)
      ]);

      // Mapear la tarifa actual a un array con la estructura esperada
      const tarifaActualData = tarifasActualesRes.data ? [{
        id: tarifasActualesRes.data.id,
        precio: tarifasActualesRes.data.valor,
        fecha_inicio: tarifasActualesRes.data.fecha_inicio,
        fecha_fin: tarifasActualesRes.data.fecha_fin,
        servicio: tarifasActualesRes.data.servicio
      }] : [];

      // Mapear el historial de tarifas
      const historialData = tarifasHistorialRes.data?.historial?.map(tarifa => ({
        id: tarifa.id,
        precio: tarifa.valor,
        fecha_inicio: tarifa.fecha_inicio,
        fecha_fin: tarifa.fecha_fin,
        servicio: tarifa.servicio
      })) || [];

      setTarifasActuales(tarifaActualData);
      setTarifasHistorial(historialData);
    } catch (err) {
      showError(err.message || 'Error al cargar las tarifas');
    }
    setLoading(false);
  };

  const formatFecha = (fechaString) => {
    if (!fechaString) {
      const now = new Date();
      return `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    }

    try {
      if (fechaString.includes('/')) {
        return fechaString;
      }

      const fechaParts = fechaString.split('T')[0].split('-');
      if (fechaParts.length === 3) {
        const [year, month, day] = fechaParts;
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
      }

      const fecha = new Date(fechaString);
      if (isNaN(fecha.getTime())) {
        return 'Fecha inválida';
      }

      const fechaAjustada = new Date(fecha.getTime() + fecha.getTimezoneOffset() * 60000);
      const dia = fechaAjustada.getDate().toString().padStart(2, '0');
      const mes = (fechaAjustada.getMonth() + 1).toString().padStart(2, '0');
      const año = fechaAjustada.getFullYear();

      return `${dia}/${mes}/${año}`;
    } catch (error) {
      console.error('Error formateando fecha:', error, fechaString);
      return 'Fecha inválida';
    }
  };

  const formatMoneda = (valor) => {
    const numero = parseFloat(valor || 0);
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numero);
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1500
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#666',
            zIndex: 1001
          }}
        >
          ×
        </button>

        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ margin: 0, color: '#1F2937' }}>
            Tarifas - {servicio?.nombre}
          </h4>
        </div>

        {alert && <AlertSimple message={alert.message} type={alert.type} />}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Loading />
            <p style={{ marginTop: '1rem', color: '#6B7280' }}>Cargando tarifas...</p>
          </div>
        ) : (
          <div>
            {/* Tarifa Actual */}
            <div style={{ marginBottom: '2rem' }}>
              <h5 style={{
                color: '#F74780',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                Tarifa Actual
              </h5>
              {tarifasActuales.length > 0 ? (
                <div style={{
                  background: '#faeef2ff',
                  border: '1px solid #FFC1D5',
                  borderRadius: '8px',
                  padding: '1rem'
                }}>
                  {tarifasActuales.map((tarifa, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem 0'
                    }}>
                      <div>
                        <strong style={{ color: '#8A5A6B' }}>
                          {formatMoneda(tarifa.precio)}
                        </strong>
                        <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                          Vigente desde: {formatFecha(tarifa.fecha_inicio)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '8px',
                  padding: '1rem',
                  textAlign: 'center',
                  color: '#DC2626'
                }}>
                  <i className="bi bi-exclamation-triangle" style={{ marginRight: '0.5rem' }}></i>
                  No hay tarifa actual registrada
                </div>
              )}
            </div>

            {/* Historial de Tarifas */}
            <div>
              <h5 style={{
                color: '#F74780',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                Historial de Tarifas
              </h5>
              {tarifasHistorial.length > 0 ? (
                <div style={{
                  maxHeight: '300px',
                  overflow: 'auto',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{
                      background: '#F8FAFC',
                      position: 'sticky',
                      top: 0
                    }}>
                      <tr>
                        <th style={{
                          padding: '0.75rem',
                          textAlign: 'left',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          color: '#374151',
                          borderBottom: '1px solid #E5E7EB'
                        }}>
                          Precio
                        </th>
                        <th style={{
                          padding: '0.75rem',
                          textAlign: 'left',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          color: '#374151',
                          borderBottom: '1px solid #E5E7EB'
                        }}>
                          Fecha Inicio
                        </th>
                        <th style={{
                          padding: '0.75rem',
                          textAlign: 'left',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          color: '#374151',
                          borderBottom: '1px solid #E5E7EB'
                        }}>
                          Fecha Fin
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tarifasHistorial.map((tarifa, index) => (
                        <tr key={index} style={{
                          borderBottom: '1px solid #FFC1D5',
                          background: tarifasActuales.some(t => t.id === tarifa.id) ? '#faeef2ff' : 'white'
                        }}>
                          <td style={{
                            padding: '0.75rem',
                            fontWeight: tarifasActuales.some(t => t.id === tarifa.id) ? '700' : '500',
                            color: tarifasActuales.some(t => t.id === tarifa.id) ? '#8A5A6B' : '#374151'
                          }}>
                            {formatMoneda(tarifa.precio)}
                          </td>
                          <td style={{
                            padding: '0.75rem',
                            color: '#6B7280',
                            fontSize: '0.85rem'
                          }}>
                            {formatFecha(tarifa.fecha_inicio)}
                          </td>
                          <td style={{
                            padding: '0.75rem',
                            color: '#6B7280',
                            fontSize: '0.85rem'
                          }}>
                            {formatFecha(tarifa.fecha_fin)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{
                  background: '#F3F4F6',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#6B7280'
                }}>
                  <i className="bi bi-inbox" style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block' }}></i>
                  No hay historial de tarifas
                </div>
              )}
            </div>

            <div style={{
              marginTop: '2rem',
              display: 'flex',
              justifyContent: 'flex-end',
              borderTop: '1px solid #F3F4F6',
              paddingTop: '1rem'
            }}>
              <Button variant="primary" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ModalConfirmacion({ show, onClose, onConfirm, cita }) {
  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000
    }}>
      <div style={{
        background: '#FFE0EA',
        borderRadius: '16px',
        border: '2px solid #f74780',
        padding: '2rem',
        width: '90%',
        maxWidth: '400px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#0f0f0fff',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#fee2e2';
            e.target.style.color = '#ef4444';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'none';
            e.target.style.color = '#666';
          }}
        >
          ×
        </button>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h4 style={{
            margin: '0 0 0.8rem',
            color: '#f74780',
            fontSize: '1.3rem',
            fontWeight: '700',
            letterSpacing: '-0.5px'
          }}>
            Confirmar Cita
          </h4>
          <p style={{
            color: '#0e0e0eff',
            margin: 0,
            lineHeight: '1.5',
            fontSize: '0.95rem'
          }}>
            ¿Está seguro que desea confirmar la cita de <strong>{cita?.clienteInfo?.nombre} {cita?.clienteInfo?.apellido}</strong>?
          </p>
        </div>

        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center'
        }}>
          <Button
            variant="primary"
            onClick={onConfirm}
            style={{
              minWidth: '120px',
              background: 'linear-gradient(135deg, #F74780 0%, #8A5A6B 100%)',
              border: 'none',
              borderRadius: '25px',
              fontWeight: '600',
              padding: '0.8rem 1.5rem',
              fontSize: '0.9rem'
            }}
          >
            Confirmar
          </Button>
          <Button
            variant="secondary"
            onClick={onClose}
            style={{
              minWidth: '120px',
              background: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '25px',
              fontWeight: '600',
              padding: '0.8rem 1.5rem',
              fontSize: '0.9rem',
              color: '#6b7280'
            }}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}

function ModalIngreso({ show, onClose, cita, onSuccess, servicios }) {
  const [formData, setFormData] = useState({
    valor: '',
    extra: '',
    medio_pago: 'Efectivo',
    nota: ''
  });
  const [saving, setSaving] = useState(false);
  const { alert, success, error: showError } = useAlert();

  const handleWheel = (e) => {
    e.target.blur();
  };

  useEffect(() => {
    if (show && cita) {
      const servicioEncontrado = servicios.find(s => s.id === cita.servicio);
      if (servicioEncontrado && servicioEncontrado.precio) {
        setFormData(prev => ({
          ...prev,
          valor: servicioEncontrado.precio.toString()
        }));
      }
    }
  }, [show, cita]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.valor) {
      showError('El valor es requerido');
      return;
    }

    setSaving(true);
    try {
      const ingresoData = {
        fecha: new Date().toISOString().slice(0, 10),
        servicio: parseInt(cita.servicio),
        empleado: parseInt(cita.encargado),
        cita: parseInt(cita.id),
        valor: parseFloat(formData.valor),
        extra: parseFloat(formData.extra || 0),
        medio_pago: formData.medio_pago,
        descripcion: formData.nota || ''
      };

      await api.crearIngreso(ingresoData);

      success('Ingreso registrado exitosamente!');
      setFormData({
        valor: '',
        extra: '',
        medio_pago: 'Efectivo',
        nota: ''
      });
      onSuccess();
      onClose();
    } catch (err) {
      showError(err.message || 'Error al registrar ingreso');
    }
    setSaving(false);
  };

  const handleClose = () => {
    setFormData({
      valor: '',
      extra: '',
      medio_pago: 'Efectivo',
      nota: ''
    });
    onClose();
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1500
    }}>
      <div className="card-component" style={{
        width: '90%',
        maxWidth: '500px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        margin: '1rem',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem 2rem',
          borderBottom: '2px solid var(--border)',
          flexShrink: 0,
          background: 'linear-gradient(135deg, #F9F5FF 0%, #FCE7F3 100%)'
        }}>
          <h4 style={{
            margin: 0,
            fontWeight: '700',
            color: 'var(--dark)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            Registrar Ingreso
          </h4>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--gray)',
              padding: 0,
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#fee2e2';
              e.target.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'none';
              e.target.style.color = 'var(--gray)';
            }}
          >
            ×
          </button>
        </div>

        <div style={{
          padding: '1.5rem 2rem',
          background: '#f8f9fa',
          borderBottom: '1px solid var(--border)'
        }}>
          <h5 style={{
            margin: '0 0 0.8rem',
            color: 'var(--dark)',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            Información de la Cita
          </h5>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.8rem',
            fontSize: '0.9rem'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <strong style={{ color: '#6b7280', fontSize: '0.8rem' }}>ID Cita:</strong>
              <span style={{ fontWeight: 'bold', color: '#f74780' }}>#{cita?.id}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <strong style={{ color: '#6b7280', fontSize: '0.8rem' }}>Cliente:</strong>
              <span>{cita?.clienteInfo?.nombre} {cita?.clienteInfo?.apellido}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <strong style={{ color: '#6b7280', fontSize: '0.8rem' }}>Empleado:</strong>
              <span>{cita?.encargadoInfo?.nombre}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <strong style={{ color: '#6b7280', fontSize: '0.8rem' }}>Servicio:</strong>
              <span>{cita?.servicioInfo?.nombre}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <strong style={{ color: '#6b7280', fontSize: '0.8rem' }}>Duración:</strong>
              <span>{cita?.duracion} min</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <strong style={{ color: '#6b7280', fontSize: '0.8rem' }}>Precio servicio:</strong>
              <span>${cita?.servicioInfo?.precio ? parseFloat(cita.servicioInfo.precio).toFixed(2) : '0.00'}</span>
            </div>
          </div>
        </div>

        <div style={{
          padding: '2rem',
          overflowY: 'auto',
          flex: 1
        }}>
          {alert && <AlertSimple message={alert.message} type={alert.type} />}

          <form onSubmit={handleSubmit} className="form-layout">
            <Input
              label="Valor *"
              type="number"
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              min="0"
              step="0.01"
              required
              autoFocus
              onWheel={handleWheel}
            />
            <Input
              label="Extra"
              type="number"
              value={formData.extra}
              onChange={(e) => setFormData({ ...formData, extra: e.target.value })}
              min="0"
              step="0.01"
              onWheel={handleWheel}
            />
            <Select
              label="Medio de Pago *"
              value={formData.medio_pago}
              onChange={(e) => setFormData({ ...formData, medio_pago: e.target.value })}
              options={[
                { id: 'Efectivo', nombre: 'Efectivo' },
                { id: 'Tarjeta', nombre: 'Tarjeta' },
                { id: 'Transferencia', nombre: 'Transferencia' },
                { id: 'Bizum', nombre: 'Bizum' }
              ]}
              required
            />
            <div style={{ gridColumn: '1 / -1' }}>
              <Input
                label="Nota"
                type="text"
                value={formData.nota}
                onChange={(e) => setFormData({ ...formData, nota: e.target.value })}
                placeholder="Observaciones adicionales..."
              />
            </div>
            <div className="form-actions">
              <Button variant="primary" disabled={saving}>
                {saving ? 'Registrando...' : 'Registrar Ingreso'}
              </Button>
              <Button variant="secondary" onClick={handleClose}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function CategoriaDetailPage() {
  const { categoriaNombre } = useParams();
  const navigate = useNavigate();
  const { categorias } = useCategorias();
  const { user } = useAuth();
  const { can } = usePermissions();
  const [activeTab, setActiveTab] = useState('servicios');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [editingServicio, setEditingServicio] = useState(null);
  const [showEditServicioModal, setShowEditServicioModal] = useState(false);
  const [deletingServicio, setDeletingServicio] = useState(null);
  const [editingCliente, setEditingCliente] = useState(null);
  const [showEditClienteModal, setShowEditClienteModal] = useState(false);
  const [deletingCliente, setDeletingCliente] = useState(null);
  const [changingClienteState, setChangingClienteState] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showIngresoModal, setShowIngresoModal] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);

  const [showTarifasModal, setShowTarifasModal] = useState(false);
  const [servicioTarifas, setServicioTarifas] = useState(null);

  const [servicios, setServicios] = useState([]);
  const [showServicioModal, setShowServicioModal] = useState(false);
  const [servicioForm, setServicioForm] = useState({
    nombre: '',
    descripcion: '',
    duracion: '',
    precio: '',
    porcentaje: ''
  });

  const [clientes, setClientes] = useState([]);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [clienteForm, setClienteForm] = useState({
    nombre: '',
    apellido: '',
    tipo_documento: 'CC',
    documento: '',
    telefono: ''
  });

  const [citas, setCitas] = useState([]);
  const [showCitaModal, setShowCitaModal] = useState(false);
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [filtroMes, setFiltroMes] = useState('');
  const [citaForm, setCitaForm] = useState({
    hora_inicio: '',
    duracion: '30',
    encargado: '',
    cliente: '',
    servicio: ''
  });
  const [empleados, setEmpleados] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchServicio, setSearchServicio] = useState('');
  const [searchCliente, setSearchCliente] = useState('');
  const { alert, success, error: showError, warning } = useAlert();

  const decodedNombre = decodeURIComponent(categoriaNombre || '');
  const categoria = categorias.find(cat => cat.nombre === decodedNombre);
  const isEmpleado = user?.rolInfo?.nombre === 'Empleado';

  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [showEditCitaModal, setShowEditCitaModal] = useState(false);
  const [editCitaForm, setEditCitaForm] = useState({
    fecha: '',
    hora_inicio: '',
    duracion: '30',
    encargado: '',
    cliente: '',
    servicio: ''
  });
  const [citaEditando, setCitaEditando] = useState(null);

  // Estados para modal de confirmación personalizado
  const [showConfirmacionPersonalizada, setShowConfirmacionPersonalizada] = useState(false);
  const [confirmacionData, setConfirmacionData] = useState({
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    isDanger: false,
    onConfirm: null
  });

  useEffect(() => {
    if (categoria) {
      loadServicios();

      if (clientes.length === 0) {
        loadClientes();
      }

      if (empleados.length === 0) {
        loadEmpleados();
      }

      if (activeTab === 'agenda') {
        loadCitas();
      }
    }
  }, [fecha, categoria, activeTab, filtroMes, filtroEstado]); // Agrega filtroMes
  const loadEmpleados = async () => {
    try {
      const empleadosRes = await api.getUsuarios();
      setEmpleados(empleadosRes.data || []);
    } catch (error) {
      console.error('Error al cargar empleados:', error);
    }
  };


  const loadServicios = async () => {
    if (!categoria) return;

    setLoading(true);
    try {
      const response = await api.getServicios();
      const allServicios = response.data || [];

      let serviciosCategoria = allServicios.filter(servicio =>
        servicio.categoria_id === categoria.id ||
        servicio.categoriaId === categoria.id ||
        servicio.categoria === categoria.id
      );

      if (isEmpleado) {
        serviciosCategoria = serviciosCategoria.filter(servicio =>
          getEstadoServicio(servicio) === 'ACTIVO'
        );
      }

      setServicios(serviciosCategoria);

    } catch (error) {
      showError('Error al cargar servicios');
    }
    setLoading(false);
  };

  const loadClientes = async () => {
    if (!categoria) return;

    try {
      const clientesRes = await api.getClientes();
      setClientes(clientesRes.data || []);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  };

  const loadCitas = async () => {
    if (!categoria) return;

    setLoading(true);
    try {
      let params = '';

      // Si hay filtro por mes, usar ese rango
      if (filtroMes) {
        const año = filtroMes.split('-')[0];
        const mes = filtroMes.split('-')[1];
        const primerDia = `${filtroMes}-01`;
        const ultimoDia = new Date(año, mes, 0).getDate(); // Último día del mes
        const fechaFin = `${filtroMes}-${ultimoDia.toString().padStart(2, '0')}`;
        params = `?fecha_inicio=${primerDia}&fecha_fin=${fechaFin}`;
      } else {
        params = `?fecha_inicio=${fecha}&fecha_fin=${fecha}`;
      }

      if (filtroEstado !== 'todas') {
        params += `&estado=${filtroEstado}`;
      }

      const [citasRes, serviciosRes] = await Promise.all([
        api.getCitas(params),
        api.getServicios()
      ]);

      const todasLasCitas = citasRes.data || [];
      const todosLosServicios = serviciosRes.data || [];

      const serviciosDeCategoria = todosLosServicios.filter(servicio =>
        servicio.categoria_id === categoria.id ||
        servicio.categoriaId === categoria.id ||
        servicio.categoria === categoria.id
      );

      const serviciosIdsDeCategoria = serviciosDeCategoria.map(s => s.id);

      let citasFiltradas = todasLasCitas.filter(cita => {
        const servicioId = cita.servicio;
        return serviciosIdsDeCategoria.includes(servicioId);
      });

      if (isEmpleado) {
        citasFiltradas = citasFiltradas.filter(c => c.encargado === user.id);
      }

      setCitas(citasFiltradas);

    } catch (error) {
      showError('Error al cargar citas');
    }
    setLoading(false);
  };

  const handleVerTarifas = (servicio) => {
    setServicioTarifas(servicio);
    setShowTarifasModal(true);
  };

  const handleCreateServicio = async (e) => {
    e.preventDefault();

    if (!servicioForm.nombre.trim() || !servicioForm.duracion || !servicioForm.precio) {
      warning('Completa todos los campos requeridos');
      return;
    }

    // Validaciones adicionales para valores negativos
    const duracion = parseInt(servicioForm.duracion);
    const precio = parseFloat(servicioForm.precio);
    const porcentaje = servicioForm.porcentaje ? parseFloat(servicioForm.porcentaje) : 0;

    if (duracion < 0) {
      warning('La duración no puede ser negativa');
      return;
    }

    if (precio < 0) {
      warning('El precio no puede ser negativo');
      return;
    }

    if (porcentaje < 0) {
      warning('El porcentaje no puede ser negativo');
      return;
    }

    if (duracion % 15 !== 0) {
      warning('La duración debe ser múltiplo de 15 minutos (15, 30, 45, 60, 75, 90, etc.)');
      return;
    }

    setSaving(true);
    try {
      const servicioData = {
        nombre: servicioForm.nombre.trim(),
        descripcion: servicioForm.descripcion.trim(),
        duracion: duracion,
        precio: precio,
        categoria: categoria.id,
        porcentaje: porcentaje
      };

      await api.crearServicio(servicioData);
      success('Servicio creado exitosamente!');

      setServicioForm({ nombre: '', descripcion: '', duracion: '30', precio: '', porcentaje: '' });
      setShowServicioModal(false);
      await loadServicios();

    } catch (error) {
      if (error.message.includes('duracion') || error.message.includes('duraci')) {
        showError('Error en la duración: debe ser múltiplo de 15 minutos');
      } else if (error.message.includes('precio')) {
        showError('Error en el precio: debe ser un número válido');
      } else {
        showError(error.message || 'Error al crear servicio');
      }
    }
    setSaving(false);
  };

  const handleCreateCliente = async (e) => {
    e.preventDefault();

    if (!clienteForm.nombre.trim() || !clienteForm.apellido.trim() || !clienteForm.documento.trim()) {
      warning('Completa todos los campos requeridos');
      return;
    }

    setSaving(true);
    try {
      await api.crearCliente(clienteForm);
      success('Cliente creado exitosamente!');

      setClienteForm({
        nombre: '',
        apellido: '',
        tipo_documento: 'CC',
        documento: '',
        telefono: ''
      });

      setShowClienteModal(false);
      await loadClientes();

    } catch (error) {
      showError(error.response?.data?.message || error.message || 'Error al crear cliente');
    }
    setSaving(false);
  };

  const handleEditCliente = (cliente) => {
    const estado = getEstadoCliente(cliente);

    if (estado === 'INACTIVO' || estado === 'INACTIVA' || estado === '0' || estado === 'FALSE') {
      showError('No se puede editar un cliente inactivo. Primero debe activarlo.');
      return;
    }

    setEditingCliente(cliente);
    setClienteForm({
      nombre: cliente.nombre || '',
      apellido: cliente.apellido || '',
      tipo_documento: cliente.tipo_documento || 'CC',
      documento: cliente.documento || '',
      telefono: cliente.telefono || ''
    });
    setShowEditClienteModal(true);
  };

  const handleUpdateCliente = async (e) => {
    e.preventDefault();

    if (!editingCliente || !clienteForm.nombre.trim() || !clienteForm.apellido.trim() || !clienteForm.documento.trim()) {
      warning('Completa todos los campos requeridos');
      return;
    }

    setSaving(true);
    try {
      const clienteData = {
        nombre: clienteForm.nombre.trim(),
        apellido: clienteForm.apellido.trim(),
        tipo_documento: clienteForm.tipo_documento,
        documento: clienteForm.documento.trim(),
        telefono: clienteForm.telefono || ''
      };

      await api.actualizarCliente(editingCliente.id, clienteData);
      success('Cliente actualizado exitosamente!');

      setClienteForm({
        nombre: '',
        apellido: '',
        tipo_documento: 'CC',
        documento: '',
        telefono: ''
      });
      setEditingCliente(null);
      setShowEditClienteModal(false);
      await loadClientes();

    } catch (error) {
      showError(error.message || 'Error al actualizar cliente');
    }
    setSaving(false);
  };

  const handleDeleteCliente = async (cliente) => {
    setConfirmacionData({
      title: 'Marcar cliente como inactivo',
      message: `¿Está seguro de que desea marcar a ${cliente.nombre} ${cliente.apellido} como inactivo?`,
      confirmText: 'Marcar inactivo',
      cancelText: 'Cancelar',
      type: 'warning', // Cambiado de isDanger a type
      onConfirm: async () => {
        try {
          setDeletingCliente(cliente.id);
          await api.cambiarEstadoCliente(cliente.id, 'inactivo');
          success('Cliente marcado como inactivo exitosamente!');
          await loadClientes();
        } catch (err) {
          showError(err.message || 'Error al eliminar cliente');
        } finally {
          setDeletingCliente(null);
        }
      }
    });
    setShowConfirmacionPersonalizada(true);
  };

  const handleToggleEstadoCliente = async (cliente) => {
    const estadoActual = getEstadoCliente(cliente);
    const nuevoEstado = estadoActual === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    const accion = nuevoEstado === 'ACTIVO' ? 'activar' : 'desactivar';

    setConfirmacionData({
      title: `${accion.charAt(0).toUpperCase() + accion.slice(1)} cliente`,
      message: `¿Está seguro de que desea ${accion} a ${cliente.nombre} ${cliente.apellido}?`,
      confirmText: accion.charAt(0).toUpperCase() + accion.slice(1),
      cancelText: 'Cancelar',
      isDanger: nuevoEstado === 'INACTIVO',
      onConfirm: async () => {
        setChangingClienteState(cliente.id);
        try {
          await api.cambiarEstadoCliente(cliente.id, nuevoEstado.toLowerCase());
          success(`Cliente ${accion}do exitosamente!`);
          await loadClientes();
        } catch (err) {
          showError(err.message || `Error al ${accion} cliente`);
        } finally {
          setChangingClienteState(null);
        }
        setShowConfirmacionPersonalizada(false);
      }
    });
    setShowConfirmacionPersonalizada(true);
  };


  const handleCancelEditCliente = () => {
    setEditingCliente(null);
    setShowEditClienteModal(false);
    setClienteForm({
      nombre: '',
      apellido: '',
      tipo_documento: 'CC',
      documento: '',
      telefono: ''
    });
  };

  const handleCreateCita = async (e) => {
    e.preventDefault();
    if (!citaForm.hora_inicio || !citaForm.cliente || !citaForm.encargado || !citaForm.servicio) {
      warning('Completa todos los campos requeridos');
      return;
    }

    setSaving(true);
    try {
      // Usar la fecha del formulario (si hay filtro por mes, usar fecha actual, sino usar la fecha seleccionada)
      const fechaCita = filtroMes ? new Date().toISOString().slice(0, 10) : fecha;

      const citaData = {
        fecha: fechaCita,
        hora_inicio: citaForm.hora_inicio,
        duracion: parseInt(citaForm.duracion),
        encargado: parseInt(citaForm.encargado),
        cliente: parseInt(citaForm.cliente),
        servicio: parseInt(citaForm.servicio)
      };

      await api.crearCita(citaData);
      success('Cita creada exitosamente!');
      setCitaForm({ hora_inicio: '', duracion: '30', encargado: '', cliente: '', servicio: '' });
      setShowCitaModal(false);

      setTimeout(() => {
        loadCitas();
      }, 500);

    } catch (err) {
      const errorMsg = err.message || '';
      console.error('DEBUG - Error completo:', err);
      console.error('DEBUG - Status:', err.status);
      console.error('DEBUG - Data:', err.data);

      if (err.status === 409 || errorMsg.includes('Ya existe') || errorMsg.includes('conflicto') || errorMsg.includes('horario')) {
        showError('Ya existe una citas en ese horario para el empleado seleccionado. Por favor, elige otro horario o empleado.');
      } else {
        showError(errorMsg || 'Error al crear cita');
      }
    }
    setSaving(false);
  };

  const handleEditCita = (cita) => {
    setCitaEditando(cita);
    setEditCitaForm({
      fecha: cita.fecha || fecha,
      hora_inicio: cita.hora_inicio || '',
      duracion: cita.duracion?.toString() || '',
      encargado: cita.encargado?.toString() || '',
      cliente: cita.cliente?.toString() || '',
      servicio: cita.servicio?.toString() || ''
    });
    setShowEditCitaModal(true);
  };

  const handleUpdateCita = async (e) => {
    e.preventDefault();

    if (!editCitaForm.hora_inicio || !editCitaForm.cliente || !editCitaForm.encargado || !editCitaForm.servicio) {
      warning('Completa todos los campos requeridos');
      return;
    }

    setSaving(true);
    try {
      const citaData = {
        fecha: editCitaForm.fecha,
        hora_inicio: editCitaForm.hora_inicio,
        duracion: parseInt(editCitaForm.duracion),
        encargado: parseInt(editCitaForm.encargado),
        cliente: parseInt(editCitaForm.cliente),
        servicio: parseInt(editCitaForm.servicio)
      };

      await api.actualizarCita(citaEditando.id, citaData);
      success('Cita actualizada exitosamente!');

      setShowEditCitaModal(false);
      setCitaEditando(null);
      await loadCitas();

    } catch (err) {
      // Mostrar el error específico de validación
      showError(err.message || 'Error de validación al actualizar cita');
      console.error('Error detallado:', err);
    }
    setSaving(false);
  };

  const handleCancelarCita = async (citaId) => {
    setConfirmacionData({
      title: 'Cancelar cita',
      message: '¿Está seguro de que desea cancelar esta cita?',
      confirmText: 'Cancelar cita',
      cancelText: 'Mantener',
      onConfirm: async () => {
        try {
          await api.cancelarCita(citaId);
          success('Cita cancelada exitosamente!');
          await loadCitas();
        } catch (err) {
          showError(err.message || 'Error al cancelar cita');
        }
        setShowConfirmacionPersonalizada(false);
      }
    });
    setShowConfirmacionPersonalizada(true);
  };


  const handleCambiarEstadoCita = async (citaId, nuevoEstado) => {
    if (nuevoEstado === 'completada') {
      setConfirmacionData({
        title: 'Completar cita',
        message: '¿Ha completado la cita?',
        confirmText: 'Sí, completar',
        cancelText: 'Cancelar',
        isDanger: false,
        onConfirm: async () => {
          try {
            await api.cambiarEstadoCita(citaId, nuevoEstado);
            success(`Cita ${nuevoEstado}`);

            const citaCompletada = citas.find(c => c.id === citaId);
            if (citaCompletada) {
              setCitaSeleccionada(citaCompletada);
              setTimeout(() => {
                setShowIngresoModal(true);
              }, 500);
            }

            await loadCitas();
          } catch (err) {
            showError(err.message || 'Error al cambiar estado');
          }
          setShowConfirmacionPersonalizada(false);
        }
      });
      setShowConfirmacionPersonalizada(true);
    } else {
      try {
        await api.cambiarEstadoCita(citaId, nuevoEstado);
        success(`Cita ${nuevoEstado}`);
        await loadCitas();
      } catch (err) {
        showError(err.message || 'Error al cambiar estado');
      }
    }
  };

  const handleEditServicio = (servicio) => {
    const estado = getEstadoServicio(servicio);

    if (estado === 'INACTIVO' || estado === 'INACTIVA' || estado === '0' || estado === 'FALSE') {
      showError('No se puede editar un servicio inactivo.');
      return;
    }
    setEditingServicio(servicio);
    setServicioForm({
      nombre: servicio.nombre || '',
      descripcion: servicio.descripcion || '',
      duracion: servicio.duracion?.toString() || '30',
      precio: servicio.precio?.toString() || '',
      porcentaje: servicio.porcentaje?.toString() || ''
    });
    setShowEditServicioModal(true);
  };

  const handleUpdateServicio = async (e) => {
    e.preventDefault();

    if (!editingServicio || !servicioForm.nombre.trim() || !servicioForm.duracion || !servicioForm.precio) {
      warning('Completa todos los campos requeridos');
      return;
    }

    const duracion = parseInt(servicioForm.duracion);
    const precio = parseFloat(servicioForm.precio);
    const porcentaje = servicioForm.porcentaje ? parseFloat(servicioForm.porcentaje) : 0;

    if (duracion < 0) {
      warning('La duración no puede ser negativa');
      return;
    }

    if (precio < 0) {
      warning('El precio no puede ser negativo');
      return;
    }

    if (porcentaje < 0) {
      warning('El porcentaje no puede ser negativo');
      return;
    }

    if (duracion % 15 !== 0) {
      warning('La duración debe ser múltiplo de 15 minutos (15, 30, 45, 60, etc.)');
      return;
    }

    setSaving(true);
    try {
      const servicioData = {
        nombre: servicioForm.nombre.trim(),
        descripcion: servicioForm.descripcion.trim(),
        duracion: duracion,
        precio: precio,
        categoria: categoria.id,
        porcentaje: porcentaje
      };

      await api.actualizarServicio(editingServicio.id, servicioData);
      success('Servicio actualizado exitosamente!');

      setServicioForm({ nombre: '', descripcion: '', duracion: '30', precio: '', porcentaje: '' });
      setEditingServicio(null);
      setShowEditServicioModal(false);
      await loadServicios();

    } catch (error) {
      showError(error.message || 'Error al actualizar servicio');
    }
    setSaving(false);
  };

  const handleDeleteServicio = async (servicio) => {
    setConfirmacionData({
      title: 'Eliminar servicio',
      message: `¿Está seguro de que desea eliminar el servicio ${servicio.nombre}?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'error', // Cambiado de isDanger a type
      onConfirm: async () => {
        try {
          setDeletingServicio(servicio.id);
          await api.eliminarServicio(servicio.id);
          success('Servicio eliminado exitosamente!');
          await loadServicios();
        } catch (err) {
          showError(err.message || 'Error al eliminar servicio');
        } finally {
          setDeletingServicio(null);
        }
      }
    });
    setShowConfirmacionPersonalizada(true);
  };

  const handleCancelEdit = () => {
    setEditingServicio(null);
    setShowEditServicioModal(false);
    setServicioForm({ nombre: '', descripcion: '', duracion: '', precio: '', porcentaje: '' });
  };

  const handleToggleEstadoServicio = async (servicio) => {
    const estadoActual = String(servicio.estado || 'activo').toUpperCase();
    const esActivo = estadoActual === 'ACTIVO' || estadoActual === 'ACTIVA' || estadoActual === '1' || estadoActual === 'TRUE';

    const accion = esActivo ? 'inactivar' : 'activar';
    const nuevoEstado = esActivo ? 'INACTIVO' : 'ACTIVO';

    setConfirmacionData({
      title: esActivo ? 'Inactivar Servicio' : 'Activar Servicio',
      message: `¿Está seguro de que desea ${accion} el servicio "${servicio.nombre}"?`,
      confirmText: accion.charAt(0).toUpperCase() + accion.slice(1),
      cancelText: 'Cancelar',
      type: esActivo ? 'error' : 'success',
      onConfirm: async () => {
        try {
          await api.actualizarServicio(servicio.id, { estado: nuevoEstado.toLowerCase() });
          success(`Servicio ${accion}do exitosamente!`);
          loadServicios();
        } catch (err) {
          showError(err.message || `Error al ${accion} servicio`);
        }
        setShowConfirmacionPersonalizada(false);
      }
    });
    setShowConfirmacionPersonalizada(true);
  };

  const formatFecha = (fechaString) => {
    if (!fechaString) {
      const now = new Date();
      return `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    }

    try {
      // Si ya tiene formato DD/MM/YYYY, devolverlo tal cual
      if (fechaString.includes('/')) {
        return fechaString;
      }

      // Para formato YYYY-MM-DD, extraer las partes directamente
      const fechaParts = fechaString.split('T')[0].split('-');
      if (fechaParts.length === 3) {
        const [year, month, day] = fechaParts;
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
      }

      // Si viene en otro formato, usar Date pero forzar hora local
      const fecha = new Date(fechaString);
      if (isNaN(fecha.getTime())) {
        return 'Fecha inválida';
      }

      // Ajustar para compensar zona horaria
      const fechaAjustada = new Date(fecha.getTime() + fecha.getTimezoneOffset() * 60000);
      const dia = fechaAjustada.getDate().toString().padStart(2, '0');
      const mes = (fechaAjustada.getMonth() + 1).toString().padStart(2, '0');
      const año = fechaAjustada.getFullYear();

      return `${dia}/${mes}/${año}`;
    } catch (error) {
      console.error('Error formateando fecha:', error, fechaString);
      return 'Fecha inválida';
    }
  };

  const getEstadoServicio = (servicio) => {
    if (servicio.estado !== undefined && servicio.estado !== null) {
      const estado = String(servicio.estado).toUpperCase();
      // Normalizar diferentes representaciones de estado activo/inactivo
      if (estado === 'ACTIVO' || estado === 'ACTIVA' || estado === '1' || estado === 'TRUE' || estado === 'TRUE') {
        return 'ACTIVO';
      } else if (estado === 'INACTIVO' || estado === 'INACTIVA' || estado === '0' || estado === 'FALSE') {
        return 'INACTIVO';
      }
      return estado;
    }
    return 'ACTIVO';
  };

  const getEstadoCliente = (cliente) => {
    if (cliente.estado !== undefined && cliente.estado !== null) {
      return String(cliente.estado).toUpperCase();
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

  if (!categoria) {
    return (
      <MainLayout title="Categoría No Encontrada">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h3>Categoría no encontrada</h3>
          <p>La categoría "{decodedNombre}" no existe.</p>
          <Button variant="primary" onClick={() => navigate('/categorias')}>
            Volver a Categorías
          </Button>
        </div>
      </MainLayout>
    );
  }

  const serviciosFiltrados = servicios.filter(servicio =>
    servicio.nombre.toLowerCase().includes(searchServicio.toLowerCase())
  );

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchCliente.toLowerCase()) ||
    cliente.documento.includes(searchCliente)
  );

  const citasFiltradas = citas.filter(cita => {
    if (filtroEstado === 'todas') return true;
    return cita.estado === filtroEstado;
  });

  const handleConfirmarCita = (cita) => {
    console.log('DEBUG: handleConfirmarCita llamado con cita:', cita?.id);
    setCitaSeleccionada(cita);
    setShowConfirmModal(true);
  };

  const handleConfirmarCitaDefinitiva = async () => {
    if (!citaSeleccionada) {
      showError('No hay cita seleccionada');
      return;
    }

    try {
      await api.cambiarEstadoCita(citaSeleccionada.id, 'confirmada');

      setShowConfirmModal(false);

      success('Cita confirmada exitosamente!');

      await loadCitas();
    } catch (err) {
      showError(err.message || 'Error al confirmar cita');
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="app-layout">
      <Header />
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <main className="main-content">
        <button
          className="hamburger content-hamburger"
          onClick={() => setSidebarOpen(true)}
        >
          <i className="bi bi-list"></i>
        </button>

        <div className="page-container">
          {alert && <AlertSimple message={alert.message} type={alert.type} />}

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{
              display: 'flex',
              gap: '0',
              background: '#f7cedbff',
              padding: '0.25rem',
              borderRadius: '23px',
              width: '100%',
              height: '50px',
            }}>
              <button
                style={activeTab === 'servicios' ? {
                  padding: '0.5rem 1.5rem',
                  background: '#f74780',
                  borderRadius: '23px',
                  fontWeight: '600',
                  color: '#eef0f3ff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flex: 1,
                  border: 'none'
                } : {
                  padding: '0.5rem 1.5rem',
                  background: 'transparent',
                  border: 'none',
                  fontWeight: '600',
                  color: '#0f0f0fff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flex: 1
                }}
                onClick={() => setActiveTab('servicios')}
              >
                Servicios
              </button>
              <button
                style={activeTab === 'clientes' ? {
                  padding: '0.5rem 1.5rem',
                  background: '#f74780',
                  borderRadius: '23px',
                  fontWeight: '600',
                  color: '#eef0f3ff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flex: 1,
                  border: 'none'
                } : {
                  padding: '0.5rem 1.5rem',
                  background: 'transparent',
                  border: 'none',
                  fontWeight: '600',
                  color: '#0f0f0fff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flex: 1
                }}
                onClick={() => setActiveTab('clientes')}
              >
                Clientes
              </button>
              <button
                style={activeTab === 'agenda' ? {
                  padding: '0.5rem 1.5rem',
                  background: '#f74780',
                  borderRadius: '23px',
                  fontWeight: '600',
                  color: '#eef0f3ff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flex: 1,
                  border: 'none'
                } : {
                  padding: '0.5rem 1.5rem',
                  background: 'transparent',
                  border: 'none',
                  fontWeight: '600',
                  color: '#0f0f0fff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flex: 1
                }}
                onClick={() => setActiveTab('agenda')}
              >
                Agenda
              </button>
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>

            {activeTab === 'servicios' && (
              <div>
                <div className="title">
                  <h4 style={{ margin: 0 }}>Lista de servicios</h4>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {can('CREATE_SERVICIO') && (
                      <div className="categorias-main-title">
                        <Button onClick={() => setShowServicioModal(true)}>
                          + Nuevo Servicio
                        </Button>
                      </div>
                    )}
                  </div>
                  <Input
                    placeholder="Buscar por servicio..."
                    value={searchServicio}
                    onChange={(e) => setSearchServicio(e.target.value)}
                    style={{ width: '250px' }}
                  />
                </div>

                <Modal show={showEditServicioModal} onClose={handleCancelEdit}>
                  <h4 style={{ marginBottom: '1.5rem', fontWeight: '700', color: '#333' }}>
                    Editar Servicio: {editingServicio?.nombre}
                  </h4>
                  <form onSubmit={handleUpdateServicio} className="form-layout">
                    <Input
                      label="Nombre *"
                      value={servicioForm.nombre}
                      onChange={(e) => setServicioForm({ ...servicioForm, nombre: e.target.value })}
                      placeholder="Nombre del servicio"
                      required
                      autoFocus
                    />
                    <Input
                      label="Descripción"
                      value={servicioForm.descripcion}
                      onChange={(e) => setServicioForm({ ...servicioForm, descripcion: e.target.value })}
                      placeholder="Descripción del servicio"
                    />
                    <Input
                      label="Duración (minutos) *"
                      type="number"
                      value={servicioForm.duracion}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Validar que no sea negativo
                        if (parseInt(value) < 0) {
                          warning('La duración no puede ser negativa');
                          return;
                        }
                        setServicioForm({ ...servicioForm, duracion: value });
                      }}
                      placeholder="30, 45, 60..."
                      min="15"
                      step="15"
                      required
                      onWheel={(e) => e.target.blur()}
                    />
                    <Input
                      label="Precio *"
                      type="number"
                      value={servicioForm.precio}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Validar que no sea negativo
                        if (parseFloat(value) < 0) {
                          warning('El precio no puede ser negativo');
                          return;
                        }
                        setServicioForm({ ...servicioForm, precio: value });
                      }}
                      placeholder="000"
                      min="0"
                      step="0.01"
                      required
                      onWheel={(e) => e.target.blur()}
                    />
                    <Input
                      label="Porcentaje comisión"
                      type="number"
                      value={servicioForm.porcentaje}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Validar que no sea negativo
                        if (parseFloat(value) < 0) {
                          warning('El porcentaje no puede ser negativo');
                          return;
                        }
                        setServicioForm({ ...servicioForm, porcentaje: value });
                      }}
                      placeholder="0"
                      min="0"
                      max="100"
                      onWheel={(e) => e.target.blur()}
                    />
                    <div className="form-actions">
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={saving}
                      >
                        {saving ? 'Guardando...' : 'Actualizar Servicio'}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleCancelEdit}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </Modal>

                {can('CREATE_SERVICIO') && (
                  <Modal show={showServicioModal} onClose={() => setShowServicioModal(false)}>
                    <h4 style={{ marginBottom: '1.5rem', fontWeight: '700', color: '#333' }}>
                      Crear Servicio en {categoria.nombre}
                    </h4>
                    <form onSubmit={handleCreateServicio} className="form-layout">
                      <Input
                        label="Nombre *"
                        value={servicioForm.nombre}
                        onChange={(e) => setServicioForm({ ...servicioForm, nombre: e.target.value })}
                        placeholder="Nombre del servicio"
                        required
                        autoFocus
                      />
                      <Input
                        label="Descripción"
                        value={servicioForm.descripcion}
                        onChange={(e) => setServicioForm({ ...servicioForm, descripcion: e.target.value })}
                        placeholder="Descripción del servicio"
                      />
                      <Input
                        label="Duración (minutos) *"
                        type="number"
                        value={servicioForm.duracion}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Validar que no sea negativo
                          if (parseInt(value) < 0) {
                            warning('La duración no puede ser negativa');
                            return;
                          }
                          setServicioForm({ ...servicioForm, duracion: value });
                        }}
                        placeholder="30, 45, 60..."
                        min="15"
                        step="15"
                        required
                        onWheel={(e) => e.target.blur()}
                      />
                      <Input
                        label="Precio *"
                        type="number"
                        value={servicioForm.precio}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Validar que no sea negativo
                          if (parseFloat(value) < 0) {
                            warning('El precio no puede ser negativo');
                            return;
                          }
                          setServicioForm({ ...servicioForm, precio: value });
                        }}
                        placeholder="000"
                        min="0"
                        step="0.01"
                        required
                        onWheel={(e) => e.target.blur()}
                      />
                      <Input
                        label="Porcentaje comisión"
                        type="number"
                        value={servicioForm.porcentaje}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Validar que no sea negativo
                          if (parseFloat(value) < 0) {
                            warning('El porcentaje no puede ser negativo');
                            return;
                          }
                          setServicioForm({ ...servicioForm, porcentaje: value });
                        }}
                        placeholder="0"
                        min="0"
                        max="100"
                        onWheel={(e) => e.target.blur()}
                      />
                      <div className="form-actions">
                        <Button
                          type="submit"
                          variant="primary"
                          disabled={saving}
                        >
                          {saving ? 'Guardando...' : 'Crear Servicio'}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setShowServicioModal(false)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </Modal>
                )}

                <div className="table-container" style={{ marginTop: '1.5rem' }}>
                  {loading ? (
                    <Loading />
                  ) : serviciosFiltrados.length > 0 ? (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Servicio</th>
                          <th>Estado</th>
                          <th>Descripción</th>
                          <th>Duración</th>
                          {can('EDIT_SERVICIO') && <th>Acciones</th>}
                          {can('VIEW_TARIFAS') && <th>Tarifas</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {serviciosFiltrados.map(servicio => {
                          const estado = getEstadoServicio(servicio);
                          const estadoInfo = getColorEstado(estado);
                          const esActivo = estado === 'ACTIVO';

                          return (
                            <tr key={servicio.id}>
                              <td>
                                <strong>{servicio.nombre}</strong>
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
                              <td style={{ fontWeight: '500', color: '#374151' }}>
                                {servicio.duracion} minutos
                              </td>
                              {can('EDIT_SERVICIO') && (
                                <td>
                                  <div className="table-actions" style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => handleEditServicio(servicio)}
                                      title={
                                        !esActivo
                                          ? 'No se puede editar servicios inactivos'
                                          : 'Editar servicio'
                                      }
                                      disabled={
                                        deletingServicio === servicio.id ||
                                        !esActivo
                                      }
                                      style={{
                                        padding: '0.2rem 0.5rem',
                                        fontSize: '0.75rem',
                                        minWidth: 'auto',
                                        opacity: !esActivo ? 0.5 : 1,
                                        cursor: !esActivo ? 'not-allowed' : 'pointer'
                                      }}
                                    >
                                      <i className="bi bi-pencil"></i>
                                    </Button>

                                    {/* SOLUCIÓN: Solo mostrar botón de activar/inactivar, quitar el de eliminar */}
                                    <Button
                                      variant={esActivo ? "warning" : "success"}
                                      size="sm"
                                      onClick={() => handleToggleEstadoServicio(servicio)}
                                      title={esActivo ? 'Inactivar servicio' : 'Activar servicio'}
                                      disabled={deletingServicio === servicio.id}
                                      style={{
                                        padding: '0.2rem 0.5rem',
                                        fontSize: '0.75rem',
                                        minWidth: 'auto'
                                      }}
                                    >
                                      {esActivo ? (
                                        <i className="bi bi-pause-circle" title="Inactivar"></i>
                                      ) : (
                                        <i className="bi bi-play-circle" title="Activar"></i>
                                      )}
                                    </Button>
                                  </div>
                                </td>
                              )}
                              {can('VIEW_TARIFAS') && (
                                <td>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleVerTarifas(servicio)}
                                    title="Ver tarifas"
                                    style={{
                                      padding: '0.35rem 0.7rem',
                                      fontSize: '0.75rem',
                                      minWidth: 'auto',
                                      height: '32px'
                                    }}
                                  >
                                    Tarifas
                                  </Button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <Empty message={`No hay servicios en ${categoria.nombre}`} />
                  )}
                </div>
              </div>
            )}

            {activeTab === 'clientes' && (
              <div>
                <div className="title">
                  <h4 style={{ margin: 0 }}>Lista de Clientes</h4>
                  <Button onClick={() => setShowClienteModal(true)}>
                    + Nuevo Cliente
                  </Button>
                </div>

                <Modal show={showEditClienteModal} onClose={handleCancelEditCliente}>
                  <h4 style={{ marginBottom: '1.5rem', fontWeight: '700', color: '#333' }}>
                    Editar Cliente: {editingCliente?.nombre} {editingCliente?.apellido}
                  </h4>
                  <form onSubmit={handleUpdateCliente} className="form-layout">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <Input
                        label="Nombre *"
                        value={clienteForm.nombre}
                        onChange={(e) => setClienteForm({ ...clienteForm, nombre: e.target.value })}
                        placeholder="Nombre"
                        required
                        autoFocus
                      />
                      <Input
                        label="Apellido *"
                        value={clienteForm.apellido}
                        onChange={(e) => setClienteForm({ ...clienteForm, apellido: e.target.value })}
                        placeholder="Apellido"
                        required
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <Select
                        label="Tipo Documento *"
                        value={clienteForm.tipo_documento}
                        onChange={(e) => setClienteForm({ ...clienteForm, tipo_documento: e.target.value })}
                        options={[
                          { id: 'CC', nombre: 'Cédula de Ciudadanía' },
                          { id: 'TI', nombre: 'Tarjeta de Identidad' },
                          { id: 'CE', nombre: 'Cédula de Extranjería' }
                        ]}
                        required
                      />
                      <Input
                        label="Documento *"
                        value={clienteForm.documento}
                        onChange={(e) => setClienteForm({ ...clienteForm, documento: e.target.value })}
                        placeholder="Número de documento"
                        required
                      />
                    </div>
                    <Input
                      label="Teléfono"
                      value={clienteForm.telefono}
                      onChange={(e) => setClienteForm({ ...clienteForm, telefono: e.target.value })}
                    />
                    <div className="form-actions">
                      <Button variant="primary" disabled={saving}>
                        {saving ? 'Guardando...' : 'Actualizar Cliente'}
                      </Button>
                      <Button variant="secondary" onClick={handleCancelEditCliente}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </Modal>

                <Modal show={showClienteModal} onClose={() => setShowClienteModal(false)}>
                  <h4 style={{ marginBottom: '1.5rem', fontWeight: '700', color: '#333' }}>
                    Crear Cliente
                  </h4>
                  <form onSubmit={handleCreateCliente} className="form-layout">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <Input
                        label="Nombre *"
                        value={clienteForm.nombre}
                        onChange={(e) => setClienteForm({ ...clienteForm, nombre: e.target.value })}
                        placeholder="Nombre"
                        required
                        autoFocus
                      />
                      <Input
                        label="Apellido *"
                        value={clienteForm.apellido}
                        onChange={(e) => setClienteForm({ ...clienteForm, apellido: e.target.value })}
                        placeholder="Apellido"
                        required
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <Select
                        label="Tipo Documento *"
                        value={clienteForm.tipo_documento}
                        onChange={(e) => setClienteForm({ ...clienteForm, tipo_documento: e.target.value })}
                        options={[
                          { id: 'CC', nombre: 'Cédula de Ciudadanía' },
                          { id: 'TI', nombre: 'Tarjeta de Identidad' },
                          { id: 'CE', nombre: 'Cédula de Extranjería' }
                        ]}
                        required
                      />
                      <Input
                        label="Documento *"
                        value={clienteForm.documento}
                        onChange={(e) => setClienteForm({ ...clienteForm, documento: e.target.value })}
                        placeholder="Número de documento"
                        required
                      />
                    </div>
                    <Input
                      label="Teléfono"
                      value={clienteForm.telefono}
                      onChange={(e) => setClienteForm({ ...clienteForm, telefono: e.target.value })}
                    />
                    <div className="form-actions">
                      <Button variant="primary" disabled={saving}>
                        {saving ? 'Guardando...' : 'Crear Cliente'}
                      </Button>
                      <Button variant="secondary" onClick={() => setShowClienteModal(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </Modal>

                <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.8rem' }}>
                  <Input
                    placeholder="Buscar por nombre..."
                    value={searchCliente}
                    onChange={(e) => setSearchCliente(e.target.value)}
                    style={{ flex: 1 }}
                  />
                </div>

                <div className="table-container" style={{ marginTop: '1.5rem' }}>
                  {loading ? (
                    <Loading />
                  ) : clientesFiltrados.length > 0 ? (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Cliente</th>
                          <th>Documento</th>
                          <th>Tipo</th>
                          <th>Teléfono</th>
                          <th>Estado</th>
                          <th>Fecha Registro</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientesFiltrados.map(cliente => {
                          const estado = getEstadoCliente(cliente);
                          const estadoInfo = getColorEstado(estado);
                          const fechaRegistro = formatFecha(cliente.created_at || cliente.fecha_creacion || cliente.fechaRegistro);

                          return (
                            <tr key={cliente.id}>
                              <td>
                                <strong>{cliente.nombre} {cliente.apellido}</strong>
                              </td>
                              <td>{cliente.documento}</td>
                              <td>
                                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#666' }}>
                                  {cliente.tipo_documento}
                                </span>
                              </td>
                              <td>{cliente.telefono || '-'}</td>
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
                              <td style={{ fontWeight: '500', color: '#374151', fontSize: '0.85rem' }}>
                                {fechaRegistro}
                              </td>
                              <td>
                                <div className="table-actions" style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleEditCliente(cliente)}
                                    title={
                                      estado === 'INACTIVO' || estado === 'INACTIVA' || estado === '0' || estado === 'FALSE'
                                        ? 'No se puede editar clientes inactivos'
                                        : 'Editar cliente'
                                    }
                                    disabled={
                                      deletingCliente === cliente.id ||
                                      changingClienteState === cliente.id ||
                                      estado === 'INACTIVO' ||
                                      estado === 'INACTIVA' ||
                                      estado === '0' ||
                                      estado === 'FALSE'
                                    }
                                    style={{
                                      padding: '0.2rem 0.5rem',
                                      fontSize: '0.75rem',
                                      minWidth: 'auto',
                                      opacity: (estado === 'INACTIVO' || estado === 'INACTIVA' || estado === '0' || estado === 'FALSE') ? 0.5 : 1,
                                      cursor: (estado === 'INACTIVO' || estado === 'INACTIVA' || estado === '0' || estado === 'FALSE') ? 'not-allowed' : 'pointer'
                                    }}
                                  >
                                    <i className="bi bi-pencil"></i>
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <Empty message="No hay clientes registrados" />
                  )}
                </div>
              </div>
            )}

            {activeTab === 'agenda' && (
              <div>
                <div className="title">
                  <h4 style={{ margin: 0 }}>Agenda</h4>
                  <div className="categorias-main-title">
                    <Button onClick={() => setShowCitaModal(true)}>
                      + Nueva Cita
                    </Button>
                  </div>
                </div>

                {/* Filtros de Agenda MEJORADOS */}
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  flexWrap: 'wrap'
                }}>
                  {/* Filtro por día */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#374151' }}>
                      Filtro por día:
                    </label>
                    <Input
                      type="date"
                      value={fecha}
                      onChange={(e) => {
                        setFecha(e.target.value);
                        setFiltroMes(''); // Limpiar filtro por mes cuando se selecciona un día
                      }}
                      style={{ width: '200px' }}
                    />
                  </div>

                  {/* Filtro por mes */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#374151' }}>
                      O filtrar por mes:
                    </label>
                    <Input
                      type="month"
                      value={filtroMes}
                      onChange={(e) => {
                        setFiltroMes(e.target.value);
                        setFecha(new Date().toISOString().slice(0, 10)); // Resetear fecha día
                      }}
                      style={{ width: '200px' }}
                      placeholder="Seleccionar mes"
                    />
                  </div>

                  {/* Filtro por estado */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#374151' }}>
                      Estado:
                    </label>
                    <Select
                      value={filtroEstado}
                      onChange={(e) => setFiltroEstado(e.target.value)}
                      style={{ width: '200px' }}
                      options={[
                        { id: 'todas', nombre: 'Todas las citas' },
                        { id: 'pendiente', nombre: 'Pendientes' },
                        { id: 'confirmada', nombre: 'Confirmadas' },
                        { id: 'completada', nombre: 'Completadas' },
                        { id: 'cancelada', nombre: 'Canceladas' }
                      ]}
                    />
                  </div>

                  {/* Botón para limpiar filtros */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'transparent' }}>
                      Limpiar
                    </label>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setFiltroMes('');
                        setFecha(new Date().toISOString().slice(0, 10));
                        setFiltroEstado('todas');
                      }}
                      style={{ width: '120px' }}
                    >
                      Limpiar Filtros
                    </Button>
                  </div>
                </div>

                <Modal show={showCitaModal} onClose={() => setShowCitaModal(false)}>
                  <h4 style={{ marginBottom: '1.5rem', fontWeight: '700', color: '#333' }}>
                    Agendar Cita
                  </h4>
                  <form onSubmit={handleCreateCita} className="form-layout">
                    <Input
                      label="Fecha de la cita *"
                      type="date"
                      value={filtroMes ? new Date().toISOString().slice(0, 10) : fecha}
                      onChange={(e) => {
                        if (!filtroMes) {
                          setFecha(e.target.value);
                        }
                      }}
                      required
                    />

                    <Input
                      label="Hora *"
                      type="time"
                      value={citaForm.hora_inicio}
                      onChange={(e) => setCitaForm({ ...citaForm, hora_inicio: e.target.value })}
                      required
                      autoFocus
                    />
                    <Select
                      label="Servicio *"
                      value={citaForm.servicio}
                      onChange={(e) => {
                        const servicioId = e.target.value;
                        setCitaForm({ ...citaForm, servicio: servicioId });
                        if (servicioId) {
                          const servicioSeleccionado = servicios.find(s => s.id === parseInt(servicioId));
                          if (servicioSeleccionado?.duracion) {
                            setCitaForm(prev => ({
                              ...prev,
                              duracion: servicioSeleccionado.duracion.toString()
                            }));
                          }
                        }
                      }}
                      options={servicios.filter(servicio => getEstadoServicio(servicio) === 'ACTIVO')}
                      required
                    />
                    <Input
                      label="Duración (minutos) *"
                      type="number"
                      value={citaForm.duracion}
                      onChange={(e) => setCitaForm({ ...citaForm, duracion: e.target.value })}
                      min="15"
                      step="15"
                      required
                      disabled={!citaForm.servicio}
                    />
                    <Select
                      label="Cliente *"
                      value={citaForm.cliente}
                      onChange={(e) => setCitaForm({ ...citaForm, cliente: e.target.value })}
                      options={clientes}
                      required
                    />
                    <Select
                      label="Empleado *"
                      value={citaForm.encargado}
                      onChange={(e) => setCitaForm({ ...citaForm, encargado: e.target.value })}
                      options={empleados}
                      required
                      disabled={isEmpleado}
                    />
                    <div className="form-actions">
                      <Button variant="primary" disabled={saving}>
                        {saving ? 'Creando...' : 'Crear Cita'}
                      </Button>
                      <Button variant="secondary" onClick={() => setShowCitaModal(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </Modal>

                <Modal show={showEditCitaModal} onClose={() => setShowEditCitaModal(false)}>
                  <h4 style={{ marginBottom: '1.5rem', fontWeight: '700', color: '#333' }}>
                    Editar Cita
                  </h4>
                  <form onSubmit={handleUpdateCita} className="form-layout">
                    <Input
                      label="Fecha *"
                      type="date"
                      value={editCitaForm.fecha}
                      onChange={(e) => setEditCitaForm({ ...editCitaForm, fecha: e.target.value })}
                      required
                    />
                    <Input
                      label="Hora *"
                      type="time"
                      value={editCitaForm.hora_inicio}
                      onChange={(e) => setEditCitaForm({ ...editCitaForm, hora_inicio: e.target.value })}
                      required
                    />
                    <Select
                      label="Servicio *"
                      value={editCitaForm.servicio}
                      onChange={(e) => setEditCitaForm({ ...editCitaForm, servicio: e.target.value })}
                      options={servicios.filter(servicio => getEstadoServicio(servicio) === 'ACTIVO')}
                      required
                    />
                    <Input
                      label="Duración (minutos) *"
                      type="number"
                      value={editCitaForm.duracion}
                      onChange={(e) => setEditCitaForm({ ...editCitaForm, duracion: e.target.value })}
                      min="15"
                      step="15"
                      required
                    />
                    <Select
                      label="Cliente *"
                      value={editCitaForm.cliente}
                      onChange={(e) => setEditCitaForm({ ...editCitaForm, cliente: e.target.value })}
                      options={clientes}
                      required
                    />
                    <Select
                      label="Empleado *"
                      value={editCitaForm.encargado}
                      onChange={(e) => setEditCitaForm({ ...editCitaForm, encargado: e.target.value })}
                      options={empleados}
                      required
                      disabled={isEmpleado}
                    />
                    <div className="form-actions">
                      <Button variant="primary" disabled={saving}>
                        {saving ? 'Actualizando...' : 'Actualizar Cita'}
                      </Button>
                      <Button variant="secondary" onClick={() => setShowEditCitaModal(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </Modal>

                <div className="citas-grid" style={{ marginTop: '1.5rem' }}>
                  {loading ? (
                    <Loading />
                  ) : citasFiltradas.length > 0 ? (
                    citasFiltradas.map(cita => (
                      <Card key={cita.id} className="cita-card">
                        <div className="cita-card-header">
                          <div>
                            <div className="cita-hora">
                              <i className="bi bi-calendar"></i> {formatFecha(cita.fecha)}
                            </div>
                            <div className="cita-hora">
                              <i className="bi bi-clock-history"></i> {cita.hora_inicio} - {cita.hora_fin}
                            </div>
                            <h5 className="cita-cliente">{cita.clienteInfo?.nombre} {cita.clienteInfo?.apellido}</h5>
                            <p className="cita-empleado">
                              <i className="bi bi-person-badge"></i> {cita.encargadoInfo?.nombre}
                            </p>
                          </div>
                          <span className={`badge badge-${cita.estado || 'pendiente'}`}>
                            {cita.estado || 'Pendiente'}
                          </span>
                        </div>
                        <div className="cita-card-body">
                          <p><i className="bi bi-briefcase"></i> {cita.servicioInfo?.nombre || 'Sin servicio'}</p>
                          <p><i className="bi bi-telephone"></i> {cita.clienteInfo?.telefono || 'Sin teléfono'}</p>
                          <p><i className="bi bi-hourglass-split"></i> {cita.duracion} minutos</p>
                        </div>
                        <div className="cita-card-actions">
                          {/* Botón Editar - solo para citas pendientes o confirmadas */}
                          {(cita.estado === 'pendiente' || cita.estado === 'confirmada') && (
                            <Button
                              onClick={() => handleEditCita(cita)}
                              variant="secondary"
                              size="sm"
                              title="Editar cita"
                            >
                              <i className="bi bi-pencil"></i> Editar
                            </Button>
                          )}

                          {/* Botones de estado */}
                          {cita.estado === 'pendiente' && (
                            <Button
                              onClick={() => handleConfirmarCita(cita)}
                              variant="primary"
                              size="sm"
                            >
                              <i className="bi bi-check-circle"></i> Confirmar
                            </Button>
                          )}

                          {cita.estado === 'confirmada' && (
                            <Button
                              onClick={() => handleCambiarEstadoCita(cita.id, 'completada')}
                              variant="success"
                              size="sm"
                            >
                              <i className="bi bi-check2-all"></i> Completar
                            </Button>
                          )}

                          {/* Botón Cancelar - para citas pendientes o confirmadas */}
                          {(cita.estado === 'pendiente' || cita.estado === 'confirmada') && (
                            <Button
                              onClick={() => handleCancelarCita(cita.id)}
                              variant="danger"
                              size="sm"
                            >
                              <i className="bi bi-x-circle"></i> Cancelar
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))
                  ) : (
                    <Empty message={`No hay citas para los filtros seleccionados`} />
                  )}
                </div>
              </div>
            )}
          </div>

          <ModalTarifas
            show={showTarifasModal}
            onClose={() => {
              setShowTarifasModal(false);
              setServicioTarifas(null);
            }}
            servicio={servicioTarifas}
          />

          <ModalConfirmacion
            show={showConfirmModal}
            onClose={() => setShowConfirmModal(false)}
            onConfirm={handleConfirmarCitaDefinitiva}
            cita={citaSeleccionada}
          />

          <ModalIngreso
            show={showIngresoModal}
            onClose={() => {
              setShowIngresoModal(false);
              setCitaSeleccionada(null);
            }}
            cita={citaSeleccionada}
            onSuccess={() => {
              setShowIngresoModal(false);
              setCitaSeleccionada(null);
              loadCitas();
            }}
            servicios={servicios}
          />

          {showConfirmacionPersonalizada && (
            <AlertSimple
              show={showConfirmacionPersonalizada}
              onClose={() => setShowConfirmacionPersonalizada(false)}
              onConfirm={confirmacionData.onConfirm}
              title={confirmacionData.title} // Este título se mostrará en lugar del default
              message={confirmacionData.message}
              type={confirmacionData.type}
              confirmText={confirmacionData.confirmText}
              cancelText={confirmacionData.cancelText}
              showCancel={true}
            />
          )}
        </div>
      </main>
    </div>

  );
}