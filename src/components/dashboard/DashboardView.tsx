import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Calendar, 
  Euro, 
  Package, 
  Clock, 
  Send, 
  Users, 
  TrendingUp, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Order, Client } from '../../types';
import { formatCurrency, calculateDaysBetween, getTodayDateString } from '../../utils/dateUtils';
import { ChartsView } from './ChartsView';
import { CalendarView } from './CalendarView';

interface DashboardViewProps {
  orders: Order[];
  clients: Client[];
  onSelectOrder: (orderId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders,
  clients,
  onSelectOrder,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'graficas' | 'historico'>('graficas');

  // Calculations for the General Overview
  const metrics = useMemo(() => {
    const now = new Date();
    const todayStr = getTodayDateString();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Start of week (Monday)
    const dayOfWeek = (now.getDay() + 6) % 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    let yearOrders = 0;
    let yearMoney = 0;

    let monthOrders = 0;
    let monthMoney = 0;

    let weekOrders = 0;
    let weekMoney = 0;

    let dayOrders = 0;
    let dayMoney = 0;

    // Time calculations
    const prepDaysList: number[] = [];
    const shipDaysList: number[] = [];

    orders.forEach((o) => {
      const priceVal = Number(o.price) || 0;
      const orderDate = new Date(o.orderDate);
      const isToday = o.orderDate === todayStr;

      // Year stats
      if (orderDate.getFullYear() === currentYear) {
        yearOrders++;
        yearMoney += priceVal;
      }

      // Month stats
      if (orderDate.getFullYear() === currentYear && orderDate.getMonth() === currentMonth) {
        monthOrders++;
        monthMoney += priceVal;
      }

      // Week stats
      if (orderDate >= startOfWeek) {
        weekOrders++;
        weekMoney += priceVal;
      }

      // Day stats
      if (isToday) {
        dayOrders++;
        dayMoney += priceVal;
      }

      // Prep time (between orderDate and readyDate)
      if (o.readyDate && o.orderDate) {
        const diff = calculateDaysBetween(o.orderDate, o.readyDate);
        if (diff !== null) {
          prepDaysList.push(diff.days);
        }
      }

      // Ship time (between readyDate and shippedDate, or orderDate and shippedDate if no readyDate)
      if (o.shippedDate) {
        const baseDate = o.readyDate || o.orderDate;
        const diff = calculateDaysBetween(baseDate, o.shippedDate);
        if (diff !== null) {
          shipDaysList.push(diff.days);
        }
      }
    });

    const avgPrepDays = prepDaysList.length > 0
      ? (prepDaysList.reduce((a, b) => a + b, 0) / prepDaysList.length).toFixed(1)
      : null;

    const avgShipDays = shipDaysList.length > 0
      ? (shipDaysList.reduce((a, b) => a + b, 0) / shipDaysList.length).toFixed(1)
      : null;

    const avgOrdersPerClient = clients.length > 0
      ? (orders.length / clients.length).toFixed(1)
      : '0';

    return {
      yearOrders,
      yearMoney,
      monthOrders,
      monthMoney,
      weekOrders,
      weekMoney,
      dayOrders,
      dayMoney,
      avgPrepDays,
      avgShipDays,
      avgOrdersPerClient,
    };
  }, [orders, clients]);

  return (
    <div className="space-y-6">
      {/* 1. Overview General (Requested exact metrics) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800">Resumen y Análisis</h2>
            <p className="text-xs text-slate-500">Métricas en tiempo real de tu taller de bisutería</p>
          </div>
        </div>

        {/* Primary Period KPIs Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          {/* Hoy */}
          <div className="bg-white rounded-2xl border border-rose-100 p-3.5 shadow-2xs hover:shadow-xs transition">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 block mb-1">
              Hoy
            </span>
            <div className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
              {formatCurrency(metrics.dayMoney)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <Package className="w-3.5 h-3.5 text-rose-400" />
              <span>{metrics.dayOrders} {metrics.dayOrders === 1 ? 'pedido' : 'pedidos'}</span>
            </div>
          </div>

          {/* Esta Semana */}
          <div className="bg-white rounded-2xl border border-rose-100 p-3.5 shadow-2xs hover:shadow-xs transition">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 block mb-1">
              Esta semana
            </span>
            <div className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
              {formatCurrency(metrics.weekMoney)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <Package className="w-3.5 h-3.5 text-rose-400" />
              <span>{metrics.weekOrders} {metrics.weekOrders === 1 ? 'pedido' : 'pedidos'}</span>
            </div>
          </div>

          {/* Este Mes */}
          <div className="bg-white rounded-2xl border border-rose-100 p-3.5 shadow-2xs hover:shadow-xs transition">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 block mb-1">
              Este mes
            </span>
            <div className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
              {formatCurrency(metrics.monthMoney)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <Package className="w-3.5 h-3.5 text-rose-400" />
              <span>{metrics.monthOrders} {metrics.monthOrders === 1 ? 'pedido' : 'pedidos'}</span>
            </div>
          </div>

          {/* Este Año */}
          <div className="bg-white rounded-2xl border border-rose-100 p-3.5 shadow-2xs hover:shadow-xs transition">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 block mb-1">
              Año actual
            </span>
            <div className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
              {formatCurrency(metrics.yearMoney)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <Package className="w-3.5 h-3.5 text-rose-400" />
              <span>{metrics.yearOrders} {metrics.yearOrders === 1 ? 'pedido' : 'pedidos'}</span>
            </div>
          </div>
        </div>

        {/* Operational Efficiency KPIs: Tiempo medio preparar, enviar, pedidos por cliente */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5 mt-3">
          {/* Prep time */}
          <div className="bg-gradient-to-br from-white to-amber-50/40 rounded-2xl border border-amber-200/60 p-3.5 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block leading-tight">
                Tiempo medio en preparar
              </span>
              <div className="text-base sm:text-lg font-bold text-slate-800">
                {metrics.avgPrepDays !== null ? `${metrics.avgPrepDays} días` : 'Sin datos aún'}
              </div>
            </div>
          </div>

          {/* Ship time */}
          <div className="bg-gradient-to-br from-white to-sky-50/40 rounded-2xl border border-sky-200/60 p-3.5 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block leading-tight">
                Tiempo medio en enviar
              </span>
              <div className="text-base sm:text-lg font-bold text-slate-800">
                {metrics.avgShipDays !== null ? `${metrics.avgShipDays} días` : 'Sin datos aún'}
              </div>
            </div>
          </div>

          {/* Average orders per client */}
          <div className="bg-gradient-to-br from-white to-rose-50/50 rounded-2xl border border-rose-200/60 p-3.5 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block leading-tight">
                Media pedidos / cliente
              </span>
              <div className="text-base sm:text-lg font-bold text-slate-800">
                {metrics.avgOrdersPerClient} pedidos
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sub-Tabs: Gráficas & Histórico (Calendario) */}
      <div className="space-y-4">
        {/* Tab Controls */}
        <div className="flex p-1 bg-white rounded-2xl border border-rose-100/90 shadow-2xs max-w-sm">
          <button
            onClick={() => setActiveSubTab('graficas')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'graficas'
                ? 'bg-rose-500 text-white shadow-2xs'
                : 'text-slate-600 hover:text-rose-600'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Gráficas</span>
          </button>
          <button
            onClick={() => setActiveSubTab('historico')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'historico'
                ? 'bg-rose-500 text-white shadow-2xs'
                : 'text-slate-600 hover:text-rose-600'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Histórico (Calendario)</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeSubTab === 'graficas' ? (
          <ChartsView orders={orders} clients={clients} />
        ) : (
          <CalendarView
            orders={orders}
            clients={clients}
            onSelectOrder={onSelectOrder}
          />
        )}
      </div>
    </div>
  );
};
