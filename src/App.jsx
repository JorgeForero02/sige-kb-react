import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { Login } from './components/Auth/Login';
import { HomePage } from './pages/HomePage';
import { EmpleadosPage } from './pages/EmpleadosPage';
import { CategoriasPage } from './pages/CategoriasPage';
import { ClientesPage } from './pages/ClientesPage';
import { ServiciosPage } from './pages/ServiciosPage';
import { CitasPage } from './pages/CitasPage';
import { FinanzasPage } from './pages/FinanzasPage';
import { RolesPage } from './pages/RolesPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/empleados" element={<ProtectedRoute><EmpleadosPage /></ProtectedRoute>} />
          <Route path="/categorias" element={<ProtectedRoute><CategoriasPage /></ProtectedRoute>} />
          <Route path="/clientes" element={<ProtectedRoute><ClientesPage /></ProtectedRoute>} />
          <Route path="/servicios" element={<ProtectedRoute><ServiciosPage /></ProtectedRoute>} />
          <Route path="/citas" element={<ProtectedRoute><CitasPage /></ProtectedRoute>} />
          <Route path="/finanzas" element={<ProtectedRoute><FinanzasPage /></ProtectedRoute>} />
          <Route path="/roles" element={<ProtectedRoute><RolesPage /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/home" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;