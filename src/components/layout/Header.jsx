import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Header.css';
import logo from '../../assets/logoIcono.png';

export function Header() {
    const navigate = useNavigate();
    const { user, rol, loading: authLoading, logout } = useAuth();

    const getRolInfo = () => {
        if (authLoading) return 'Cargando...';
        if (rol) return rol;
        if (user?.rol) return user.rol;
        if (user?.rolInfo?.nombre) return user.rolInfo.nombre;
        if (!user && rol) return rol;
        return 'Usuario';
    };

    const rolString = getRolInfo();

    const getEmail = () => {
        if (authLoading) return 'Cargando...';
        if (!user) return '';
        return (user?.email || user?.correo || user?.username || 'Usuario');
    };

    const email = getEmail();

    const nameSource = email.toString();
    const initials = nameSource
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 3)
        .map(s => s[0]?.toUpperCase() || 'U')
        .join('') || 'U';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="header">
            <div className="header-left">
                <div className="header-brand">
                    {/* Logo sin funcionalidad de clic */}
                    <img
                        src={logo}
                        alt="KarenBeauty Logo"
                        className="header-logo"
                    />
                </div>
            </div>

            <div className="header-right">
                <div className="header-actions">
                    <div className="user-info">
                        <div className="user-details">
                            <div className="user-role">{rolString}</div>
                            <div className="user-email">{email}</div>
                        </div>
                        <div className="user-avatar">
                            <div className="avatar-initials">
                                {initials}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}