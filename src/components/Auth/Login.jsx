import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Auth.css';
import logo from '../../assets/logoIcono.png';

export function Login() {
  const [documento, setDocumento] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(documento, contrasena);
      navigate('/home');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesion');
    } finally {
      setLoading(false);
    }
  };

  const toggleMostrarContrasena = () => {
    setMostrarContrasena(!mostrarContrasena);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="karenbeauty">
          <img src={logo} alt="Karen Beauty Logo" className="login-logo-img" />
        </div>

        <div className="login-card">
          <div className="login-header">
            <h1>Iniciar Sesión</h1>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>Documento de identidad</label>
              <input
                type="text"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                placeholder="Ingresa tu documento"
                required
                disabled={loading}
                className="form-control"
              />
            </div>

            <div className="form-group password-group">
              <label>Contraseña</label>
              <div className="password-input-container">
                <input
                  type={mostrarContrasena ? "text" : "password"}
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  required
                  disabled={loading}
                  className="form-control password-input"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={toggleMostrarContrasena}
                  disabled={loading}
                  aria-label={mostrarContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  <i className={`bi ${mostrarContrasena ? 'bi-eye' : 'bi-eye-slash'}`}></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}