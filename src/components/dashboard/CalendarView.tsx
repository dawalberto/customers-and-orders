import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Package, 
  X, 
  ArrowRight,
} from 'lucide-react';
import { Order, Client } from '../../types';
import { formatCurrency, formatDateSpanish } from '../../utils/dateUtils';

interface CalendarViewProps {
  orders: Order[];
  clients: Client[];
  onSelectOrder: (orderId: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  orders,
  clients,
  onSelectOrder,
}) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDayOrders, setSelectedDayOrders] = useState<{ dateStr: string; orders: Order[] } | null>(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Month stats for the top right badge
  const monthStats = useMemo(() => {
    let count = 0;
    let totalMoney = 0;

    orders.forEach((o) => {
      try {
        const d = new Date(o.orderDate);
        if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
          count++;
          totalMoney += Number(o.price) || 0;
        }
      } catch {
        // ignore
      }
    });

    return { count, totalMoney };
  }, [orders, currentYear, currentMonth]);

  // Map orders by YYYY-MM-DD
  const ordersByDate = useMemo(() => {
    const map = new Map<string, Order[]>();
    orders.forEach((o) => {
      if (!o.orderDate) return;
      const key = o.orderDate.split('T')[0];
      const arr = map.get(key) || [];
      arr.push(o);
      map.set(key, arr);
    });
    return map;
  }, [orders]);

  // Calendar grid calculations
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthDaysCount = new Date(currentYear, currentMonth, 0).getDate();

    const days = [];

    // Leading days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthDaysCount - i;
      const prevDate = new Date(currentYear, currentMonth - 1, dayNum);
      const y = prevDate.getFullYear();
      const m = String(prevDate.getMonth() + 1).padStart(2, '0');
      const d = String(dayNum).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      days.push({
        dayNum,
        dateStr,
        isCurrentMonth: false,
        orders: ordersByDate.get(dateStr) || [],
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const y = currentYear;
      const m = String(currentMonth + 1).padStart(2, '0');
      const d = String(dayNum).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      days.push({
        dayNum,
        dateStr,
        isCurrentMonth: true,
        orders: ordersByDate.get(dateStr) || [],
      });
    }

    // Trailing days
    const totalSlots = days.length <= 35 ? 35 : 42;
    const remaining = totalSlots - days.length;
    for (let dayNum = 1; dayNum <= remaining; dayNum++) {
      const nextDate = new Date(currentYear, currentMonth + 1, dayNum);
      const y = nextDate.getFullYear();
      const m = String(nextDate.getMonth() + 1).padStart(2, '0');
      const d = String(dayNum).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      days.push({
        dayNum,
        dateStr,
        isCurrentMonth: false,
        orders: ordersByDate.get(dateStr) || [],
      });
    }

    return days;
  }, [currentYear, currentMonth, ordersByDate]);

  const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const todayStr = useMemo(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  }, []);

  return (
    <div className="bg-white rounded-3xl border border-purple-100 shadow-2xs overflow-hidden flex flex-col min-h-[560px]">
      {/* Calendar Header with Navigation and Month Total Badge */}
      <div className="p-4 sm:p-5 border-b border-purple-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-purple-50/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl text-slate-700 hover:bg-white hover:text-purple-700 transition shadow-2xs"
              title="Mes anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl text-slate-700 hover:bg-white hover:text-purple-700 transition shadow-2xs"
              title="Mes siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl capitalize">
            {capitalizedMonthName}
          </h3>

          <button
            onClick={handleToday}
            className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-white text-purple-700 border border-purple-200 hover:bg-purple-50 transition shadow-2xs"
          >
            Hoy
          </button>
        </div>

        {/* Top Right Month Badge */}
        <div className="inline-flex items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 rounded-2xl bg-white border border-purple-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500">Total {currentDate.toLocaleDateString('es-ES', { month: 'short' })}:</span>
          <span className="text-xs font-bold text-purple-950 bg-purple-100 px-2 py-0.5 rounded-lg">
            {monthStats.count} {monthStats.count === 1 ? 'pedido' : 'pedidos'}
          </span>
          <span className="text-xs font-black text-slate-950 bg-zinc-100 px-2 py-0.5 rounded-lg">
            {formatCurrency(monthStats.totalMoney)}
          </span>
        </div>
      </div>

      {/* Weekdays header */}
      <div className="grid grid-cols-7 border-b border-purple-100/70 bg-purple-50/10 text-center text-[11px] sm:text-xs font-bold text-slate-600 py-2.5">
        <span>Lun</span>
        <span>Mar</span>
        <span>Mié</span>
        <span>Jue</span>
        <span>Vie</span>
        <span className="text-purple-600">Sáb</span>
        <span className="text-purple-600">Dom</span>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 auto-rows-fr flex-1 divide-x divide-y divide-purple-100/50">
        {calendarDays.map((day, idx) => {
          const hasOrders = day.orders.length > 0;
          const dayTotalMoney = day.orders.reduce((sum, o) => sum + (Number(o.price) || 0), 0);
          const isToday = day.dateStr === todayStr;

          return (
            <div
              key={idx}
              className={`p-1.5 sm:p-2 min-h-[75px] sm:min-h-[105px] flex flex-col justify-between transition-colors ${
                !day.isCurrentMonth
                  ? 'bg-slate-50/40 text-slate-400'
                  : isToday
                  ? 'bg-purple-50/20'
                  : 'bg-white hover:bg-purple-50/15'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold inline-flex items-center justify-center w-6 h-6 rounded-full ${
                    isToday
                      ? 'bg-zinc-900 text-white shadow-2xs'
                      : day.isCurrentMonth
                      ? 'text-slate-800'
                      : 'text-slate-400'
                  }`}
                >
                  {day.dayNum}
                </span>
              </div>

              {/* Day badge */}
              {hasOrders && (
                <button
                  type="button"
                  onClick={() => setSelectedDayOrders({ dateStr: day.dateStr, orders: day.orders })}
                  className="mt-1 w-full text-left p-1 sm:p-1.5 rounded-xl bg-purple-100/80 border border-purple-200 hover:border-purple-400 hover:shadow-xs transition active:scale-95 group"
                >
                  <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold text-purple-950 leading-tight">
                    <span className="truncate">
                      📦 {day.orders.length}
                    </span>
                    <span className="text-[10px] font-extrabold text-slate-900">
                      {formatCurrency(dayTotalMoney)}
                    </span>
                  </div>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal listing orders for a selected day */}
      {selectedDayOrders && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-x-hidden">
          <div className="bg-white w-full max-w-md rounded-3xl max-h-[85vh] flex flex-col shadow-2xl border border-purple-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-purple-100 flex items-center justify-between bg-purple-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Pedidos del {formatDateSpanish(selectedDayOrders.dateStr)}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedDayOrders.orders.length} {selectedDayOrders.orders.length === 1 ? 'pedido' : 'pedidos'} · Total:{' '}
                  <strong className="text-purple-950 font-black">
                    {formatCurrency(
                      selectedDayOrders.orders.reduce((sum, o) => sum + (Number(o.price) || 0), 0)
                    )}
                  </strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedDayOrders(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2.5">
              {selectedDayOrders.orders.map((order) => {
                const client = clients.find((c) => c.id === order.clientId);
                return (
                  <div
                    key={order.id}
                    onClick={() => {
                      setSelectedDayOrders(null);
                      onSelectOrder(order.id);
                    }}
                    className="p-3 rounded-2xl border border-purple-100 bg-white hover:bg-purple-50/40 hover:border-purple-300 transition cursor-pointer flex items-center justify-between gap-3 shadow-2xs group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {order.photo ? (
                        <img
                          src={order.photo}
                          alt="Joyas"
                          className="w-12 h-12 rounded-xl object-cover border border-purple-200 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0">
                          <Package className="w-5 h-5" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm truncate">
                          {order.description || 'Pedido de pendientes'}
                        </h4>
                        <p className="text-xs text-slate-600 truncate mt-0.5">
                          {client ? `${client.name} ${client.surnames || ''}` : 'Cliente'}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                          <span className="font-semibold text-purple-800">
                            {order.status === 'pendiente'
                              ? '⏳ Pendiente'
                              : order.status === 'listo'
                              ? '📦 Listo'
                              : '✅ Enviado'}
                          </span>
                          <span>·</span>
                          <span>{order.shippingType}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-2">
                      <span className="font-extrabold text-slate-950 text-sm">
                        {formatCurrency(order.price)}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-700 group-hover:translate-x-0.5 transition" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
