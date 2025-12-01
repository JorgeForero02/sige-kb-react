import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCategorias } from '../../context/CategoriasContext';
import './Sidebar.css';

export function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, rol, loading: authLoading, logout } = useAuth();

  const {
    categorias,
    categoriasOpen,
    setCategoriasOpen,
    fetchCategorias,
    loading: categoriasLoading,
    hasLoaded
  } = useCategorias();

  const categoriasActivas = categorias.filter(categoria => {
    const estado = categoria.estado?.toString().toUpperCase();
    return estado === '1';
  });

  useEffect(() => {
    const isCategoriasRoute = location.pathname.includes('/categorias');
    if (isCategoriasRoute && !categoriasOpen) {
      setCategoriasOpen(true);
    }
  }, [location.pathname, categoriasOpen, setCategoriasOpen]);

  useEffect(() => {
    const shouldLoad = categoriasOpen && !hasLoaded && !categoriasLoading;

    if (shouldLoad) {
      console.log('Cargando categorías desde Sidebar...');
      fetchCategorias();
    }
  }, [categoriasOpen, hasLoaded, categoriasLoading, fetchCategorias]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRolInfo = () => {
    if (authLoading) return 'loading';
    if (!user) return 'no-user';

    if (rol) return rol;
    if (user.rol) return user.rol;
    if (user.rolInfo?.nombre) return user.rolInfo.nombre;

    return 'unknown';
  };

  const currentRol = getRolInfo();

  const getSidebarTitle = () => {
    if (currentRol === 'loading') {
      return (
        <div className="sidebar-user-info">
          <i className="bi bi-person-circle user-icon"></i>
          <div className="sidebar-user">
            <div className="sidebar-user-loading">Cargando...</div>
          </div>
        </div>
      );
    }

    if (currentRol === 'no-user') {
      return (
        <div className="sidebar-user-info">
          <i className="bi bi-person-circle user-icon"></i>
          <div className="sidebar-user">
            <div className="user-name">No autenticado</div>
          </div>
        </div>
      );
    }

    const rolUpper = String(currentRol).toUpperCase();

    switch (rolUpper) {
      case 'ADMINISTRADOR':
      case 'ADMIN':
        return (
          <div className="sidebar-user-info">
            <i className="bi bi-person-circle user-icon"></i>
            <div className="sidebar-user">
              <div className="user-name">Panel de Administración</div>
            </div>
          </div>
        );

      case 'GERENTE':
        return (
          <div className="sidebar-user-info">
            <i className="bi bi-person-circle user-icon"></i>
            <div className="sidebar-user">
              <div className="sidebar-user">Panel de Gerente</div>
            </div>
          </div>
        );

      case 'EMPLEADO':
        return (
          <div className="sidebar-user-info">
            <i className="bi bi-person-circle user-icon"></i>
            <div className="sidebar-user">
              <div className="sidebar-user">Panel de Empleado</div>
            </div>
          </div>
        );

      case 'UNKNOWN':
      default:
        return (
          <div className="sidebar-user-info">
            <i className="bi bi-person-circle user-icon"></i>
            <div className="sidebar-user">
              <div className="sidebar-user">Panel de Usuario</div>
            </div>
          </div>
        );
    }
  };

  const handleCategoriasClick = () => {
    const isMobile = window.innerWidth < 768;

    if (!location.pathname.includes('/categorias')) {
      navigate('/categorias');
    }

    setCategoriasOpen(!categoriasOpen);

    if (isMobile) {
      setTimeout(() => setIsOpen(false), 300);
    }
  };

  const handleSubItemClick = (subItemPath, subItemState) => {
    navigate(subItemPath, { state: subItemState });

    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  const getMenuByRole = () => {
    if (currentRol === 'loading') {
      return [
        { path: '/home', icon: 'bi-house-door-fill', label: 'Dashboard' }
      ];
    }

    if (currentRol === 'no-user') {
      return [];
    }

    const base = { path: '/home', icon: 'bi-house-door-fill', label: 'Dashboard' };
    const homeEmpleado = { path: '/home-empleado', icon: 'bi-house-door-fill', label: 'Dashboard' };

    const rolUpper = String(currentRol).toUpperCase();

    if (rolUpper === 'ADMINISTRADOR' || rolUpper === 'ADMIN') {
      return [
        base,
        { path: '/roles', icon: 'bi-person-gear', label: 'Roles' },
        { path: '/usuarios', icon: 'bi-person-badge-fill', label: 'Usuarios' }
      ];
    }

    if (rolUpper === 'GERENTE') {
      return [
        base,
        {
          type: 'dropdown',
          label: 'Categorías',
          icon: 'bi-tags-fill',
          isOpen: categoriasOpen,
          onClick: handleCategoriasClick,
          mainPath: '/categorias',
          subItems: categoriasActivas,
          isLoading: categoriasLoading && !hasLoaded
        },
        { path: '/empleados', icon: 'bi-person-badge-fill', label: 'Empleados' },
        { path: '/caja', icon: 'bi-cash-coin', label: 'Caja' },
        { path: '/nomina', icon: 'bi-journal-text', label: 'Nómina' },
        { path: '/reportes', icon: 'bi-graph-up', label: 'Reportes' }
      ];
    }

    if (rolUpper === 'EMPLEADO') {
      return [
        homeEmpleado,
        { path: '/servicios-empleado', icon: 'bi-scissors', label: 'Servicios' },
        { path: '/agenda-empleado', icon: 'bi-calendar-check', label: 'Agenda' },
        { path: '/nomina-empleado', icon: 'bi-journal-text', label: 'Nomina' }
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
        subItems: categoriasActivas,
        isLoading: categoriasLoading && !hasLoaded
      }
    ];
  };

  const menuItems = getMenuByRole();

  const isSubItemActive = (subItemPath) => {
    return location.pathname === subItemPath;
  };

  const isCategoriasActive = () => {
    return location.pathname === '/categorias' || location.pathname.includes('/categorias/');
  };

  const renderCategoriasSubItems = (subItems, isLoading) => {
    if (isLoading) {
      return (
        <div className="sidebar-dropdown-loading">
          <i className="bi bi-arrow-repeat spinner"></i>
          <span>Cargando categorías...</span>
        </div>
      );
    }

    if (!subItems || subItems.length === 0) {
      return (
        <div className="sidebar-subitem empty">
          <span>No hay categorías disponibles</span>
        </div>
      );
    }

    return subItems.map((categoria) => {
      const subItemPath = `/categorias/${encodeURIComponent(categoria.nombre)}`;
      const subItemState = {
        categoriaId: categoria.id,
        categoriaNombre: categoria.nombre
      };

      return (
        <button
          key={categoria.id}
          className={`sidebar-subitem ${isSubItemActive(subItemPath) ? 'active' : ''}`}
          onClick={() => handleSubItemClick(subItemPath, subItemState)}
        >
          <span>{categoria.nombre}</span>
        </button>
      );
    });
  };

  return (
    <>
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
          {menuItems.length > 0 ? (
            menuItems.map(item => {
              if (item.type === 'dropdown') {
                return (
                  <div key={item.label} className="sidebar-dropdown">
                    <button
                      className={`sidebar-dropdown-toggle ${isCategoriasActive() ? 'active' : ''} ${item.isOpen ? 'open' : ''}`}
                      onClick={item.onClick}
                      disabled={item.isLoading}
                    >
                      <i className={`bi ${item.icon}`}></i>
                      <span>{item.label}</span>
                      {item.isLoading ? (
                        <i className="bi bi-arrow-repeat spinner"></i>
                      ) : (
                        <i className={`bi ${item.isOpen ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
                      )}
                    </button>

                    <div className={`sidebar-dropdown-content ${item.isOpen ? 'show' : ''}`}>
                      {renderCategoriasSubItems(item.subItems, item.isLoading)}
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
            })
          ) : (
            <div className="sidebar-loading">
              <i className="bi bi-arrow-repeat spinner"></i>
              <span>Cargando menú...</span>
            </div>
          )}
        </nav>

        {user && (
          <button className="logout-btn" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i>
            <span>Cerrar Sesión</span>
          </button>
        )}
      </aside>

      {isOpen && <div className="overlay" onClick={() => setIsOpen(false)}></div>}
    </>
  );
}