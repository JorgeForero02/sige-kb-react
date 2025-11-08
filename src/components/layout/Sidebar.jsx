import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Sidebar.css';

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Detectar rol de forma segura
  const rol = user?.rol || user?.rolInfo?.nombre || 'Gerente';
  const rolString = typeof rol === 'string' ? rol : String(rol);
  const rolLower = rolString.toLowerCase();

  console.log('Usuario:', user);
  console.log('Rol detectado:', rolString);

  const getMenuByRole = () => {
    const base = { path: '/home', icon: 'bi-house-door-fill', label: 'Inicio' };

    if (rolString === 'Administrador' || rolString === 'Admin') {
      return [
        base,
        { path: '/roles', icon: 'bi-shield-check', label: 'Roles' },
        { path: '/empleados', icon: 'bi-person-badge-fill', label: 'Empleados' },
        { path: '/categorias', icon: 'bi-tags-fill', label: 'Categorías' },
        { path: '/servicios', icon: 'bi-briefcase-fill', label: 'Servicios' },
        { path: '/clientes', icon: 'bi-people-fill', label: 'Clientes' },
        { path: '/citas', icon: 'bi-calendar-check-fill', label: 'Agenda' },
        { path: '/finanzas', icon: 'bi-cash-coin', label: 'Finanzas' }
      ];
    }

    if (rolString === 'Gerente') {
      return [
        base,
        { path: '/empleados', icon: 'bi-person-badge-fill', label: 'Empleados' },
        { path: '/categorias', icon: 'bi-tags-fill', label: 'Categorías' },
        { path: '/servicios', icon: 'bi-briefcase-fill', label: 'Servicios' },
        { path: '/clientes', icon: 'bi-people-fill', label: 'Clientes' },
        { path: '/citas', icon: 'bi-calendar-check-fill', label: 'Agenda' },
        { path: '/finanzas', icon: 'bi-cash-coin', label: 'Finanzas' }
      ];
    }

    if (rolString === 'Empleado') {
      return [
        base,
        { path: '/citas', icon: 'bi-calendar-check-fill', label: 'Mi Agenda' }
      ];
    }

    // Fallback
    return [
      base,
      { path: '/empleados', icon: 'bi-person-badge-fill', label: 'Empleados' },
      { path: '/categorias', icon: 'bi-tags-fill', label: 'Categorías' },
      { path: '/clientes', icon: 'bi-people-fill', label: 'Clientes' },
      { path: '/servicios', icon: 'bi-briefcase-fill', label: 'Servicios' },
      { path: '/citas', icon: 'bi-calendar-check-fill', label: 'Citas' },
      { path: '/finanzas', icon: 'bi-cash-coin', label: 'Finanzas' }
    ];
  };

  const menuItems = getMenuByRole();

  return (
    <>
      <button className="hamburger" onClick={() => setIsOpen(!isOpen)}>
        <i className="bi bi-list"></i>
      </button>

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>SIGE-KB</h2>
          <button onClick={() => setIsOpen(false)} className="close-btn">
            <i className="bi bi-x"></i>
          </button>
        </div>

        <div className="sidebar-user">
          <i className="bi bi-person-circle"></i>
          <div>
            <p>{user?.nombre || 'Usuario'}</p>
            <span className={`role-badge role-${rolLower}`}>
              {rolString}
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={location.pathname === item.path ? 'active' : ''}
              onClick={() => window.innerWidth < 768 && setIsOpen(false)}
            >
              <i className={`bi ${item.icon}`}></i>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right"></i>
          <span>Cerrar Sesión</span>
        </button>
      </aside>

      {isOpen && <div className="overlay" onClick={() => setIsOpen(false)}></div>}
    </>
  );
}