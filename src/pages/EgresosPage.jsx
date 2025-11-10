export function EgresosPage() {
  const [egresos, setEgresos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().slice(0, 10));
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().slice(0, 10));
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [totales, setTotales] = useState({ total: 0, cantidad: 0 });
  const [formData, setFormData] = useState({
    categoria: '',
    valor: '',
    medio_pago: 'Efectivo',
    proveedor: '',
    descripcion: ''
  });
  const { alert, success, error: showError, warning } = useAlert();

  useEffect(() => {
    fetchData();
  }, [fechaInicio, fechaFin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [egresosRes, categoriasRes] = await Promise.all([
        api.getEgresos(`?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`),
        api.getCategoriasEgreso()
      ]);

      setEgresos(egresosRes.data?.egresos || []);
      setTotales({
        total: egresosRes.data?.total || 0,
        cantidad: egresosRes.data?.cantidad || 0
      });
      
      // DEBUG: Verificar estructura de categorías
      console.log('Categorías recibidas:', categoriasRes.data);
      
      // Asegurar que las categorías sean un array
      const categoriasData = categoriasRes.data || [];
      setCategorias(categoriasData);

      logger.success('Egresos cargados', `${egresosRes.data?.cantidad || 0} registros`);
      logger.success('Categorías cargadas', `${categoriasData.length} categorías`);
    } catch (err) {
      logger.error('Error al cargar egresos', err.message);
      showError(err.message || 'Error al cargar egresos');
    }
    setLoading(false);
  };

  // Añadir esta función faltante
  const onSuccess = () => {
    fetchData(); // Recargar los datos después de un éxito
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.categoria || !formData.valor || !formData.medio_pago) {
      warning('Completa los campos requeridos');
      return;
    }

    const valorNumerico = parseFloat(formData.valor);
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      showError('El valor del egreso debe ser mayor a 0');
      return;
    }

    const categoriaId = parseInt(formData.categoria);
    if (isNaN(categoriaId)) {
      showError('Selecciona una categoría válida');
      return;
    }
  
    const datosEgreso = {
      fecha: new Date().toISOString().slice(0, 10),
      categoria: categoriaId,
      valor: valorNumerico,
      medio_pago: formData.medio_pago,
      proveedor: formData.proveedor || '',
      descripcion: formData.descripcion || ''
    };

    console.log('Datos COMPLETOS que se enviarán:', datosEgreso);

    setSaving(true);
    try {
      const resultado = await api.crearEgreso(datosEgreso);

      success('Egreso registrado exitosamente!');
      setFormData({
        categoria: '',
        valor: '',
        medio_pago: 'Efectivo',
        proveedor: '',
        descripcion: ''
      });
      onSuccess(); // Llamar a la función onSuccess
      setShowModal(false); // Cerrar el modal
    } catch (err) {
      const errorMessage = err.response?.data?.message ||
        err.response?.data?.error ||
        'Error al registrar egreso';

      logger.error('Error al crear egreso', errorMessage);
      showError(`Error: ${errorMessage}`);
    }
    setSaving(false);
  };

  const handleOpenModal = () => {
    setShowModal(true);
    setFormData({
      categoria: '',
      valor: '',
      medio_pago: 'Efectivo',
      proveedor: '',
      descripcion: ''
    });
    
    // DEBUG: Verificar categorías cuando se abre el modal
    console.log('Categorías disponibles al abrir modal:', categorias);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      categoria: '',
      valor: '',
      medio_pago: 'Efectivo',
      proveedor: '',
      descripcion: ''
    });
  };

  // Función para formatear opciones del Select
  const getCategoriaOptions = () => {
    if (!categorias || categorias.length === 0) {
      return [{ id: '', nombre: 'No hay categorías disponibles' }];
    }
    
    return categorias.map(c => ({
      id: c.id,
      nombre: c.nombre || c.nombre_categoria || `Categoría ${c.id}`
    }));
  };

  return (
    <MainLayout title="Egresos">
      {alert && <AlertSimple message={alert.message} type={alert.type} />}

      <div className="page-header">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Input
            label="Desde"
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
          <Input
            label="Hasta"
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
        </div>
        <Button onClick={handleOpenModal}>
          <i className="bi bi-plus-circle"></i> Nuevo Egreso
        </Button>
      </div>

      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card stat-danger">
          <div className="stat-icon"><i className="bi bi-cash-stack"></i></div>
          <div className="stat-info">
            <p className="stat-label">Total Egresos</p>
            <p className="stat-value">${totales.total.toLocaleString('es-CO')}</p>
          </div>
        </div>
        <div className="stat-card stat-info">
          <div className="stat-icon"><i className="bi bi-receipt"></i></div>
          <div className="stat-info">
            <p className="stat-label">Cantidad</p>
            <p className="stat-value">{totales.cantidad}</p>
          </div>
        </div>
      </div>

      {/* Modal para el formulario */}
      <Modal show={showModal} onClose={handleCloseModal}>
        <h4 className="form-title" style={{ marginBottom: '1.5rem', fontWeight: '700', color: '#333' }}>
          <i className="bi bi-cash-coin"></i> Registrar Egreso
        </h4>
        <form onSubmit={handleSubmit} className="form-layout">
          <Select
            label="Categoría *"
            value={formData.categoria}
            onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
            options={getCategoriaOptions()}
            required
            autoFocus
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
          />
          <div style={{ gridColumn: '1 / -1' }}>
            <Input
              label="Descripción"
              type="text"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            />
          </div>
          <div className="form-actions">
            <Button variant="primary" disabled={saving}>
              {saving ? 'Registrando...' : 'Registrar'}
            </Button>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      {loading ? (
        <Loading />
      ) : egresos.length > 0 ? (
        <Card>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Categoría</th>
                  <th>Proveedor</th>
                  <th>Valor</th>
                  <th>Medio Pago</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {egresos.map(egr => (
                  <tr key={egr.id}>
                    <td>{new Date(egr.fecha).toLocaleDateString('es-CO')}</td>
                    <td>{egr.categoriaInfo?.nombre || 'N/A'}</td>
                    <td>{egr.proveedor || '-'}</td>
                    <td className="text-danger fw-bold">${parseFloat(egr.valor).toLocaleString('es-CO')}</td>
                    <td>
                      <span className="badge" style={{ background: '#FEE2E2', color: '#991B1B' }}>
                        {egr.medio_pago}
                      </span>
                    </td>
                    <td>{egr.descripcion || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Empty message="No hay egresos en el rango seleccionado" />
      )}
    </MainLayout>
  );
}