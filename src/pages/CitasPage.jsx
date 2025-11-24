import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { logger } from '../services/logger';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, Button, Input, Select, Loading, Empty } from '../components/common/Components';
import { AlertSimple } from '../components/common/AlertSimple';
import { useAlert } from '../hooks/useAlert';
import { useAuth } from '../hooks/useAuth';
import '../pages/Pages.css';

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
        background: 'white',
        borderRadius: '16px',
        padding: '2rem',
        width: '90%',
        maxWidth: '400px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        position: 'relative',
        borderLeft: '5px solid #F59E0B'
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
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            fontSize: '2rem',
            color: '#92400e',
            fontWeight: '700',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)'
          }}>
            !
          </div>
          <h4 style={{
            margin: '0 0 0.8rem',
            color: '#1f2937',
            fontSize: '1.3rem',
            fontWeight: '700',
            letterSpacing: '-0.5px'
          }}>
            Confirmar Cita
          </h4>
          <p style={{
            color: '#6b7280',
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
            <i className="bi bi-check-circle" style={{ marginRight: '0.5rem' }}></i>
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
            <i className="bi bi-x-circle" style={{ marginRight: '0.5rem' }}></i>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}

function ModalIngreso({ show, onClose, cita, onSuccess }) {
  const [formData, setFormData] = useState({
    valor: '',
    extra: '',
    medio_pago: 'Efectivo',
    nota: ''
  });
  const [saving, setSaving] = useState(false);
  const { alert, success, error: showError } = useAlert();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.valor) {
      showError('El valor es requerido');
      return;
    }

    setSaving(true);
    try {
      await api.crearIngreso({
        fecha: new Date().toISOString().slice(0, 10),
        servicio: cita.servicio,
        empleado: cita.encargado,
        valor: parseFloat(formData.valor),
        extra: parseFloat(formData.extra || 0),
        medio_pago: formData.medio_pago,
        nota: formData.nota || null
      });

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
      logger.error('Error al crear ingreso', err.message);
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
        {/* Header fijo */}
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
            <i className="bi bi-cash-coin" style={{ color: '#8A5A6B' }}></i>
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

        {/* Información de la cita */}
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
            <i className="bi bi-info-circle"></i>
            Información de la Cita
          </h5>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.8rem',
            fontSize: '0.9rem'
          }}>
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
          </div>
        </div>

        {/* Contenido del formulario */}
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
            />
            <Input
              label="Extra"
              type="number"
              value={formData.extra}
              onChange={(e) => setFormData({ ...formData, extra: e.target.value })}
              min="0"
              step="0.01"
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

export function CitasPage() {
 
}