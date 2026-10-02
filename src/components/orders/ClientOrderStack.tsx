import React, { useState } from 'react';
import { 
  Users, 
  Package, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  Phone, 
  Plus, 
  ExternalLink,
  Layers,
  Euro
} from 'lucide-react';
import { Client, Order } from '../../types';
import { formatCurrency } from '../../utils/dateUtils';
import { OrderCard } from './OrderCard';

interface ClientOrderStackProps {
  client?: Client;
  orders: Order[];
  allClients: Client[];
  onSaveOrder: (order: Partial<Order> & { clientId: string; price: number; shippingType: Order['shippingType']; orderDate: string }) => void;
  onDeleteOrder: (orderId: string) => void;
  onSelectClient?: (clientId: string) => void;
  onAddOrderForClient?: (clientId: string) => void;
  defaultExpanded?: boolean;
}

export const ClientOrderStack: React.FC<ClientOrderStackProps> = ({
  client,
  orders,
  allClients,
  onSaveOrder,
  onDeleteOrder,
  onSelectClient,
  onAddOrderForClient,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Status breakdown in this stack
  const pendingOrders = orders.filter((o) => o.status === 'pendiente');
  const readyOrders = orders.filter((o) => o.status === 'listo');
  const sentOrders = orders.filter((o) => o.status === 'enviado');

  const totalSpentInStack = orders.reduce((sum, o) => sum + (Number(o.price) || 0), 0);

  // Determine stack priority highlight
  const hasPending = pendingOrders.length > 0;
  const hasReady = readyOrders.length > 0;

  return (
    <div className="rounded-3xl border border-purple-100 bg-white shadow-2xs hover:shadow-xs transition-all duration-200 overflow-hidden">
      {/* Stack Header Bar (Clickable to fold/unfold) */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={`p-4 cursor-pointer select-none transition-colors ${
          isExpanded ? 'bg-purple-50/40 border-b border-purple-100' : 'hover:bg-purple-50/20'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Client Details (Given High Importance as requested) */}
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            {client?.photo ? (
              <img
                src={client.photo}
                alt={client.name}
                className="w-13 h-13 rounded-2xl object-cover border border-purple-200 shadow-2xs shrink-0"
              />
            ) : (
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 text-white font-extrabold text-lg flex items-center justify-center shadow-2xs shrink-0">
                {client ? client.name.charAt(0).toUpperCase() : '?'}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-slate-900 text-base leading-snug truncate">
                  {client ? `${client.name} ${client.surnames || ''}` : 'Cliente desconocido'}
                </h3>
                {client?.tags && client.tags.length > 0 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200/60">
                    #{client.tags[0]}
                  </span>
                )}
              </div>

              {/* Client mini-details: phone and address */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-0.5">
                {client?.phone && (
                  <span className="flex items-center gap-1 text-slate-700">
                    <Phone className="w-3 h-3 text-purple-600" />
                    <span>{client.phone}</span>
                  </span>
                )}
                {client?.address && (
                  <span className="flex items-center gap-1 text-slate-500 truncate max-w-[220px]">
                    <MapPin className="w-3 h-3 text-purple-600 shrink-0" />
                    <span className="truncate">{client.address}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right side: Stack stats & Expand button */}
          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-purple-100/60">
            {/* Status pills inside stack */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {pendingOrders.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200">
                  ⏳ {pendingOrders.length}
                </span>
              )}
              {readyOrders.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-purple-100 text-purple-900 border border-purple-200">
                  📦 {readyOrders.length}
                </span>
              )}
              {sentOrders.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200">
                  ✅ {sentOrders.length}
                </span>
              )}
            </div>

            {/* Total Money in this stack */}
            <div className="text-right">
              <span className="font-extrabold text-slate-950 text-base">
                {formatCurrency(totalSpentInStack)}
              </span>
              <span className="block text-[10px] text-slate-500 font-semibold">
                {orders.length} {orders.length === 1 ? 'pedido en total' : 'pedidos en total'}
              </span>
            </div>

            {/* Chevron toggle */}
            <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 shadow-2xs">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-purple-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Stack Content: List of orders of this client */}
      {isExpanded && (
        <div className="p-3 sm:p-4 bg-purple-50/20 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs text-slate-600 px-1">
            <span className="font-bold flex items-center gap-1.5 text-purple-950">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              Pedidos de este cliente ({orders.length})
            </span>
            {client && onAddOrderForClient && (
              <button
                type="button"
                onClick={() => onAddOrderForClient(client.id)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir otro pedido</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                clients={allClients}
                onUpdate={onSaveOrder}
                onDelete={onDeleteOrder}
                onSelectClient={onSelectClient}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
