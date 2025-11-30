import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { logger } from '../services/logger';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { Card, Button, Input, Select, Loading, Empty } from '../components/common/Components';
import { AlertSimple } from '../components/common/AlertSimple';
import { useAlert } from '../hooks/useAlert';
import '../pages/Pages.css';

function ModalIngreso({ show, onClose, empleados, servicios, onSuccess }) {
  const [formData, setFormData] = useState({
    servicio: '',
    empleado: '',
    valor: '',
    extra: '',
    medio_pago: 'Efectivo',
    nota: ''
  });
  const [saving, setSaving] = useState(false);
  const { alert, success, error: showError } = useAlert();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.servicio || !formData.empleado || !formData.valor) {
      showError('Completa los campos requeridos');
      return;
    }

    setSaving(true);
    try {
      await api.crearIngreso({
        fecha: new Date().toISOString().slice(0, 10),
        servicio: parseInt(formData.servicio),
        empleado: parseInt(formData.empleado),
        valor: parseFloat(formData.valor),
        extra: parseFloat(formData.extra || 0),
        medio_pago: formData.medio_pago,
        nota: formData.nota || null
      });

      success('Ingreso registrado exitosamente!');
      setFormData({
        servicio: '',
        empleado: '',
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
      servicio: '',
      empleado: '',
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
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        margin: '1rem',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
      }}>
        {/* Header fijo */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem 2rem',
          borderBottom: '2px solid var(--border)',
          flexShrink: 0
        }}>
          <h4 style={{ margin: 0, fontWeight: '700', color: 'var(--dark)' }}>
            Nuevo Ingreso
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
              borderRadius: '50%'
            }}
          >
            ×
          </button>
        </div>

        <div style={{
          padding: '2rem',
          overflowY: 'auto',
          flex: 1
        }}>
          {alert && <AlertSimple message={alert.message} type={alert.type} />}

          <form onSubmit={handleSubmit} className="form-layout">
            <Select
              label="Servicio *"
              value={formData.servicio}
              onChange={(e) => setFormData({ ...formData, servicio: e.target.value })}
              options={servicios.map(s => ({
                id: s.id,
                nombre: s.nombre || s.nombre_servicio || 'Sin nombre'
              }))}
              required
            />
            <Select
              label="Empleado *"
              value={formData.empleado}
              onChange={(e) => setFormData({ ...formData, empleado: e.target.value })}
              options={empleados.map(e => ({
                id: e.id,
                nombre: `${e.nombre || ''} ${e.apellido || ''}`.trim() || 'Sin nombre'
              }))}
              required
            />
            <Input
              label="Valor *"
              type="number"
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              min="0"
              step="0.01"
              required
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

function ModalCategoriaEgreso({ show, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: ''
  });
  const [saving, setSaving] = useState(false);
  const [localAlert, setLocalAlert] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      setLocalAlert({ message: 'El nombre de la categoría es requerido', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      await api.crearCategoriaEgreso({
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || null
      });

      setLocalAlert({ message: 'Categoría creada exitosamente!', type: 'success' });
      setFormData({
        nombre: '',
        descripcion: ''
      });
      onSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      logger.error('Error al crear categoría', err.message);
      setLocalAlert({ message: err.message || 'Error al crear categoría', type: 'error' });
    }
    setSaving(false);
  };

  const handleClose = () => {
    setFormData({
      nombre: '',
      descripcion: ''
    });
    setLocalAlert(null);
    onClose();
  };

  useEffect(() => {
    if (show) {
      setLocalAlert(null);
    }
  }, [show]);

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
        width: '90%',
        maxWidth: '500px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        margin: '1rem',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem 2rem',
          borderBottom: '2px solid var(--border)',
          flexShrink: 0
        }}>
          <h4 style={{ margin: 0, fontWeight: '700', color: 'var(--dark)' }}>
            Nueva Categoría
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
              borderRadius: '50%'
            }}
          >
            ×
          </button>
        </div>

        <div style={{
          padding: '2rem',
          overflowY: 'auto',
          flex: 1
        }}>
          {localAlert && <AlertSimple message={localAlert.message} type={localAlert.type} />}

          <form onSubmit={handleSubmit} className="form-layout">
            <Input
              label="Nombre de la categoría *"
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Mantenimiento, Materiales, Servicios..."
              required
              autoFocus
            />
            <div style={{ gridColumn: '1 / -1' }}>
              <Input
                label="Descripción"
                type="text"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción opcional de la categoría..."
              />
            </div>

            <div className="form-actions">
              <Button variant="primary" disabled={saving}>
                {saving ? 'Creando...' : 'Crear Categoría'}
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

function ModalEgreso({ show, onClose, categorias, onSuccess }) {
  const [formData, setFormData] = useState({
    categoria: '',
    valor: '',
    medio_pago: 'Efectivo',
    proveedor: '',
    descripcion: ''
  });
  const [saving, setSaving] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: 'success',
    message: '',
    title: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.categoria) {
      setAlertConfig({
        type: 'error',
        title: 'Campo requerido',
        message: 'Selecciona una categoría'
      });
      setShowAlert(true);
      return;
    }

    if (!formData.valor) {
      setAlertConfig({
        type: 'error',
        title: 'Campo requerido',
        message: 'Ingresa el valor del egreso'
      });
      setShowAlert(true);
      return;
    }

    const valorNumerico = parseFloat(formData.valor);
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      setAlertConfig({
        type: 'error',
        title: 'Valor inválido',
        message: 'El valor del egreso debe ser mayor a 0'
      });
      setShowAlert(true);
      return;
    }

    setSaving(true);
    try {
      await api.crearEgreso({
        fecha: new Date().toISOString().slice(0, 10),
        categoria: parseInt(formData.categoria),
        valor: valorNumerico,
        medio_pago: formData.medio_pago,
        proveedor: formData.proveedor || '',
        descripcion: formData.descripcion || ''
      });

      setAlertConfig({
        type: 'success',
        title: '¡Éxito!',
        message: 'Egreso registrado exitosamente'
      });
      setShowAlert(true);

      setTimeout(() => {
        setFormData({
          categoria: '',
          valor: '',
          medio_pago: 'Efectivo',
          proveedor: '',
          descripcion: ''
        });
        onSuccess();
        onClose();
      }, 2000);

    } catch (err) {
      logger.error('Error al crear egreso', err);

      let errorMessage = 'Error al registrar egreso';

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setAlertConfig({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
      setShowAlert(true);
    }
    setSaving(false);
  };

  const handleClose = () => {
    setFormData({
      categoria: '',
      valor: '',
      medio_pago: 'Efectivo',
      proveedor: '',
      descripcion: ''
    });
    onClose();
  };

  const handleAlertClose = () => {
    setShowAlert(false);
  };

  if (!show) return null;

  return (
    <>
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
          width: '90%',
          maxWidth: '500px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          margin: '1rem',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.5rem 2rem',
            borderBottom: '2px solid var(--border)',
            flexShrink: 0
          }}>
            <h4 style={{ margin: 0, fontWeight: '700', color: 'var(--dark)' }}>
              Nuevo Egreso
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
                borderRadius: '50%'
              }}
            >
              ×
            </button>
          </div>

          <div style={{
            padding: '2rem',
            overflowY: 'auto',
            flex: 1
          }}>
            <form onSubmit={handleSubmit} className="form-layout">
              <Select
                label="Categoría *"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                options={categorias.map(cat => ({
                  id: cat.id,
                  nombre: cat.nombre
                }))}
                required
                placeholder="Selecciona una categoría"
              />
              <Input
                label="Valor *"
                type="number"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                min="0.01"
                step="0.01"
                required
              />
              <Select
                label="Medio de Pago *"
                value={formData.medio_pago}
                onChange={(e) => setFormData({ ...formData, medio_pago: e.target.value })}
                options={[
                  { id: 'Efectivo', nombre: 'Efectivo' },
                  { id: 'Tarjeta', nombre: 'Tarjeta' },
                  { id: 'Transferencia', nombre: 'Transferencia' }
                ]}
                required
              />
              <Input
                label="Proveedor"
                type="text"
                value={formData.proveedor}
                onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                placeholder="Nombre del proveedor (opcional)"
              />
              <div style={{ gridColumn: '1 / -1' }}>
                <Input
                  label="Descripción"
                  type="text"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Detalles adicionales del egreso (opcional)"
                />
              </div>

              <div className="form-actions">
                <Button variant="primary" disabled={saving}>
                  {saving ? 'Registrando...' : 'Registrar Egreso'}
                </Button>
                <Button variant="secondary" onClick={handleClose}>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <AlertSimple
        show={showAlert}
        onClose={handleAlertClose}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        confirmText="Aceptar"
        showCancel={false}
      />
    </>
  );
}

function EgresosTab({
  egresos,
  loading,
  busqueda,
  onBusquedaChange,
  onRefresh,
  onNuevoEgreso,
  onNuevaCategoria,
  fechaInicio,
  fechaFin,
  onFechaInicioChange,
  onFechaFinChange
}) {
  return (
    <div>
      <div style={{
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        marginBottom: '1rem',
        flexWrap: 'wrap'
      }}>
        <Button
          variant="categorias"
          onClick={onNuevaCategoria}
        >
          Nueva Categoría
        </Button>

        <Button variant="primary" onClick={onNuevoEgreso}>
          <i className="bi bi-plus-circle"></i> Nuevo Egreso
        </Button>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        flexWrap: 'wrap'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          flex: 1,
          flexWrap: 'wrap'
        }}>
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-end'
          }}>
            <Input
              label="Desde"
              type="date"
              value={fechaInicio}
              onChange={onFechaInicioChange}
              style={{ minWidth: '100px' }}
            />
            <Input
              label="Hasta"
              type="date"
              value={fechaFin}
              onChange={onFechaFinChange}
              style={{ minWidth: '100px' }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '100px' }}>
            <Input
              placeholder="Buscar egresos..."
              value={busqueda}
              onChange={onBusquedaChange}
              icon="search"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : egresos.length > 0 ? (
        <div>
          <div className="card-header">
            <h3 className="card-title">
              <i className="bi bi-list-check"></i>
              Registros de Egresos
            </h3>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Categoría</th>
                  <th>Proveedor</th>
                  <th>Medio de Pago</th>
                  <th>Descripción</th>
                  <th>Importe</th>
                </tr>
              </thead>
              <tbody>
                {egresos.map(egreso => (
                  <tr key={egreso.id}>
                    <td>
                      <span style={{
                        fontWeight: '600',
                        color: 'var(--dark)'
                      }}>
                        {new Date(egreso.fecha + 'T00:00:00Z').toLocaleDateString('es-CO', { timeZone: 'UTC' })}
                      </span>
                    </td>
                    <td>{egreso.categoriaInfo?.nombre}</td>
                    <td>{egreso.proveedor || '-'}</td>
                    <td>
                      <span className="badge" style={{
                        background: '#FEE2E2',
                        color: '#991B1B'
                      }}>
                        {egreso.medio_pago}
                      </span>
                    </td>
                    <td>{egreso.descripcion || '-'}</td>
                    <td style={{
                      fontWeight: '700',
                      fontSize: '1.1rem',
                      color: '#ef4444'
                    }}>
                      -${parseFloat(egreso.valor).toLocaleString('es-CO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <Empty message={
          busqueda ?
            "No se encontraron egresos con la búsqueda actual" :
            "No hay egresos en el rango seleccionado"
        } />
      )}
    </div>
  );
}

function Tabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'ingresos', label: 'Ingresos', icon: 'bi-arrow-down-circle' },
    { id: 'egresos', label: 'Egresos', icon: 'bi-arrow-up-circle' }
  ];

  return (
    <div className="tabs-container">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <i className={`bi ${tab.icon}`}></i>
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function IngresosTab({
  ingresos,
  loading,
  busqueda,
  onBusquedaChange,
  onRefresh,
  onNuevoIngreso,
  fechaInicio,
  fechaFin,
  onFechaInicioChange,
  onFechaFinChange
}) {

  const [showDetallesModal, setShowDetallesModal] = useState(false);
  const [ingresoSeleccionado, setIngresoSeleccionado] = useState(null);
  const [loadingDetalles, setLoadingDetalles] = useState(false);

  const handleVerDetalles = async (ingresoId) => {
    setLoadingDetalles(true);
    try {
      const response = await api.getIngresosById(ingresoId);
      setIngresoSeleccionado(response.data);
      setShowDetallesModal(true);
    } catch (err) {
      console.error('Error al cargar detalles del ingreso:', err);
    }
    setLoadingDetalles(false);
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        flexWrap: 'wrap'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          flex: 1,
          flexWrap: 'wrap'
        }}>
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-end'
          }}>
            <Input
              label="Desde"
              type="date"
              value={fechaInicio}
              onChange={onFechaInicioChange}
              style={{ minWidth: '100px' }}
            />
            <Input
              label="Hasta"
              type="date"
              value={fechaFin}
              onChange={onFechaFinChange}
              style={{ minWidth: '100px' }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '100px' }}>
            <Input
              placeholder="Buscar ingresos..."
              value={busqueda}
              onChange={onBusquedaChange}
              icon="search"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : ingresos.length > 0 ? (
        <div>
          <div className="card-header">
            <h3 className="card-title">
              <i className="bi bi-list-check"></i>
              Registros de Ingresos
            </h3>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha/Nota</th>
                  <th>Servicio</th>
                  <th>Empleado</th>
                  <th>Medio de Pago</th>
                  <th>Importe</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ingresos.map(ingreso => (
                  <tr key={ingreso.id}>
                    <td>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem'
                      }}>
                        <span style={{
                          fontWeight: '600',
                          color: 'var(--dark)'
                        }}>
                          {new Date(ingreso.fecha + 'T00:00:00Z').toLocaleDateString('es-CO', { timeZone: 'UTC' })}
                          {ingreso.created_at && (
                            <span style={{
                              fontSize: '0.875rem',
                              color: 'var(--gray)',
                              marginLeft: '0.5rem'
                            }}>
                              {new Date(ingreso.created_at).toLocaleTimeString('es-CO', {
                                hour: '2-digit',
                                minute: '2-digit',
                                timeZone: 'UTC'
                              })}
                            </span>
                          )}
                        </span>
                        {ingreso.nota && (
                          <span style={{
                            fontSize: '0.875rem',
                            color: 'var(--gray)',
                            fontStyle: 'italic'
                          }}>
                            {ingreso.nota}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{ingreso.servicioInfo?.nombre}</td>
                    <td>
                      {ingreso.empleadoInfo?.nombre} {ingreso.empleadoInfo?.apellido}
                    </td>
                    <td>
                      <span className="badge" style={{
                        background: ingreso.medio_pago === 'Efectivo' ? '#d1fae5' :
                          ingreso.medio_pago === 'Tarjeta' ? '#dbeafe' :
                            ingreso.medio_pago === 'Transferencia' ? '#f3e8ff' : '#fce7f3',
                        color: ingreso.medio_pago === 'Efectivo' ? '#065f46' :
                          ingreso.medio_pago === 'Tarjeta' ? '#1e40af' :
                            ingreso.medio_pago === 'Transferencia' ? '#7c3aed' : '#be185d'
                      }}>
                        {ingreso.medio_pago}
                      </span>
                    </td>
                    <td style={{
                      fontWeight: '700',
                      fontSize: '1.1rem',
                      color: '#10b981'
                    }}>
                      +${(parseFloat(ingreso.valor) + parseFloat(ingreso.extra || 0)).toLocaleString('es-CO')}
                    </td>
                    <td>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleVerDetalles(ingreso.id)}
                        disabled={loadingDetalles}
                        style={{
                          padding: '0.35rem 0.7rem',
                          fontSize: '0.75rem',
                          minWidth: 'auto'
                        }}
                      >
                        <i className="bi bi-eye"></i> Detalles
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <Empty message={
          busqueda ?
            "No se encontraron ingresos con la búsqueda actual" :
            "No hay ingresos en el rango seleccionado"
        } />
      )}
      <ModalDetallesIngreso
        show={showDetallesModal}
        onClose={() => {
          setShowDetallesModal(false);
          setIngresoSeleccionado(null);
        }}
        ingreso={ingresoSeleccionado}
      />
    </div>
  );
}

function ModalDetallesIngreso({ show, onClose, ingreso }) {
  const [citaInfo, setCitaInfo] = useState(null);
  const [loadingCita, setLoadingCita] = useState(false);

  useEffect(() => {
    if (show && ingreso) {
      fetchCitaInfo();
    } else {
      setCitaInfo(null);
    }
  }, [show, ingreso]);

  const fetchCitaInfo = async () => {
    const citaId = ingreso?.cita || ingreso?.cita_id;

    if (!citaId) {
      setCitaInfo(null);
      return;
    }

    setLoadingCita(true);
    try {
      const response = await api.getCitaById(citaId);
      setCitaInfo(response.data || response);
    } catch (err) {
      setCitaInfo(null);
    }
    setLoadingCita(false);
  };

  if (!show || !ingreso) return null;

  const formatFecha = (fechaString) => {
    if (!fechaString) return 'N/A';
    try {
      return new Date(fechaString + 'T00:00:00Z').toLocaleDateString('es-CO', { timeZone: 'UTC' });
    } catch {
      return fechaString;
    }
  };

  const formatHora = (horaString) => {
    if (!horaString) return 'N/A';
    return horaString.slice(0, 5);
  };

  const getNombreCompleto = (persona) => {
    if (!persona) return 'N/A';
    const nombre = persona.nombre || '';
    const apellido = persona.apellido || '';
    return `${nombre} ${apellido}`.trim() || 'N/A';
  };

  const citaId = ingreso?.cita || ingreso?.cita_id;

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
        width: '90%',
        maxWidth: '700px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        margin: '1rem',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem 2rem',
          borderBottom: '2px solid var(--border)',
          flexShrink: 0
        }}>
          <h4 style={{ margin: 0, fontWeight: '700', color: 'var(--dark)' }}>
            Detalles del Ingreso
          </h4>
          <button
            onClick={onClose}
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
              borderRadius: '50%'
            }}
          >
            ×
          </button>
        </div>

        <div style={{
          padding: '2rem',
          overflowY: 'auto',
          flex: 1
        }}>
          <div className="form-layout">
            <div style={{ gridColumn: '1 / -1', marginBottom: '2rem' }}>
              <h5 style={{ color: '#10b981', marginBottom: '1rem', borderBottom: '2px solid #10b981', paddingBottom: '0.5rem' }}>
                Información del Ingreso
              </h5>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                background: '#f8f9fa',
                padding: '1.5rem',
                borderRadius: '8px'
              }}>
                <div><strong>Fecha:</strong> <span style={{ color: '#1f2937' }}>{formatFecha(ingreso.fecha)}</span></div>
                <div><strong>Medio de Pago:</strong> <span style={{ color: '#1f2937' }}>{ingreso.medio_pago}</span></div>
                <div><strong>Valor Principal:</strong> <span style={{ color: '#1f2937' }}>${parseFloat(ingreso.valor).toLocaleString('es-CO')}</span></div>
                <div><strong>Extra:</strong> <span style={{ color: '#1f2937' }}>${parseFloat(ingreso.extra || 0).toLocaleString('es-CO')}</span></div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong>Total:</strong>
                  <span style={{
                    fontWeight: '700',
                    fontSize: '1.2rem',
                    color: '#10b981',
                    marginLeft: '0.5rem'
                  }}>
                    ${(parseFloat(ingreso.valor) + parseFloat(ingreso.extra || 0)).toLocaleString('es-CO')}
                  </span>
                </div>
                {ingreso.nota && (
                  <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
                    <strong>Nota:</strong> <span style={{ color: '#1f2937' }}>{ingreso.nota}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <h5 style={{ color: '#3B82F6', marginBottom: '1rem', borderBottom: '2px solid #3B82F6', paddingBottom: '0.5rem' }}>
                Información de la Cita
                {loadingCita && <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: '#6B7280' }}>(cargando...)</span>}
              </h5>

              {loadingCita ? (
                <div style={{
                  background: '#f8f9fa',
                  padding: '2rem',
                  borderRadius: '8px',
                  textAlign: 'center',
                  color: '#6B7280'
                }}>
                  Cargando información de la cita...
                </div>
              ) : citaInfo ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  background: '#f0f9ff',
                  padding: '1.5rem',
                  borderRadius: '8px'
                }}>
                  <div><strong>Cliente:</strong> <span style={{ color: '#1f2937' }}>{getNombreCompleto(citaInfo.clienteInfo)}</span></div>
                  <div><strong>Teléfono:</strong> <span style={{ color: '#1f2937' }}>{citaInfo.clienteInfo?.telefono || 'N/A'}</span></div>
                  <div><strong>Documento:</strong> <span style={{ color: '#1f2937' }}>{citaInfo.clienteInfo?.documento || 'N/A'}</span></div>
                  <div><strong>Tipo Doc:</strong> <span style={{ color: '#1f2937' }}>{citaInfo.clienteInfo?.tipo_documento || 'N/A'}</span></div>
                  <div><strong>Servicio:</strong> <span style={{ color: '#1f2937' }}>{citaInfo.servicioInfo?.nombre || 'N/A'}</span></div>
                  <div><strong>Precio Servicio:</strong> <span style={{ color: '#1f2937' }}>${parseFloat(citaInfo.servicioInfo?.precio || 0).toLocaleString('es-CO')}</span></div>
                  <div><strong>Empleado:</strong> <span style={{ color: '#1f2937' }}>{getNombreCompleto(citaInfo.encargadoInfo)}</span></div>
                  <div><strong>Duración:</strong> <span style={{ color: '#1f2937' }}>{citaInfo.duracion || 0} min</span></div>
                  <div><strong>Fecha Cita:</strong> <span style={{ color: '#1f2937' }}>{formatFecha(citaInfo.fecha)}</span></div>
                  <div><strong>Hora Inicio:</strong> <span style={{ color: '#1f2937' }}>{formatHora(citaInfo.hora_inicio)}</span></div>
                  <div><strong>Hora Fin:</strong> <span style={{ color: '#1f2937' }}>{formatHora(citaInfo.hora_fin)}</span></div>
                </div>
              ) : (
                <div style={{
                  background: '#f8f9fa',
                  padding: '1.5rem',
                  borderRadius: '8px',
                  textAlign: 'center',
                  color: '#6B7280',
                  fontStyle: 'italic'
                }}>
                  {citaId
                    ? "No se pudo cargar la información de la cita asociada"
                    : "No hay cita asociada a este ingreso"}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FinanzasPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('ingresos');
  const [ingresos, setIngresos] = useState([]);
  const [egresos, setEgresos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().slice(0, 10));
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().slice(0, 10));
  const [busqueda, setBusqueda] = useState('');
  const [showModalIngreso, setShowModalIngreso] = useState(false);
  const [showModalEgreso, setShowModalEgreso] = useState(false);
  const [showModalCategoria, setShowModalCategoria] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totales, setTotales] = useState({
    ingresos: 0,
    egresos: 0,
    ganancia: 0
  });
  const { alert, success, error: showError } = useAlert();

  useEffect(() => {
    fetchData();
  }, [fechaInicio, fechaFin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ingresosRes, egresosRes, usuariosRes, serviciosRes, categoriasRes] = await Promise.all([
        api.getIngresos(`?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`),
        api.getEgresos(`?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`),
        api.getUsuarios(),
        api.getServicios(),
        api.getCategoriasEgreso()
      ]);

      const ingresosData = ingresosRes.data?.ingresos || [];
      const egresosData = egresosRes.data?.egresos || [];

      const empleadosData = (usuariosRes.data || []).filter(usuario =>
        usuario.rolInfo?.nombre === 'Empleado'
      );

      const serviciosData = serviciosRes.data || [];
      const categoriasData = categoriasRes.data || [];

      setIngresos(ingresosData);
      setEgresos(egresosData);
      setEmpleados(empleadosData);
      setServicios(serviciosData);
      setCategorias(categoriasData);

      const totalIngresos = ingresosData.reduce((sum, i) => sum + parseFloat(i.valor) + parseFloat(i.extra || 0), 0);
      const totalEgresos = egresosData.reduce((sum, e) => sum + parseFloat(e.valor), 0);

      setTotales({
        ingresos: totalIngresos,
        egresos: totalEgresos,
        ganancia: totalIngresos - totalEgresos
      });

      logger.success('Datos de caja cargados', `${ingresosData.length + egresosData.length} registros`);
    } catch (err) {
      logger.error('Error al cargar datos de caja', err.message);
      showError(err.message || 'Error al cargar datos');
    }
    setLoading(false);
  };

  const filtrarRegistros = (registros, tipo) => {
    if (!busqueda) return registros;

    return registros.filter(reg =>
      tipo === 'ingresos' ?
        (reg.servicioInfo?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
          reg.empleadoInfo?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
          reg.empleadoInfo?.apellido?.toLowerCase().includes(busqueda.toLowerCase()) ||
          reg.medio_pago?.toLowerCase().includes(busqueda.toLowerCase())) :
        (reg.categoriaInfo?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
          reg.proveedor?.toLowerCase().includes(busqueda.toLowerCase()) ||
          reg.descripcion?.toLowerCase().includes(busqueda.toLowerCase()))
    );
  };

  const ingresosFiltrados = filtrarRegistros(ingresos, 'ingresos');
  const egresosFiltrados = filtrarRegistros(egresos, 'egresos');

  return (
    <div className="finanzas-page">
      <Header />
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <main className="main-content">
        <button
          className="hamburger content-hamburger"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          <i className="bi bi-list"></i>
        </button>

        {alert && <AlertSimple message={alert.message} type={alert.type} />}

        <div className="dashboard-header">
          <p className="title">Gestión de ingresos y egresos</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card stat-success">
            <div className="stat-icon">
              <i className="bi bi-arrow-down-circle"></i>
            </div>
            <div className="stat-info">
              <p className="stat-label">TOTAL INGRESOS</p>
              <p className="stat-value">${totales.ingresos.toLocaleString('es-CO')}</p>
            </div>
          </div>

          <div className="stat-card stat-danger">
            <div className="stat-icon">
              <i className="bi bi-arrow-up-circle"></i>
            </div>
            <div className="stat-info">
              <p className="stat-label">TOTAL EGRESOS</p>
              <p className="stat-value">${totales.egresos.toLocaleString('es-CO')}</p>
            </div>
          </div>

          <div className={`stat-card ${totales.ganancia >= 0 ? 'stat-primary' : 'stat-warning'}`}>
            <div className="stat-icon">
              <i className="bi bi-graph-up-arrow"></i>
            </div>
            <div className="stat-info">
              <p className="stat-label">GANANCIA NETA</p>
              <p className="stat-value">${totales.ganancia.toLocaleString('es-CO')}</p>
            </div>
          </div>
        </div>

        <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

        <ModalIngreso
          show={showModalIngreso}
          onClose={() => setShowModalIngreso(false)}
          empleados={empleados}
          servicios={servicios}
          onSuccess={fetchData}
        />

        <ModalEgreso
          show={showModalEgreso}
          onClose={() => setShowModalEgreso(false)}
          categorias={categorias}
          onSuccess={fetchData}
        />

        <ModalCategoriaEgreso
          show={showModalCategoria}
          onClose={() => setShowModalCategoria(false)}
          onSuccess={fetchData}
        />

        {activeTab === 'ingresos' ? (
          <IngresosTab
            ingresos={ingresosFiltrados}
            loading={loading}
            busqueda={busqueda}
            onBusquedaChange={(e) => setBusqueda(e.target.value)}
            onRefresh={fetchData}
            onNuevoIngreso={() => setShowModalIngreso(true)}
            fechaInicio={fechaInicio}
            fechaFin={fechaFin}
            onFechaInicioChange={(e) => setFechaInicio(e.target.value)}
            onFechaFinChange={(e) => setFechaFin(e.target.value)}
          />
        ) : (
          <EgresosTab
            egresos={egresosFiltrados}
            loading={loading}
            busqueda={busqueda}
            onBusquedaChange={(e) => setBusqueda(e.target.value)}
            onRefresh={fetchData}
            onNuevoEgreso={() => setShowModalEgreso(true)}
            onNuevaCategoria={() => setShowModalCategoria(true)}
            fechaInicio={fechaInicio}
            fechaFin={fechaFin}
            onFechaInicioChange={(e) => setFechaInicio(e.target.value)}
            onFechaFinChange={(e) => setFechaFin(e.target.value)}
          />
        )}
      </main>
    </div>
  );
}