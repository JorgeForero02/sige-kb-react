import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { logger } from '../services/logger';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, StatCard, Loading, Empty, Input } from '../components/common/Components';
import { AlertSimple } from '../components/common/AlertSimple';
import { useAlert } from '../hooks/useAlert';
import '../pages/Pages.css';

export function FinanzasPage() {
  const [data, setData] = useState(null);
  const [ingresos, setIngresos] = useState([]);
  const [egresos, setEgresos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const { alert, error: showError } = useAlert();

  useEffect(() => {
    loadFinanzas();
  }, [fecha]);

  const loadFinanzas = async () => {
    setLoading(true);
    try {
      const [ing, egr] = await Promise.all([
        api.getTotalIngresosDia(fecha),
        api.getTotalEgresosDia(fecha)
      ]);

      const ingTotal = ing.data?.total || 0;
      const egrTotal = egr.data?.total || 0;

      setData({
        ingresos: ingTotal,
        egresos: egrTotal,
        ganancia: ingTotal - egrTotal
      });

      const ingList = await api.getIngresos(`?fecha_inicio=${fecha}&fecha_fin=${fecha}`);
      const egrList = await api.getEgresos(`?fecha_inicio=${fecha}&fecha_fin=${fecha}`);

      setIngresos(ingList.data?.ingresos || []);
      setEgresos(egrList.data?.egresos || []);
      logger.success('Finanzas cargadas', `Ingresos: $${ingTotal}, Egresos: $${egrTotal}`);
    } catch (err) {
      logger.error('Error al cargar finanzas', err.message);
      showError(err.message);
    }
    setLoading(false);
  };

  if (!data) return <MainLayout title="Finanzas"><Loading /></MainLayout>;

  const gananciaColor = data.ganancia >= 0 ? 'success' : 'danger';

  return (
    <MainLayout title="Caja - Ingresos y Egresos">
      {alert && <AlertSimple message={alert.message} type={alert.type} />}

      <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />

      <div className="stats-grid">
        <StatCard icon="I" label="Ingresos" value={`$${data.ingresos}`} color="success" />
        <StatCard icon="E" label="Egresos" value={`$${data.egresos}`} color="danger" />
        <StatCard icon="G" label="Ganancia" value={`$${data.ganancia}`} color={gananciaColor} />
      </div>

      <div className="finanzas-grid">
        <Card>
          <h4 style={{marginBottom: '1.5rem', fontWeight: '700'}}>Ingresos del Dia</h4>
          {ingresos.length > 0 ? (
            ingresos.map(i => (
              <div key={i.id} className="registro-row">
                <span>{i.servicioInfo?.nombre}</span>
                <span>${i.valor}</span>
              </div>
            ))
          ) : (
            <Empty message="Sin ingresos" />
          )}
        </Card>

        <Card>
          <h4 style={{marginBottom: '1.5rem', fontWeight: '700'}}>Egresos del Dia</h4>
          {egresos.length > 0 ? (
            egresos.map(e => (
              <div key={e.id} className="registro-row">
                <span>{e.categoriaInfo?.nombre}</span>
                <span>-${e.valor}</span>
              </div>
            ))
          ) : (
            <Empty message="Sin egresos" />
          )}
        </Card>
      </div>
    </MainLayout>
  );
}