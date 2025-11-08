import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Auth.css';

export function Login() {
  const [documento, setDocumento] = useState('');
  const [contrasena, setContrasena] = useState('');
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

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">B</div>
            <h1>Belleza & Estilo</h1>
            <p>Sistema de Gestion</p>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>Documento de Identidad</label>
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

            <div className="form-group">
              <label>Contrasena</label>
              <input
                type="password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="Ingresa tu contrasena"
                required
                disabled={loading}
                className="form-control"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-block"
              style={{width:'100%'}}
            >
              {loading ? 'Iniciando sesion...' : 'Iniciar Sesion'}
            </button>
          </form>

          <div className="login-footer">
            <small>
              Demo: usuario: <strong>admin</strong> | contrasena: <strong>admin123</strong>
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}