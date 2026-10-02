import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Package, 
  Calendar, 
  ArrowUpDown, 
  User, 
  X,
  Layers,
  List
} from 'lucide-react';
import { Order, Client, OrdersViewMode } from '../../types';
import { OrderCard } from './OrderCard';
import { ClientOrderStack } from './ClientOrderStack';
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
  
  // Default view mode is STACK as requested by user!
  const [viewMode, setViewMode] = useState<OrdersViewMode>('stack');

  // Preselected client for creating order from stack
  const [modalClientId, setModalClientId] = useState<string | undefined>(undefined);

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
      if (activeClientId !== 'all' && order.clientId !== activeClientId) {
        return false;
      }

      if (statusFilter !== 'todos' && order.status !== statusFilter) {
        return false;
      }

      if (dateFilter && order.orderDate !== dateFilter) {
        return false;
      }

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
        const isAPending = a.status === 'pendiente';
        const isBPending = b.status === 'pendiente';

        if (isAPending && !isBPending) return -1;
        if (!isAPending && isBPending) return 1;

        if (isAPending && isBPending) {
          return new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
        }

        if (a.status === 'listo' && b.status === 'enviado') return -1;
        if (a.status === 'enviado' && b.status === 'listo') return 1;

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

  // Group orders into stacks by client
  const clientStacks = useMemo(() => {
    const map = new Map<string, Order[]>();

    filteredAndSortedOrders.forEach((o) => {
      const arr = map.get(o.clientId) || [];
      arr.push(o);
      map.set(o.clientId, arr);
    });

    // Transform into array of objects with client and sorted orders
    const stacks = Array.from(map.entries()).map(([cId, clientOrders]) => {
      const client = clients.find((c) => c.id === cId);
      const hasPending = clientOrders.some((o) => o.status === 'pendiente');
      const oldestPendingDate = hasPending
        ? Math.min(
            ...clientOrders
              .filter((o) => o.status === 'pendiente')
              .map((o) => new Date(o.orderDate).getTime())
          )
        : Infinity;

      return {
        clientId: cId,
        client,
        orders: clientOrders,
        hasPending,
        oldestPendingDate,
      };
    });

    // Sort stacks: stacks with pending orders first (oldest pending date first), matching user priority
    stacks.sort((a, b) => {
      if (a.hasPending && !b.hasPending) return -1;
      if (!a.hasPending && b.hasPending) return 1;
      if (a.hasPending && b.hasPending) {
        return a.oldestPendingDate - b.oldestPendingDate;
      }
      return 0;
    });

    return stacks;
  }, [filteredAndSortedOrders, clients]);

  const selectedClientObj = clients.find((c) => c.id === activeClientId);

  const handleOpenAddModal = (clientId?: string) => {
    setModalClientId(clientId || (activeClientId !== 'all' ? activeClientId : undefined));
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-4 overflow-x-hidden">
      {/* 1. Main Search & New Order Action Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por descripción, cliente, dirección..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white border border-slate-200/90 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm placeholder:text-slate-400 shadow-2xs transition"
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
          onClick={() => handleOpenAddModal()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm shadow-xs transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 text-purple-300" />
          <span>Nuevo Pedido</span>
        </button>
      </div>

      {/* 2. Client Filter Banner - PLACED DIRECTLY ABOVE FILTERS as requested */}
      {activeClientId !== 'all' && selectedClientObj && (
        <div className="bg-purple-100/70 border border-purple-200 rounded-2xl p-3 flex items-center justify-between text-xs text-purple-950 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 min-w-0">
            <User className="w-4 h-4 text-purple-700 shrink-0" />
            <span className="truncate">
              Filtrando pedidos de: <strong>{selectedClientObj.name} {selectedClientObj.surnames}</strong>
            </span>
          </div>
          <button
            onClick={() => {
              setActiveClientId('all');
              if (onClearClientFilter) onClearClientFilter();
            }}
            className="inline-flex items-center gap-1 font-semibold text-purple-800 hover:text-purple-950 bg-white/80 hover:bg-white px-2.5 py-1 rounded-xl transition shrink-0 ml-2 shadow-2xs"
          >
            <X className="w-3.5 h-3.5" />
            <span>Ver todos los clientes</span>
          </button>
        </div>
      )}

      {/* 3. Status Segmented Filter Bar */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white rounded-2xl border border-purple-100 shadow-2xs">
        <button
          onClick={() => setStatusFilter('todos')}
          className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-xl text-xs font-semibold text-center transition ${
            statusFilter === 'todos'
              ? 'bg-zinc-900 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-purple-50/60'
          }`}
        >
          Todos ({orders.length})
        </button>
        <button
          onClick={() => setStatusFilter('pendiente')}
          className={`flex-1 min-w-[90px] py-1.5 px-2 rounded-xl text-xs font-semibold text-center transition ${
            statusFilter === 'pendiente'
              ? 'bg-amber-500 text-white shadow-2xs font-bold'
              : 'text-amber-800 hover:bg-amber-50'
          }`}
        >
          ⏳ Pendientes ({pendingCount})
        </button>
        <button
          onClick={() => setStatusFilter('listo')}
          className={`flex-1 min-w-[75px] py-1.5 px-2 rounded-xl text-xs font-semibold text-center transition ${
            statusFilter === 'listo'
              ? 'bg-purple-600 text-white shadow-2xs font-bold'
              : 'text-purple-800 hover:bg-purple-50'
          }`}
        >
          📦 Listos ({readyCount})
        </button>
        <button
          onClick={() => setStatusFilter('enviado')}
          className={`flex-1 min-w-[85px] py-1.5 px-2 rounded-xl text-xs font-semibold text-center transition ${
            statusFilter === 'enviado'
              ? 'bg-emerald-600 text-white shadow-2xs font-bold'
              : 'text-emerald-800 hover:bg-emerald-50'
          }`}
        >
          ✅ Enviados ({sentCount})
        </button>
      </div>

      {/* 4. Secondary Filters & View Switcher (Stack vs List) */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Client selector dropdown */}
          <div className="min-w-[140px] flex-1 max-w-[240px]">
            <select
              value={activeClientId}
              onChange={(e) => setActiveClientId(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 outline-none focus:border-purple-500 text-xs shadow-2xs"
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
          <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-purple-600 shrink-0" />
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
          <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-purple-600 shrink-0" />
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

        {/* View mode toggle: Stack (default) vs List */}
        <div className="flex items-center p-1 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <button
            onClick={() => setViewMode('stack')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              viewMode === 'stack'
                ? 'bg-purple-100 text-purple-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Vista agrupada por cliente (Stack)"
          >
            <Layers className="w-3.5 h-3.5 text-purple-700" />
            <span>Por Clientes (Stack)</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              viewMode === 'list'
                ? 'bg-purple-100 text-purple-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Vista de lista individual"
          >
            <List className="w-3.5 h-3.5 text-purple-700" />
            <span>Individual</span>
          </button>
        </div>
      </div>

      {/* Orders Content / Empty States */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-purple-100 p-8 sm:p-12 text-center max-w-md mx-auto my-6 shadow-2xs">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-200/80 text-purple-600 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No hay pedidos registrados</h3>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Registra tus ventas de pendientes y bisutería. Podrás hacer seguimiento del estado de preparación y envío al instante.
          </p>
          <button
            onClick={() => handleOpenAddModal()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm shadow-xs transition active:scale-95"
          >
            <Plus className="w-4 h-4 text-purple-300" />
            <span>Crear primer pedido</span>
          </button>
        </div>
      ) : filteredAndSortedOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
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
              className="text-xs text-purple-700 font-semibold hover:underline"
            >
              Restablecer todos los filtros
            </button>
          </div>
        </div>
      ) : viewMode === 'stack' ? (
        /* VISTA 2 (DEFAULT): Stack por cliente */
        <div className="space-y-3.5">
          {clientStacks.map((stack) => (
            <ClientOrderStack
              key={stack.clientId}
              client={stack.client}
              orders={stack.orders}
              allClients={clients}
              onSaveOrder={onSaveOrder}
              onDeleteOrder={onDeleteOrder}
              onSelectClient={onSelectClient}
              onAddOrderForClient={handleOpenAddModal}
              defaultExpanded={clientStacks.length === 1 || stack.hasPending}
            />
          ))}
        </div>
      ) : (
        /* VISTA 1: Lista individual de pedidos */
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
        preselectedClientId={modalClientId}
      />
    </div>
  );
};
