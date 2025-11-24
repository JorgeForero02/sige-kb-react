import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CategoriasProvider } from './context/CategoriasContext'; 
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { Login } from './components/Auth/Login';
import { HomePage } from './pages/HomePage';
import { EmpleadosPage } from './pages/EmpleadosPage';
import { CategoriasPage } from './pages/CategoriasPage';
import { CategoriaDetailPage } from './pages/CategoriaDetailPage'; 
import { ClientesPage } from './pages/ClientesPage';
import { ServiciosPage } from './pages/ServiciosPage';
import { CitasPage } from './pages/CitasPage';
import { FinanzasPage } from './pages/FinanzasPage';
import { RolesPage } from './pages/RolesPage';
import { UsuariosPage } from './pages/UsuariosPage';
import { ServiciosEmpleadoPage } from './pages/ServiciosEmpleadoPage';
import { NominaPage } from './pages/NominaPage';
import {AgendaEmpleadoPage} from './pages/AgendaEmpleadoPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CategoriasProvider> 
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/empleados" element={<ProtectedRoute><EmpleadosPage /></ProtectedRoute>} />
            <Route path="/servicios-empleado" element={<ServiciosEmpleadoPage />} />
            <Route path="/agenda-empleado" element={<AgendaEmpleadoPage />} />
            <Route path="/categorias" element={<ProtectedRoute><CategoriasPage /></ProtectedRoute>} />
            <Route path="/categorias/:categoriaNombre" element={<ProtectedRoute><CategoriaDetailPage /></ProtectedRoute>} />
            <Route path="/clientes" element={<ProtectedRoute><ClientesPage /></ProtectedRoute>} />
            <Route path="/servicios" element={<ProtectedRoute><ServiciosPage /></ProtectedRoute>} />
            <Route path="/citas" element={<ProtectedRoute><CitasPage /></ProtectedRoute>} />
            <Route path="/caja" element={<ProtectedRoute><FinanzasPage /></ProtectedRoute>} />
            <Route path="/nomina" element={<ProtectedRoute><NominaPage /></ProtectedRoute>} />
            <Route path="/roles" element={<ProtectedRoute><RolesPage /></ProtectedRoute>} />
            <Route path="/usuarios" element={<ProtectedRoute><UsuariosPage /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </CategoriasProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;