import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { logger } from '../services/logger';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, Button, Input, Select, Loading, Empty } from '../components/common/Components';
import { AlertSimple } from '../components/common/AlertSimple';
import { useAlert } from '../hooks/useAlert';
import { useAuth } from '../hooks/useAuth';
import '../pages/Pages.css';

// Componente Modal para el formulario
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

export function CitasPage() {
  const [citas, setCitas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ 
    hora_inicio: '', 
    duracion: '30', 
    encargado: '', 
    cliente: '',
    servicio: ''
  });
  const { alert, success, error: showError, warning } = useAlert();
  const { user } = useAuth();

  const isEmpleado = user?.rolInfo?.nombre === 'Empleado';

  useEffect(() => {
    fetchData();
  }, [fecha]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const citasRes = await api.getCitas(`?fecha_inicio=${fecha}&fecha_fin=${fecha}`);
      let citasFiltradas = citasRes.data || [];
      
      if (isEmpleado) {
        citasFiltradas = citasFiltradas.filter(c => c.encargado === user.id);
        logger.info('Citas del empleado', `${citasFiltradas.length} citas`);
      }
      
      setCitas(citasFiltradas);

      const [clientesRes, usuariosRes, serviciosRes] = await Promise.all([
        api.getClientes(),
        api.getUsuarios(),
        api.getServicios()
      ]);
      setClientes(clientesRes.data || []);
      setUsuarios(usuariosRes.data || []);
      setServicios(serviciosRes.data || []);

      if (isEmpleado && usuariosRes.data) {
        setFormData(prev => ({ ...prev, encargado: user.id.toString() }));
      }
    } catch (err) {
      logger.error('Error al cargar datos', err.message);
      showError(err.message || 'Error al cargar datos');
    }
    setLoading(false);
  };

  const handleServicioChange = (servicioId) => {
    setFormData({...formData, servicio: servicioId});

    if (servicioId) {
      const servicioSeleccionado = servicios.find(s => s.id === parseInt(servicioId));
      if (servicioSeleccionado && servicioSeleccionado.duracion) {
        logger.info('Servicio seleccionado', `Duración: ${servicioSeleccionado.duracion} min`);
        setFormData(prev => ({
          ...prev,
          servicio: servicioId,
          duracion: servicioSeleccionado.duracion.toString()
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.hora_inicio || !formData.cliente || !formData.encargado || !formData.duracion || !formData.servicio) {
      warning('Completa: Hora, Cliente, Empleado, Servicio y Duración');
      return;
    }

    setSaving(true);
    try {
      const dataToSend = {
        fecha: fecha,
        hora_inicio: formData.hora_inicio,
        duracion: parseInt(formData.duracion),
        encargado: parseInt(formData.encargado),
        cliente: parseInt(formData.cliente),
        servicio: parseInt(formData.servicio)
      };

      logger.info('Enviando cita', JSON.stringify(dataToSend));
      await api.crearCita(dataToSend);
      success('Cita creada exitosamente!');
      
      setFormData({ 
        hora_inicio: '', 
        duracion: '30', 
        encargado: isEmpleado ? user.id.toString() : '', 
        cliente: '',
        servicio: ''
      });
      setShowModal(false);
      fetchData();
    } catch (err) {
      logger.error('Error al crear cita', err.response?.data?.message || err.message);
      showError(err.response?.data?.message || err.message || 'Error al crear cita');
    }
    setSaving(false);
  };

  const handleCambiarEstado = async (citaId, nuevoEstado) => {
    try {
      await api.cambiarEstadoCita(citaId, nuevoEstado);
      success(`Cita ${nuevoEstado}`);
      logger.success('Estado cambiado', nuevoEstado);
      fetchData();
    } catch (err) {
      logger.error('Error al cambiar estado', err.message);
      showError(err.message || 'Error al cambiar estado');
    }
  };

  const handleOpenModal = () => {
    setShowModal(true);
    setFormData({ 
      hora_inicio: '', 
      duracion: '30', 
      encargado: isEmpleado ? user.id.toString() : '', 
      cliente: '',
      servicio: ''
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ 
      hora_inicio: '', 
      duracion: '30', 
      encargado: isEmpleado ? user.id.toString() : '', 
      cliente: '',
      servicio: ''
    });
  };

  return (
    <MainLayout title={isEmpleado ? "Mi Agenda" : "Gestión de Citas"}>
      {alert && <AlertSimple message={alert.message} type={alert.type} />}

      <div className="page-header">
        <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        <Button onClick={handleOpenModal}>
          <i className="bi bi-plus-circle"></i> Nueva Cita
        </Button>
      </div>

      {/* Modal para el formulario */}
      <Modal show={showModal} onClose={handleCloseModal}>
        <h4 className="form-title" style={{marginBottom: '1.5rem', fontWeight: '700', color: '#333'}}>
          <i className="bi bi-calendar-plus"></i> Agendar Cita
        </h4>
        <form onSubmit={handleSubmit} className="form-layout">
          <Input 
            label="Hora *" 
            type="time" 
            value={formData.hora_inicio} 
            onChange={(e) => setFormData({...formData, hora_inicio: e.target.value})} 
            required 
            autoFocus
          />
          <Select 
            label="Servicio *" 
            value={formData.servicio} 
            onChange={(e) => handleServicioChange(e.target.value)}
            options={servicios} 
            required 
          />
          <Input 
            label="Duración (minutos) *" 
            type="number" 
            value={formData.duracion} 
            onChange={(e) => setFormData({...formData, duracion: e.target.value})} 
            min="15"
            step="15"
            required 
            disabled={!formData.servicio}
            title="Se rellena automáticamente al seleccionar servicio"
          />
          <Select 
            label="Cliente *" 
            value={formData.cliente} 
            onChange={(e) => setFormData({...formData, cliente: e.target.value})} 
            options={clientes} 
            required 
          />
          <Select 
            label="Empleado *" 
            value={formData.encargado} 
            onChange={(e) => setFormData({...formData, encargado: e.target.value})} 
            options={usuarios} 
            required 
            disabled={isEmpleado}
          />
          <div className="form-actions">
            <Button variant="primary" disabled={saving}>
              {saving ? 'Creando...' : 'Crear Cita'}
            </Button>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      <div className="citas-grid">
        {loading ? (
          <Loading />
        ) : citas.length > 0 ? (
          citas.map(c => (
            <Card key={c.id} className="cita-card">
              <div className="cita-card-header">
                <div>
                  <div className="cita-hora">
                    <i className="bi bi-clock-history"></i> {c.hora_inicio} - {c.hora_fin}
                  </div>
                  <h5 className="cita-cliente">{c.clienteInfo?.nombre} {c.clienteInfo?.apellido}</h5>
                  <p className="cita-empleado">
                    <i className="bi bi-person-badge"></i> {c.encargadoInfo?.nombre}
                  </p>
                </div>
                <span className={`badge badge-${c.estado || 'pendiente'}`}>
                  {c.estado || 'Pendiente'}
                </span>
              </div>
              <div className="cita-card-body">
                <p><i className="bi bi-briefcase"></i> {c.servicioInfo?.nombre || 'Sin servicio'}</p>
                <p><i className="bi bi-telephone"></i> {c.clienteInfo?.telefono || 'Sin teléfono'}</p>
                <p><i className="bi bi-hourglass-split"></i> {c.duracion} minutos</p>
              </div>
              {c.estado !== 'completada' && c.estado !== 'cancelada' && (
                <div className="cita-card-actions">
                  {(!c.estado || c.estado === 'pendiente') && (
                    <Button onClick={() => handleCambiarEstado(c.id, 'confirmada')} variant="primary" style={{fontSize: '0.85rem', padding: '0.4rem 0.8rem'}}>
                      <i className="bi bi-check-circle"></i> Confirmar
                    </Button>
                  )}
                  {c.estado === 'confirmada' && (
                    <Button onClick={() => handleCambiarEstado(c.id, 'completada')} variant="success" style={{fontSize: '0.85rem', padding: '0.4rem 0.8rem'}}>
                      <i className="bi bi-check2-circle"></i> Completar
                    </Button>
                  )}
                  {(!c.estado || c.estado === 'pendiente' || c.estado === 'confirmada') && (
                    <Button onClick={() => handleCambiarEstado(c.id, 'cancelada')} variant="secondary" style={{fontSize: '0.85rem', padding: '0.4rem 0.8rem'}}>
                      <i className="bi bi-x-circle"></i> Cancelar
                    </Button>
                  )}
                </div>
              )}
            </Card>
          ))
        ) : (
          <Empty message={isEmpleado ? "Sin citas asignadas" : "Sin citas para esta fecha"} />
        )}
      </div>
    </MainLayout>
  );
}