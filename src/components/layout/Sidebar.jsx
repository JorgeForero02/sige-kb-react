import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCategorias } from '../../context/CategoriasContext';
import './Sidebar.css';

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [securityOpen, setSecurityOpen] = useState(false);

  const { categorias, categoriasOpen, setCategoriasOpen } = useCategorias();

  const categoriasActivas = categorias.filter(categoria => {
    const estado = categoria.estado?.toString().toUpperCase();
    return  estado === '1';
  });

  useEffect(() => {
    if (location.pathname.includes('/categorias/') || location.pathname === '/categorias') {
      setCategoriasOpen(true);
    }
  }, [location.pathname, setCategoriasOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const rol = user?.rol || user?.rolInfo?.nombre || 'Gerente';
  const rolString = typeof rol === 'string' ? rol : String(rol);

  const getSidebarTitle = () => {
    switch (rolString) {
      case 'Administrador':
      case 'Admin':
        return (
          <div className="sidebar-user-info">
            <i className="bi bi-person-circle user-icon"></i>
            <div className="sidebar-user">
              <div className="user-name">Panel de Administración</div>
            </div>
          </div>
        );

      case 'Gerente':
        return (
          <div className="sidebar-user-info">
            <i className="bi bi-person-circle user-icon"></i>
            <div className="sidebar-user">
              <div className="sidebar-user">Panel de Gerente</div>
            </div>
          </div>
        );

      case 'Empleado':
        return (
          <div className="sidebar-user-info">
            <i className="bi bi-person-circle user-icon"></i>
            <div className="sidebar-user">
              <div className="sidebar-user">Panel de Empleado</div>
            </div>
          </div>
        );

      default:
        return (
          <div className="sidebar-user-info">
            <i className="bi bi-person-circle user-icon"></i>
            <div className="user-text">
              <div className="sidebar-user">Panel de Control</div>
            </div>
          </div>
        );
    }
  };

  const handleCategoriasClick = () => {
    if (rolString === 'Gerente' && !categoriasOpen) {
      navigate('/categorias');
      setCategoriasOpen(true);
    } else {
      setCategoriasOpen(!categoriasOpen);
    }
  };

  const getMenuByRole = () => {
    const base = { path: '/home', icon: 'bi-house-door-fill', label: 'Dashboard' };

    // Administrador solo ve Dashboard y Seguridad
    if (rolString === 'Administrador' || rolString === 'Admin') {
      return [
        base,
        {
          type: 'dropdown',
          label: 'Seguridad',
          icon: 'bi-shield-check',
          isOpen: securityOpen,
          onClick: () => setSecurityOpen(!securityOpen),
          subItems: [
            { path: '/roles', icon: 'bi-person-gear', label: 'Roles' },
            { path: '/usuarios', icon: 'bi-person-badge-fill', label: 'Usuarios' }
          ]
        }
      ];
    }

    // Gerente - Categorías con gestión + subcategorías
    if (rolString === 'Gerente') {
      return [
        base,
        {
          type: 'dropdown',
          label: 'Categorías',
          icon: 'bi-tags-fill',
          isOpen: categoriasOpen,
          onClick: handleCategoriasClick,
          mainPath: '/categorias', 
          subItems: categoriasActivas.map(categoria => ({
            path: `/categorias/${encodeURIComponent(categoria.nombre)}`,
            icon: 'bi-folder',
            label: categoria.nombre,
            state: {
              categoriaId: categoria.id,
              categoriaNombre: categoria.nombre
            },
          }))
        },
        { path: '/empleados', icon: 'bi-person-badge-fill', label: 'Empleados' },
        { path: '/caja', icon: 'bi-cash-coin', label: 'Caja' }
      ];
    }

    if (rolString === 'Empleado') {
      return [
        base,
        {
          type: 'dropdown',
          label: 'Categorías',
          icon: 'bi-tags-fill',
          isOpen: categoriasOpen,
          onClick: handleCategoriasClick,
          subItems: categoriasActivas.map(categoria => ({
            path: `/categorias/${encodeURIComponent(categoria.nombre)}`,
            icon: 'bi-folder',
            label: categoria.nombre,
            state: {
              categoriaId: categoria.id,
              categoriaNombre: categoria.nombre
            },
          }))
        }
      ];
    }

    return [
      base,
      {
        type: 'dropdown',
        label: 'Categorías',
        icon: 'bi-tags-fill',
        isOpen: categoriasOpen,
        onClick: handleCategoriasClick,
        subItems: categoriasActivas.map(categoria => ({
          path: `/categorias/${encodeURIComponent(categoria.nombre)}`,
          icon: 'bi-folder',
          label: categoria.nombre,
          state: {
            categoriaId: categoria.id,
            categoriaNombre: categoria.nombre
          },
        }))
      }
    ];
  };

  const menuItems = getMenuByRole();

  const isSubItemActive = (subItemPath) => {
    const currentPath = location.pathname;
    const subItemPathDecoded = decodeURIComponent(subItemPath);
    return currentPath === subItemPathDecoded;
  };

  const isCategoriasActive = () => {
    return location.pathname === '/categorias' || location.pathname.includes('/categorias/');
  };

  return (
    <>
      {!isOpen && (
        <button
          className="hamburger hamburger-outside"
          onClick={() => setIsOpen(true)}
        >
          <i className="bi bi-list"></i>
        </button>
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-title-wrapper">
            {getSidebarTitle()}
          </div>
          <button className="hamburger hamburger-inside" onClick={() => setIsOpen(false)}>
            <i className="bi bi-list"></i>
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map(item => {
            if (item.type === 'dropdown') {
              return (
                <div key={item.label} className="sidebar-dropdown">
                  <button
                    className={`sidebar-dropdown-toggle ${
                      isCategoriasActive() ? 'active' : ''
                    } ${item.isOpen ? 'active' : ''}`}
                    onClick={item.onClick}
                  >
                    <i className={`bi ${item.icon}`}></i>
                    <span>{item.label}</span>
                    <i className={`bi ${item.isOpen ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
                  </button>
                  
                  <div className={`sidebar-dropdown-content ${item.isOpen ? 'show' : ''}`}>
                    {item.subItems.map((subItem, index) => {
                      return (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          state={subItem.state}
                          className={`sidebar-subitem ${isSubItemActive(subItem.path) ? 'active' : ''}`}
                          onClick={() => window.innerWidth < 768 && setIsOpen(false)}
                        >
                          <span>{subItem.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={location.pathname === item.path ? 'active' : ''}
                onClick={() => window.innerWidth < 768 && setIsOpen(false)}
              >
                <i className={`bi ${item.icon}`}></i>
                <span>{item.label}</span>
              </Link>
            );
          })}
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