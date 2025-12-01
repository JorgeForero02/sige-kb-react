import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const CategoriasContext = createContext();

export function CategoriasProvider({ children }) {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoriasOpen, setCategoriasOpen] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchCategorias = useCallback(async (force = false) => {
    if (loading || (hasLoaded && !force)) {
      return;
    }

    setLoading(true);
    try {
      const res = await api.getCategorias();
      setCategorias(res.data || []);
      setHasLoaded(true);
    } catch (error) {
      console.error('Error fetching categorias:', error);
      setHasLoaded(false);
    }
    setLoading(false);
  }, [loading, hasLoaded]);

  const refreshCategorias = useCallback(() => {
    fetchCategorias(true);
  }, [fetchCategorias]);

  useEffect(() => {
    if (!hasLoaded && !loading) {
      fetchCategorias();
    }
  }, [hasLoaded, loading, fetchCategorias]);

  return (
    <CategoriasContext.Provider value={{
      categorias,
      loading,
      categoriasOpen,
      setCategoriasOpen,
      refreshCategorias,
      fetchCategorias,
      hasLoaded
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