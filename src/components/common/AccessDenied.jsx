import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import './AccessDenied.css';

export function AccessDenied() {
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    return (
        <div className="access-denied-container">
            <div className="access-denied-content">
                <div className="access-denied-icon">
                </div>

                <h1 className="access-denied-title">Acceso Denegado</h1>

                <p className="access-denied-message">
                    No tienes permisos para acceder al sistema.
                </p>

                <div className="access-denied-actions">
                    <button
                        onClick={handleLogout}
                        className="btn-primary"
                    >
                        Volver a Iniciar Sesión
                    </button>
                </div>
            </div>
        </div>
    );
}