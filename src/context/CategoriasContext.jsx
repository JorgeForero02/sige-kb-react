// context/CategoriasContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const CategoriasContext = createContext();

export function CategoriasProvider({ children }) {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoriasOpen, setCategoriasOpen] = useState(false); 

  const fetchCategorias = async () => {
    setLoading(true);
    try {
      const res = await api.getCategorias();
      setCategorias(res.data || []);
    } catch (error) {
      console.error('Error fetching categorias:', error);
    }
    setLoading(false);
  };

  const refreshCategorias = () => {
    fetchCategorias();
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  return (
    <CategoriasContext.Provider value={{
      categorias,
      loading,
      categoriasOpen,      
      setCategoriasOpen,     
      refreshCategorias,
      fetchCategorias
    }}>
      {children}
    </CategoriasContext.Provider>
  );
}

export function useCategorias() {
  const context = useContext(CategoriasContext);
  if (!context) {
    throw new Error('useCategorias must be used within a CategoriasProvider');
  }
  return context;
}