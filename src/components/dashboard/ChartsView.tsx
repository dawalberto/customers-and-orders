import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  CartesianGrid,
  Legend
} from 'recharts';
import { Order, Client } from '../../types';
import { formatCurrency } from '../../utils/dateUtils';

interface ChartsViewProps {
  orders: Order[];
  clients: Client[];
}

const MONTH_NAMES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

export const ChartsView: React.FC<ChartsViewProps> = ({ orders, clients }) => {
  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();

  // Selected months to compare
  const [compareMonthA, setCompareMonthA] = useState<number>(Math.max(0, currentMonthIdx - 1));
  const [compareMonthB, setCompareMonthB] = useState<number>(currentMonthIdx);

  // 1. New clients in the last 12 months
  const newClientsMonthly = useMemo(() => {
    const counts = Array(12).fill(0);
    clients.forEach((c) => {
      try {
        const d = new Date(c.clientDate || c.createdAt);
        if (d.getFullYear() === currentYear) {
          counts[d.getMonth()]++;
        }
      } catch {
        // ignore
      }
    });

    return MONTH_NAMES.map((name, idx) => ({
      mes: name,
      clientes: counts[idx],
    }));
  }, [clients, currentYear]);

  // 2. Orders and Revenue comparison per month across current year
  const monthlyRevenueAndOrders = useMemo(() => {
    const data = MONTH_NAMES.map((name) => ({
      mes: name,
      pedidos: 0,
      ingresos: 0,
    }));

    orders.forEach((o) => {
      try {
        const d = new Date(o.orderDate);
        if (d.getFullYear() === currentYear) {
          const idx = d.getMonth();
          data[idx].pedidos += 1;
          data[idx].ingresos += Number(o.price) || 0;
        }
      } catch {
        // ignore
      }
    });

    return data;
  }, [orders, currentYear]);

  // Month A vs Month B comparison stats
  const comparisonData = useMemo(() => {
    const monthAData = monthlyRevenueAndOrders[compareMonthA];
    const monthBData = monthlyRevenueAndOrders[compareMonthB];

    return [
      {
        nombre: MONTH_NAMES[compareMonthA],
        pedidos: monthAData.pedidos,
        ingresos: monthAData.ingresos,
      },
      {
        nombre: MONTH_NAMES[compareMonthB],
        pedidos: monthBData.pedidos,
        ingresos: monthBData.ingresos,
      },
    ];
  }, [monthlyRevenueAndOrders, compareMonthA, compareMonthB]);

  // 3. Status distribution
  const statusDistribution = useMemo(() => {
    const counts = { pendiente: 0, listo: 0, enviado: 0 };
    orders.forEach((o) => {
      if (counts[o.status] !== undefined) counts[o.status]++;
    });

    return [
      { name: '⏳ Pendientes', value: counts.pendiente, color: '#f59e0b' },
      { name: '📦 Listos', value: counts.listo, color: '#0284c7' },
      { name: '✅ Enviados', value: counts.enviado, color: '#10b981' },
    ];
  }, [orders]);

  // 4. Shipping type distribution
  const shippingDistribution = useMemo(() => {
    const counts: Record<string, number> = { Ordinario: 0, Certificado: 0 };
    orders.forEach((o) => {
      if (o.shippingType && counts[o.shippingType] !== undefined) {
        counts[o.shippingType]++;
      }
    });

    return [
      { name: 'Ordinario', value: counts.Ordinario || 0, color: '#f472b6' },
      { name: 'Certificado', value: counts.Certificado || 0, color: '#db2777' },
    ];
  }, [orders]);

  // 5. Top clients by spending
  const topClients = useMemo(() => {
    const spendingMap = new Map<string, { name: string; total: number; count: number }>();

    orders.forEach((o) => {
      const client = clients.find((c) => c.id === o.clientId);
      const name = client ? `${client.name} ${client.surnames || ''}`.trim() : 'Cliente sin nombre';
      const existing = spendingMap.get(o.clientId) || { name, total: 0, count: 0 };
      existing.total += Number(o.price) || 0;
      existing.count += 1;
      spendingMap.set(o.clientId, existing);
    });

    return Array.from(spendingMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [orders, clients]);

  return (
    <div className="space-y-6">
      {/* 1. Comparison between months */}
      <div className="bg-white rounded-3xl border border-rose-100 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h4 className="font-bold text-slate-800 text-sm sm:text-base">
              Comparativa de Facturación y Pedidos entre Meses
            </h4>
            <p className="text-xs text-slate-500">
              Selecciona dos meses para comparar el rendimiento
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <select
              value={compareMonthA}
              onChange={(e) => setCompareMonthA(Number(e.target.value))}
              className="px-2.5 py-1.5 rounded-xl border border-rose-200 text-xs font-semibold text-rose-800 bg-rose-50/50 outline-none"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={idx} value={idx}>{m} {currentYear}</option>
              ))}
            </select>
            <span className="text-xs font-bold text-slate-400">vs</span>
            <select
              value={compareMonthB}
              onChange={(e) => setCompareMonthB(Number(e.target.value))}
              className="px-2.5 py-1.5 rounded-xl border border-rose-200 text-xs font-semibold text-rose-800 bg-rose-50/50 outline-none"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={idx} value={idx}>{m} {currentYear}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 2 Comparison Cards & Chart */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {comparisonData.map((data, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-50/50 to-pink-50/30 border border-rose-100"
            >
              <div className="flex items-center justify-between text-xs font-bold text-rose-900 mb-1">
                <span>{data.nombre} {currentYear}</span>
                <span className="px-2 py-0.5 rounded-md bg-white text-rose-700 text-[11px] shadow-2xs">
                  {data.pedidos} {data.pedidos === 1 ? 'pedido' : 'pedidos'}
                </span>
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-slate-900">
                {formatCurrency(data.ingresos)}
              </div>
            </div>
          ))}
        </div>

        {/* Annual Monthly Evolution Line Chart */}
        <div className="h-60 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyRevenueAndOrders} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffe4e6" />
              <XAxis dataKey="mes" tickLine={false} axisLine={{ stroke: '#fbcfe8' }} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                formatter={(value: any, name: any) => [
                  name === 'ingresos' ? formatCurrency(Number(value)) : `${value} pedidos`,
                  name === 'ingresos' ? 'Facturación' : 'Total Pedidos',
                ]}
                contentStyle={{ borderRadius: 12, border: '1px solid #fecdd3', fontSize: 12 }}
              />
              <Bar yAxisId="left" dataKey="ingresos" name="ingresos" fill="#f43f5e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. New Clients in the Last Year */}
      <div className="bg-white rounded-3xl border border-rose-100 p-5 shadow-xs">
        <div className="mb-4">
          <h4 className="font-bold text-slate-800 text-sm sm:text-base">
            Clientes Nuevos en el Año ({currentYear})
          </h4>
          <p className="text-xs text-slate-500">
            Crecimiento mensual de nuevos clientes registrados
          </p>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={newClientsMonthly} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffe4e6" />
              <XAxis dataKey="mes" tickLine={false} axisLine={{ stroke: '#fbcfe8' }} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                formatter={(val: any) => [`${val} nuevos clientes`, 'Nuevos Clientes']}
                contentStyle={{ borderRadius: 12, border: '1px solid #fecdd3', fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="clientes"
                stroke="#db2777"
                strokeWidth={3}
                dot={{ fill: '#db2777', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Distribution Graphs: Order Status & Shipping Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status Distribution */}
        <div className="bg-white rounded-3xl border border-rose-100 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-800 text-sm sm:text-base">
              Distribución por Estado
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              Proporción de pedidos pendientes, listos y enviados
            </p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            {orders.length === 0 ? (
              <span className="text-xs text-slate-400 italic">Sin datos de pedidos</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution.filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any, name: any) => [`${v} pedidos`, name]}
                    contentStyle={{ borderRadius: 12, border: '1px solid #fecdd3', fontSize: 12 }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Shipping Type Distribution */}
        <div className="bg-white rounded-3xl border border-rose-100 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-800 text-sm sm:text-base">
              Tipos de Envío
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              Comparación entre correo Ordinario y Certificado
            </p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            {orders.length === 0 ? (
              <span className="text-xs text-slate-400 italic">Sin datos de envíos</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={shippingDistribution.filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {shippingDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any, name: any) => [`${v} envíos`, name]}
                    contentStyle={{ borderRadius: 12, border: '1px solid #fecdd3', fontSize: 12 }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* 4. Top 5 Clients Leaderboard */}
      {topClients.length > 0 && (
        <div className="bg-white rounded-3xl border border-rose-100 p-5 shadow-xs">
          <h4 className="font-bold text-slate-800 text-sm sm:text-base mb-1">
            Top Clientes por Facturación
          </h4>
          <p className="text-xs text-slate-500 mb-4">
            Clientes que más ingresos han generado
          </p>

          <div className="space-y-2.5">
            {topClients.map((client, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/40 border border-rose-100/70"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-xs sm:text-sm truncate">
                      {client.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {client.count} {client.count === 1 ? 'pedido realizado' : 'pedidos realizados'}
                    </p>
                  </div>
                </div>
                <div className="font-extrabold text-slate-900 text-sm shrink-0">
                  {formatCurrency(client.total)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
