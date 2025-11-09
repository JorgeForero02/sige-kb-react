import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Header.css';
import logo from '../../assets/logoIcono.png';
import notificaciones from '../../assets/notificaciones.png';
import usuario from '../../assets/usuario.png';

export function Header() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const rol = user?.rol || user?.rolInfo?.nombre || 'Gerente';
    const rolString = typeof rol === 'string' ? rol : String(rol);

    const email = (user?.email || user?.correo || user?.username || '')?.toString();

    const nameSource = (email).toString();
    const initials = nameSource
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 3)
        .map(s => s[0].toUpperCase())
        .join('') || 'U';

    const handleLogoClick = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/login');
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="header">
            <div className="header-left">
                <div className="header-brand" onClick={handleLogoClick} style={{cursor: 'pointer'}}>
                    <img src={logo} alt="KarenBeauty Logo" className="header-logo" />
                </div>
            </div>

            <div className="header-right">
                <div className="header-actions">
                    <button className="icon-btn">
                        <img src={notificaciones} alt="Notificaciones" className="icon-img" />
                    </button>

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