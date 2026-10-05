import React, { useState } from 'react';
import { 
  Users, 
  Package, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  Phone, 
  Plus, 
  Layers,
  Send
} from 'lucide-react';
import { Client, Order, OrderPackage, ShippingRateConfig } from '../../types';
import { formatCurrency } from '../../utils/dateUtils';
import { OrderCard } from './OrderCard';
import { OrderPriceDisplay } from '../common/OrderPriceDisplay';

interface ClientOrderStackProps {
  client?: Client;
  orders: Order[];
  allClients: Client[];
  onSaveOrder: (order: Partial<Order> & { clientId: string; shippingType: Order['shippingType']; orderDate: string; packages: OrderPackage[] }) => void | Promise<void>;
  onDeleteOrder: (orderId: string) => void | Promise<void>;
  onSelectClient?: (clientId: string) => void;
  onAddOrderForClient?: (clientId: string) => void;
  onMovePackage?: (pkg: OrderPackage, order: Order) => void;
  defaultExpanded?: boolean;
  shippingRates?: ShippingRateConfig | null;
}

export const ClientOrderStack: React.FC<ClientOrderStackProps> = ({
  client,
  orders,
  allClients,
  onSaveOrder,
  onDeleteOrder,
  onSelectClient,
  onAddOrderForClient,
  onMovePackage,
  defaultExpanded = false,
  shippingRates,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Status breakdown in this stack (4 states)
  const pendingOrders = orders.filter((o) => o.status === 'pendiente');
  const readyOrders = orders.filter((o) => o.status === 'listo');
  const packagedOrders = orders.filter((o) => o.status === 'empaquetado');
  const sentOrders = orders.filter((o) => o.status === 'enviado');

  // Gift check for stack
  const stackHasGift = Boolean(
    shippingRates?.giftThresholdEnabled &&
    typeof shippingRates.giftThresholdAmount === 'number' &&
    orders.some((o) => (Number(o.price) || 0) >= shippingRates.giftThresholdAmount!)
  );

  // Package counts
  const totalPackagesInStack = orders.reduce((sum, o) => sum + (o.packages?.length || 1), 0);
  const pendingPackages = orders.filter((o) => o.status === 'pendiente').reduce((sum, o) => sum + (o.packages?.length || 1), 0);
  const readyPackages = orders.filter((o) => o.status === 'listo').reduce((sum, o) => sum + (o.packages?.length || 1), 0);
  const packagedPackages = orders.filter((o) => o.status === 'empaquetado').reduce((sum, o) => sum + (o.packages?.length || 1), 0);
  const sentPackages = orders.filter((o) => o.status === 'enviado').reduce((sum, o) => sum + (o.packages?.length || 1), 0);

  const totalProductSpentInStack = orders.reduce((sum, o) => sum + (Number(o.price) || 0), 0);
  const totalShippingInStack = orders.reduce((sum, o) => sum + (Number(o.shippingCost) || 0), 0);

  return (
    /* LEVEL 1: CLIENT CARD CONTAINER (Distinctive High Contrast Styling) */
    <div className="rounded-3xl border-2 border-purple-200/90 bg-white shadow-2xs hover:shadow-xs transition-all duration-200 overflow-hidden">
      {/* Stack Header Bar (Clickable to fold/unfold) */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={`p-4 cursor-pointer select-none transition-colors ${
          isExpanded ? 'bg-purple-100/40 border-b border-purple-200' : 'hover:bg-purple-50/30'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Client Details (Given High Importance as requested) */}
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            {client?.photo ? (
              <img
                src={client.photo}
                alt={client.name}
                className="w-13 h-13 rounded-2xl object-cover border-2 border-purple-300 shadow-2xs shrink-0"
              />
            ) : (
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-purple-950 text-white font-black text-xl flex items-center justify-center shadow-2xs shrink-0 border border-zinc-800">
                {client ? client.name.charAt(0).toUpperCase() : '?'}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-900 text-white">
                  CLIENTE
                </span>
                <h3 className="font-black text-slate-950 text-base sm:text-lg leading-snug truncate">
                  {client ? `${client.name} ${client.surnames || ''}` : 'Cliente desconocido'}
                </h3>
                {client?.tags && client.tags.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200/70">
                    #{client.tags[0]}
                  </span>
                )}
              </div>

              {/* Client details: phone & address */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 mt-1">
                {client?.phone && (
                  <span className="flex items-center gap-1 font-semibold text-slate-800">
                    <Phone className="w-3.5 h-3.5 text-purple-600" />
                    <span>{client.phone}</span>
                  </span>
                )}
                {client?.address && (
                  <span className="flex items-center gap-1 text-slate-500 truncate max-w-[220px]">
                    <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span className="truncate">{client.address}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right side: Stack stats & Expand button */}
          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-purple-100">
            {/* Status pills inside stack (Showing orders and packages count) */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {pendingOrders.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200" title={`${pendingOrders.length} pedidos (${pendingPackages} paquetes) pendientes`}>
                  ⏳ {pendingOrders.length} ({pendingPackages} paq.)
                </span>
              )}
              {readyOrders.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-purple-100 text-purple-900 border border-purple-200" title={`${readyOrders.length} pedidos (${readyPackages} paquetes) listos`}>
                  📦 {readyOrders.length} ({readyPackages} paq.)
                </span>
              )}
              {packagedOrders.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-200" title={`${packagedOrders.length} pedidos (${packagedPackages} paquetes) empaquetados`}>
                  🎁 {packagedOrders.length} ({packagedPackages} paq.)
                </span>
              )}
              {sentOrders.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200" title={`${sentOrders.length} pedidos (${sentPackages} paquetes) enviados`}>
                  ✅ {sentOrders.length} ({sentPackages} paq.)
                </span>
              )}
              {stackHasGift && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs" title="Este cliente tiene al menos un pedido con regalo">
                  🎁 Regalo
                </span>
              )}
            </div>

            {/* Total Money in this stack */}
            <div className="text-right">
              <OrderPriceDisplay
                productPrice={totalProductSpentInStack}
                shippingCost={totalShippingInStack}
                size="md"
              />
              <span className="block text-[11px] text-purple-950 font-bold mt-0.5">
                {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'} · {totalPackagesInStack} {totalPackagesInStack === 1 ? 'paquete' : 'paquetes'}
              </span>
            </div>

            {/* Chevron toggle */}
            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 shadow-2xs">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-purple-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Stack Content: LEVEL 2 & 3 (PEDIDOS & PAQUETES) */}
      {isExpanded && (
        <div className="p-3.5 sm:p-5 bg-purple-50/40 space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs text-slate-600 px-1">
            <span className="font-extrabold flex items-center gap-1.5 text-purple-950 uppercase tracking-wide text-[11px]">
              <Layers className="w-4 h-4 text-purple-600" />
              Pedidos de este cliente ({orders.length} pedidos · {totalPackagesInStack} paquetes)
            </span>
            {client && onAddOrderForClient && (
              <button
                type="button"
                onClick={() => onAddOrderForClient(client.id)}
                className="inline-flex items-center gap-1 text-xs font-bold text-purple-800 hover:text-purple-950 bg-white hover:bg-purple-100 px-2.5 py-1 rounded-xl border border-purple-200 transition shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-purple-700" />
                <span>+ Añadir pedido</span>
              </button>
            )}
          </div>

          {/* Nested Order Cards (LEVEL 2) */}
          <div className="space-y-3.5">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                clients={allClients}
                onUpdate={onSaveOrder}
                onDelete={onDeleteOrder}
                onSelectClient={onSelectClient}
                onMovePackage={onMovePackage}
                initialExpanded={orders.length === 1}
                shippingRates={shippingRates}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
