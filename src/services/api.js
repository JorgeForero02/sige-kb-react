import { logger } from './logger';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('authToken');
    logger.info('APIClient inicializado', `Base URL: ${this.baseURL}`);
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
    logger.success('Token guardado');
  }

  getToken() {
    return localStorage.getItem('authToken');
  }

  clearToken() {
    localStorage.removeItem('authToken');
    this.token = null;
    logger.info('Token removido');
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.getToken()) {
      headers.Authorization = `Bearer ${this.getToken()}`;
    }

    try {
      logger.info(`[API] GET ${endpoint}`);
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        logger.apiError(endpoint, response.status, data.message);
        const errorMessage = data.message || data.error || 'Error en la solicitud';
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      logger.success(`[API] Respuesta OK`, endpoint);
      return data;
    } catch (error) {
      logger.error('[API] Error', error.message);
      throw error;
    }
  }

  // AUTH
  async login(documento, contrasena) {
    logger.info('Login iniciado', documento);
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ documento, contrasena }),
    });
  }

  async getProfile() {
    return this.request('/auth/profile', { method: 'GET' });
  }

  // USUARIOS
  async getUsuarios(params = '') {
    return this.request(`/usuarios${params}`, { method: 'GET' });
  }

  async getUsuarioById(id) {
    return this.request(`/usuarios/${id}`, { method: 'GET' });
  }

  async crearUsuario(datos) {
    return this.request('/usuarios', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  }

  async actualizarUsuario(id, datos) {
    return this.request(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
  }

  async cambiarEstadoUsuario(id, estado) {
    return this.request(`/usuarios/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    });
  }

  async cambiarPasswordUsuario(id, nuevaContrasena) {
    return this.request(`/usuarios/${id}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ nueva_contrasena: nuevaContrasena }),
    });
  }

  // CATEGORIAS
  async getCategorias(params = '') {
    return this.request(`/categorias${params}`, { method: 'GET' });
  }

  async crearCategoria(datos) {
    return this.request('/categorias', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  }

  async actualizarCategoria(id, datos) {
    return this.request(`/categorias/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
  }

  async eliminarCategoria(id) {
    return this.request(`/categorias/${id}`, {
      method: 'DELETE',
    });
  }

  // SERVICIOS
  async getServicios(params = '') {
    return this.request(`/servicios${params}`, { method: 'GET' });
  }

  async crearServicio(datos) {
    logger.info('Creando servicio', datos.nombre);
    return this.request('/servicios', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  }

  async actualizarServicio(id, datos) {
    return this.request(`/servicios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
  }

  async eliminarServicio(id) {
    return this.request(`/servicios/${id}`, {
      method: 'DELETE',
    });
  }

  //TARIFAS
  async getTarifas(params = '') {
    return this.request(`/historial-tarifas${params}`, { method: 'GET' });
  }

  async getTarifasResumen(params = '') {
    return this.request(`/historial-tarifas/resumen${params}`, { method: 'GET' });
  }

  async getTarifasServicio(id) {
    return this.request(`/historial-tarifas/servicio/${id}`, { method: 'GET' });
  }

  async getTarifasActuales(id) {
    return this.request(`/historial-tarifas/servicio/${id}/actual`, { method: 'GET' });
  }

  // CLIENTES
  async getClientes(search = '') {
    return this.request(`/clientes${search ? `?search=${search}` : ''}`, { method: 'GET' });
  }

  async crearCliente(datos) {
    logger.info('Creando cliente', datos.nombre);
    return this.request('/clientes', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  }

  async actualizarCliente(id, datos) {
    return this.request(`/clientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
  }

  async eliminarCliente(id) {
    return this.request(`/clientes/${id}`, {
      method: 'DELETE',
    });
  }

  async cambiarEstadoCliente(id, estado) {
    return this.request(`/clientes/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    });
  }

  // CITAS
  async getCitas(params = '') {
    return this.request(`/citas${params}`, { method: 'GET' });
  }

  async getCitaById(id) {
    return this.request(`/citas/${id}`, { method: 'GET' });
  }

  async crearCita(datos) {
    logger.info('Creando cita', datos.fecha);
    return this.request('/citas', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  }

  async cambiarEstadoCita(id, estado) {
    return this.request(`/citas/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    });
  }

  async actualizarCita(id, datos) {
    return this.request(`/citas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
  }

  async cancelarCita(id) {
    return this.request(`/citas/${id}`, {
      method: 'DELETE',
    });
  }

  async getAgendaEmpleado(empleadoId) {
    return this.request(`/citas/empleado/${empleadoId}`, { method: 'GET' });
  }

  // INGRESOS
  async getIngresos(params = '') {
    return this.request(`/ingresos${params}`, { method: 'GET' });
  }

  async getTotalIngresosDia(fecha = '') {
    return this.request(`/ingresos/total/dia${fecha ? `?fecha=${fecha}` : ''}`, { method: 'GET' });
  }

  async crearIngreso(datos) {
    return this.request('/ingresos', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  }

  // EGRESOS
  async getEgresos(params = '') {
    return this.request(`/egresos${params}`, { method: 'GET' });
  }

  async getTotalEgresosDia(fecha = '') {
    return this.request(`/egresos/total/dia${fecha ? `?fecha=${fecha}` : ''}`, { method: 'GET' });
  }

  async crearEgreso(datos) {
    return this.request('/egresos', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  }

  async getCategoriasEgreso() {
    return this.request('/categorias-egreso', { method: 'GET' });
  }

  async crearCategoriaEgreso(datos) {
    return this.request('/categorias-egreso', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  }

  //NOMINAS

  async calcularNomina(datos) {
    return this.request('/nominas/calcular', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  }

  async getDetalles(params = '') {
    return this.request(`/nominas/detalles${params}`, { method: 'GET' });
  }

  async getNominas(params = '') {
    return this.request(`/nominas${params}`, { method: 'GET' });
  }

  async getIdNomina(id) {
    return this.request(`/nominas/${id}`, { method: 'GET' });
  }

  //DESCUENTOS NOMINAS
  async crearDescuentoNomina(datos) {
    return this.request('/descuentos-nomina', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  }

  async getDescuentosNomina(params = '') {
    return this.request(`/descuentos-nomina${params}`, { method: 'GET' });
  }

  async getDescuentoNominaById(id) {
    return this.request(`/descuentos-nomina/${id}`, { method: 'GET' });
  }

  // ROLES
  async getRoles(params = '') {
    return this.request(`/roles${params}`, { method: 'GET' });
  }
}

export default new APIClient();