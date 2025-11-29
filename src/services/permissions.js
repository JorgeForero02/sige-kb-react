// src/services/permissions.js

export const ROLE_IDS = {
  ADMIN: 1,
  GERENTE: 2,
  EMPLEADO: 3
};

export const PERMISSIONS = {
  // ADMIN: Gestión de roles y usuarios
  VIEW_USUARIOS: ['Administrador'],
  CREATE_USUARIO: ['Administrador'],
  /*EDIT_USUARIO: ['Administrador'],
  DELETE_USUARIO: ['Administrador'],*/

  // GERENTE: Categorías, servicios, clientes, agenda, empleados, caja
  VIEW_CATEGORIAS: ['Administrador', 'Gerente'],
  CREATE_CATEGORIA: ['Administrador', 'Gerente'],
  EDIT_CATEGORIA: ['Administrador', 'Gerente'],
  DELETE_CATEGORIA: ['Administrador', 'Gerente'],

  VIEW_SERVICIOS: ['Administrador', 'Gerente', 'Empleado'],
  CREATE_SERVICIO: ['Administrador', 'Gerente'],
  EDIT_SERVICIO: ['Administrador', 'Gerente'],

  VIEW_TARIFAS: ['Administrador', 'Gerente', 'Empleado'],

  VIEW_CLIENTES: ['Administrador', 'Gerente', 'Empleado'],
  CREATE_CLIENTE: ['Administrador', 'Gerente', 'Empleado'],
  EDIT_CLIENTE: ['Administrador', 'Gerente'],

  VIEW_AGENDA: ['Administrador', 'Gerente', 'Empleado'],
  CREATE_CITA: ['Administrador', 'Gerente', 'Empleado'],
  EDIT_CITA: ['Administrador', 'Gerente'],

  VIEW_EMPLEADOS: ['Administrador', 'Gerente'],
  CREATE_EMPLEADO: ['Administrador', 'Gerente'],
  EDIT_EMPLEADO: ['Administrador', 'Gerente'],

  VIEW_CAJA: ['Administrador', 'Gerente'],
  CREATE_INGRESO: ['Administrador', 'Gerente'],
  CREATE_EGRESO: ['Administrador', 'Gerente'],

  CALC_NOMINA: ['Administrador', 'Gerente'],
  VIEW_DETALLES_NOMINA: ['Administrador', 'Gerente'],
  VIEW_NOMINA: ['Administrador', 'Gerente'],

  CAL_DESCUENTOS_NOMINA: ['Administrador', 'Gerente'],
  VIEW_DESCUENTOS_NOMINA: ['Administrador', 'Gerente'],

  // EMPLEADO: Agenda y historial
  VIEW_MIS_CITAS: ['Administrador', 'Gerente', 'Empleado'],
  VIEW_HISTORIAL_SERVICIOS: ['Administrador', 'Gerente', 'Empleado'],
};

export function hasPermission(rol, permission) {
  return PERMISSIONS[permission]?.includes(rol) || false;
}