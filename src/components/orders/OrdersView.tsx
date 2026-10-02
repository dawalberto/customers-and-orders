import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Package, 
  Calendar, 
  ArrowUpDown, 
  User, 
  X,
  AlertCircle
} from 'lucide-react';
import { Order, Client, OrderStatus } from '../../types';
import { OrderCard } from './OrderCard';
import { OrderModal } from './OrderModal';
import { normalizeSearch } from '../../utils/dateUtils';

interface OrdersViewProps {
  orders: Order[];
  clients: Client[];
  onSaveOrder: (order: Partial<Order> & { clientId: string; price: number; shippingType: Order['shippingType']; orderDate: string }) => void;
  onDeleteOrder: (orderId: string) => void;
  onQuickCreateClient?: (client: Partial<Client> & { name: string }) => Client;
  selectedClientId?: string | null;
  onClearClientFilter?: () => void;
  onSelectClient?: (clientId: string) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  clients,
  onSaveOrder,
  onDeleteOrder,
  onQuickCreateClient,
  selectedClientId,
  onClearClientFilter,
  onSelectClient,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [activeClientId, setActiveClientId] = useState<string>(selectedClientId || 'all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [sortMode, setSortMode] = useState<'pending-oldest-first' | 'newest-first' | 'oldest-first'>('pending-oldest-first');

  // Keep activeClientId updated when prop changes
  React.useEffect(() => {
    if (selectedClientId) {
      setActiveClientId(selectedClientId);
    }
  }, [selectedClientId]);

  // Counts by status
  const pendingCount = orders.filter((o) => o.status === 'pendiente').length;
  const readyCount = orders.filter((o) => o.status === 'listo').length;
  const sentCount = orders.filter((o) => o.status === 'enviado').length;

  const filteredAndSortedOrders = useMemo(() => {
    const query = normalizeSearch(searchTerm);

    // 1. Filter
    const filtered = orders.filter((order) => {
      // Client filter
      if (activeClientId !== 'all' && order.clientId !== activeClientId) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'todos' && order.status !== statusFilter) {
        return false;
      }

      // Date filter
      if (dateFilter && order.orderDate !== dateFilter) {
        return false;
      }

      // Search term (searches in description, client name, address, shipping type)
      if (query) {
        const client = clients.find((c) => c.id === order.clientId);
        const normDesc = normalizeSearch(order.description);
        const normClientName = client ? normalizeSearch(`${client.name} ${client.surnames || ''}`) : '';
        const normAddress = normalizeSearch(order.shippingAddress);
        const normShippingType = normalizeSearch(order.shippingType);

        if (
          !normDesc.includes(query) &&
          !normClientName.includes(query) &&
          !normAddress.includes(query) &&
          !normShippingType.includes(query)
        ) {
          return false;
        }
      }

      return true;
    });

    // 2. Sort
    return filtered.sort((a, b) => {
      if (sortMode === 'pending-oldest-first') {
        // Priority rule requested by user:
        // "Por defecto aparece ordenado de manera que aparezcan arriba del todo los pedidos más viejos que todavía están pendientes. Es decir si hoy es jueves y el miércoles me hicieron un pedido, el martes también y el lunes también y el del lunes está listo y los otros dos están pendientes el orden debería ser: 1 - martes, 2 - miércoles, 3 - lunes"
        const isAPending = a.status === 'pendiente';
        const isBPending = b.status === 'pendiente';

        if (isAPending && !isBPending) return -1;
        if (!isAPending && isBPending) return 1;

        if (isAPending && isBPending) {
          // Both pending: oldest first (ascending by orderDate)
          return new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
        }

        // Neither is pending: sort Listo before Enviado, then by date
        if (a.status === 'listo' && b.status === 'enviado') return -1;
        if (a.status === 'enviado' && b.status === 'listo') return 1;

        // Same status: newest first
        return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
      }

      if (sortMode === 'newest-first') {
        return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
      }

      if (sortMode === 'oldest-first') {
        return new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
      }

      return 0;
    });
  }, [orders, clients, activeClientId, statusFilter, dateFilter, searchTerm, sortMode]);

  const selectedClientObj = clients.find((c) => c.id === activeClientId);

  return (
    <div className="space-y-4">
      {/* Active Client Banner if filtering by a specific client */}
      {activeClientId !== 'all' && selectedClientObj && (
        <div className="bg-rose-100/70 border border-rose-200/80 rounded-2xl p-3 flex items-center justify-between text-xs text-rose-900 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              Filtrando pedidos de: <strong>{selectedClientObj.name} {selectedClientObj.surnames}</strong>
            </span>
          </div>
          <button
            onClick={() => {
              setActiveClientId('all');
              if (onClearClientFilter) onClearClientFilter();
            }}
            className="inline-flex items-center gap-1 font-semibold text-rose-700 hover:text-rose-900 bg-white/70 hover:bg-white px-2 py-1 rounded-lg transition"
          >
            <X className="w-3.5 h-3.5" />
            <span>Ver todos los clientes</span>
          </button>
        </div>
      )}

      {/* Main search and new order button */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por descripción, cliente, dirección..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white border border-rose-200/80 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm placeholder:text-slate-400 shadow-2xs transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm shadow-xs transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Pedido</span>
        </button>
      </div>

      {/* Status Segmented Filter Bar */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white rounded-2xl border border-rose-100/90 shadow-2xs">
        <button
          onClick={() => setStatusFilter('todos')}
          className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-xl text-xs font-semibold text-center transition ${
            statusFilter === 'todos'
              ? 'bg-rose-500 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-rose-50/60'
          }`}
        >
          Todos ({orders.length})
        </button>
        <button
          onClick={() => setStatusFilter('pendiente')}
          className={`flex-1 min-w-[90px] py-1.5 px-2 rounded-xl text-xs font-semibold text-center transition ${
            statusFilter === 'pendiente'
              ? 'bg-amber-500 text-white shadow-2xs'
              : 'text-amber-800 hover:bg-amber-50'
          }`}
        >
          ⏳ Pendientes ({pendingCount})
        </button>
        <button
          onClick={() => setStatusFilter('listo')}
          className={`flex-1 min-w-[75px] py-1.5 px-2 rounded-xl text-xs font-semibold text-center transition ${
            statusFilter === 'listo'
              ? 'bg-sky-600 text-white shadow-2xs'
              : 'text-sky-800 hover:bg-sky-50'
          }`}
        >
          📦 Listos ({readyCount})
        </button>
        <button
          onClick={() => setStatusFilter('enviado')}
          className={`flex-1 min-w-[85px] py-1.5 px-2 rounded-xl text-xs font-semibold text-center transition ${
            statusFilter === 'enviado'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'text-emerald-800 hover:bg-emerald-50'
          }`}
        >
          ✅ Enviados ({sentCount})
        </button>
      </div>

      {/* Secondary Filters Bar: Client selector, Date picker, and Sort toggle */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* Client selector dropdown */}
        <div className="flex-1 min-w-[150px]">
          <select
            value={activeClientId}
            onChange={(e) => setActiveClientId(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl bg-white border border-rose-200/80 text-slate-700 outline-none focus:border-rose-400 text-xs shadow-2xs"
          >
            <option value="all">Todos los clientes ({clients.length})</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.surnames}
              </option>
            ))}
          </select>
        </div>

        {/* Date filter */}
        <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-xl border border-rose-200/80 shadow-2xs">
          <Calendar className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="outline-none text-xs text-slate-700 bg-transparent"
            title="Filtrar por fecha exacta de pedido"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-slate-400 hover:text-slate-600"
              title="Quitar filtro de fecha"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-xl border border-rose-200/80 shadow-2xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as any)}
            className="outline-none text-xs text-slate-700 bg-transparent font-medium"
          >
            <option value="pending-oldest-first">⏳ Prioridad pendientes antiguos</option>
            <option value="newest-first">Más recientes primero</option>
            <option value="oldest-first">Más antiguos primero</option>
          </select>
        </div>
      </div>

      {/* Orders List / Empty State */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-rose-100 p-8 sm:p-12 text-center max-w-md mx-auto my-6 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No hay pedidos registrados</h3>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Registra tus ventas de pendientes y bisutería. Podrás hacer seguimiento del estado de preparación y envío al instante.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm shadow-xs transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Crear primer pedido</span>
          </button>
        </div>
      ) : filteredAndSortedOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-rose-100 p-8 text-center text-slate-500 text-sm">
          No hay pedidos que coincidan con los filtros seleccionados.
          <div className="mt-3">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('todos');
                setDateFilter('');
                setActiveClientId('all');
                if (onClearClientFilter) onClearClientFilter();
              }}
              className="text-xs text-rose-600 font-semibold hover:underline"
            >
              Restablecer todos los filtros
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              clients={clients}
              onUpdate={onSaveOrder}
              onDelete={onDeleteOrder}
              onSelectClient={onSelectClient}
            />
          ))}
        </div>
      )}

      {/* Add Order Modal */}
      <OrderModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={onSaveOrder}
        clients={clients}
        onQuickCreateClient={onQuickCreateClient}
        preselectedClientId={activeClientId !== 'all' ? activeClientId : undefined}
      />
    </div>
  );
};
