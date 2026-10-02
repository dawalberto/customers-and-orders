import React, { useState } from 'react';
import { 
  Package, 
  MapPin, 
  User, 
  Calendar, 
  Edit3, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  X, 
  Copy,
  Lock,
  Unlock
} from 'lucide-react';
import { Order, Client, OrderStatus, ShippingType } from '../../types';
import { formatDateSpanish, formatShortDate, formatCurrency, calculateDaysBetween, getTodayDateString } from '../../utils/dateUtils';
import { ImageUploader } from '../common/ImageUploader';

interface OrderCardProps {
  order: Order;
  clients: Client[];
  onUpdate: (updatedOrder: Order) => void;
  onDelete: (orderId: string) => void;
  onSelectClient?: (clientId: string) => void;
  initialExpanded?: boolean;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  clients,
  onUpdate,
  onDelete,
  onSelectClient,
  initialExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [isEditing, setIsEditing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Edit form states
  const [description, setDescription] = useState(order.description || '');
  const [clientId, setClientId] = useState(order.clientId);
  const [price, setPrice] = useState(order.price ? String(order.price) : '');
  const [shippingAddress, setShippingAddress] = useState(order.shippingAddress);
  const [isCustomAddress, setIsCustomAddress] = useState(order.isCustomAddress || false);
  const [shippingType, setShippingType] = useState<ShippingType>(order.shippingType);
  const [orderDate, setOrderDate] = useState(order.orderDate || getTodayDateString());
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [readyDate, setReadyDate] = useState(order.readyDate || '');
  const [shippedDate, setShippedDate] = useState(order.shippedDate || '');
  const [photo, setPhoto] = useState<string | undefined>(order.photo);

  const client = clients.find((c) => c.id === order.clientId);

  // Status visual styles in monochrome/lilac harmony
  const getStatusConfig = (st: OrderStatus) => {
    switch (st) {
      case 'pendiente':
        return {
          label: '⏳ Pendiente',
          subLabel: 'Por hacer',
          badgeBg: 'bg-amber-50 text-amber-900 border-amber-200/80',
          cardBg: 'bg-white border-slate-200/90 hover:border-amber-300',
          dot: 'bg-amber-500',
        };
      case 'listo':
        return {
          label: '📦 Listo',
          subLabel: 'Hecho (sin enviar)',
          badgeBg: 'bg-purple-100 text-purple-900 border-purple-200/80',
          cardBg: 'bg-white border-slate-200/90 hover:border-purple-300',
          dot: 'bg-purple-600',
        };
      case 'enviado':
        return {
          label: '✅ Enviado',
          subLabel: 'Entregado/en camino',
          badgeBg: 'bg-emerald-50 text-emerald-900 border-emerald-200/80',
          cardBg: 'bg-white border-slate-200/90 hover:border-emerald-300',
          dot: 'bg-emerald-600',
        };
    }
  };

  const statusConfig = getStatusConfig(order.status);

  // Inline quick status change
  const handleQuickStatusChange = (newStatus: OrderStatus) => {
    const today = getTodayDateString();
    let updatedReadyDate = order.readyDate;
    let updatedShippedDate = order.shippedDate;

    if (newStatus === 'listo' && !updatedReadyDate) {
      updatedReadyDate = today;
    } else if (newStatus === 'enviado') {
      if (!updatedReadyDate) updatedReadyDate = today;
      if (!updatedShippedDate) updatedShippedDate = today;
    }

    onUpdate({
      ...order,
      status: newStatus,
      readyDate: updatedReadyDate,
      shippedDate: updatedShippedDate,
      updatedAt: new Date().toISOString(),
    });
  };

  // Status change inside Edit Mode
  const handleEditStatusChange = (newStatus: OrderStatus) => {
    setStatus(newStatus);
    const today = getTodayDateString();
    if (newStatus === 'listo' && !readyDate) {
      setReadyDate(today);
    } else if (newStatus === 'enviado') {
      if (!readyDate) setReadyDate(today);
      if (!shippedDate) setShippedDate(today);
    }
  };

  const handleClientSelectInEdit = (newClientId: string) => {
    setClientId(newClientId);
    if (!isCustomAddress) {
      const selectedClient = clients.find((c) => c.id === newClientId);
      if (selectedClient && selectedClient.address) {
        setShippingAddress(selectedClient.address);
      }
    }
  };

  // Badges of days elapsed
  const daysOrderToReady = (order.readyDate && order.orderDate)
    ? calculateDaysBetween(order.orderDate, order.readyDate)
    : null;

  const daysReadyToShipped = (order.readyDate && order.shippedDate)
    ? calculateDaysBetween(order.readyDate, order.shippedDate)
    : null;

  const daysOrderToShipped = (order.orderDate && order.shippedDate)
    ? calculateDaysBetween(order.orderDate, order.shippedDate)
    : null;

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice < 0) return;
    if (!shippingType) return;

    onUpdate({
      ...order,
      description: description.trim(),
      clientId,
      price: numericPrice,
      shippingAddress: shippingAddress.trim(),
      isCustomAddress,
      shippingType,
      orderDate,
      status,
      readyDate: readyDate || undefined,
      shippedDate: shippedDate || undefined,
      photo,
      updatedAt: new Date().toISOString(),
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setDescription(order.description || '');
    setClientId(order.clientId);
    setPrice(order.price ? String(order.price) : '');
    setShippingAddress(order.shippingAddress);
    setIsCustomAddress(order.isCustomAddress || false);
    setShippingType(order.shippingType);
    setOrderDate(order.orderDate || getTodayDateString());
    setStatus(order.status);
    setReadyDate(order.readyDate || '');
    setShippedDate(order.shippedDate || '');
    setPhoto(order.photo);
    setIsEditing(false);
  };

  const copyAddress = () => {
    if (!order.shippingAddress) return;
    navigator.clipboard.writeText(order.shippingAddress);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSaveEdit} className="bg-white rounded-3xl border border-purple-200 shadow-sm p-4 sm:p-5 transition overflow-x-hidden">
        {/* Header - Simple title without save buttons */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-purple-100">
          <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Edit3 className="w-4 h-4 text-purple-600" />
            Editar Pedido
          </span>
          <button
            type="button"
            onClick={handleCancelEdit}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            title="Cancelar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs">
          {/* Client Selector */}
          <div className="min-w-0">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cliente <span className="text-purple-600">*</span>
            </label>
            <select
              required
              value={clientId}
              onChange={(e) => handleClientSelectInEdit(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm bg-white"
            >
              <option value="" disabled>Selecciona un cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.surnames} {c.address ? `(${c.address.slice(0, 25)}...)` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="min-w-0">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción del pedido</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Pendientes media luna con cuarzo rosa"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm"
            />
          </div>

          {/* Price, ShippingType (includes En mano), OrderDate */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Precio (€) <span className="text-purple-600">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="24.50"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm"
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tipo de Envío <span className="text-purple-600">*</span>
              </label>
              <select
                required
                value={shippingType}
                onChange={(e) => setShippingType(e.target.value as ShippingType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm bg-white"
              >
                <option value="" disabled>Elegir tipo</option>
                <option value="Ordinario">Ordinario</option>
                <option value="Certificado">Certificado</option>
                <option value="En mano">En mano</option>
              </select>
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha del Pedido <span className="text-purple-600">*</span>
              </label>
              <input
                type="date"
                required
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm"
              />
            </div>
          </div>

          {/* Shipping Address with lock/unlock */}
          <div className="min-w-0">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">Dirección de entrega</label>
              <button
                type="button"
                onClick={() => setIsCustomAddress(!isCustomAddress)}
                className="text-xs text-purple-700 hover:text-purple-900 font-semibold inline-flex items-center gap-1"
              >
                {isCustomAddress ? (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Dirección personalizada</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Modificar dirección de este pedido</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={2}
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              disabled={!isCustomAddress}
              placeholder="Dirección de entrega"
              className={`w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none transition ${
                isCustomAddress
                  ? 'border-purple-300 focus:ring-2 focus:ring-purple-100 bg-white'
                  : 'border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed'
              }`}
            />
          </div>

          {/* Status selector & Dates */}
          <div className="p-3 bg-purple-50/40 rounded-2xl border border-purple-100 space-y-3 min-w-0">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Estado del Pedido</label>
              <div className="grid grid-cols-3 gap-2">
                {(['pendiente', 'listo', 'enviado'] as OrderStatus[]).map((st) => {
                  const cfg = getStatusConfig(st);
                  const isSel = status === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleEditStatusChange(st)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-semibold transition border ${
                        isSel
                          ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-purple-50'
                      }`}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ready date & Shipped date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {(status === 'listo' || status === 'enviado' || readyDate) && (
                <div className="min-w-0">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    📦 Fecha Listo
                  </label>
                  <input
                    type="date"
                    value={readyDate}
                    onChange={(e) => setReadyDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-xs bg-white"
                  />
                </div>
              )}

              {(status === 'enviado' || shippedDate) && (
                <div className="min-w-0">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ✅ Fecha Envío
                  </label>
                  <input
                    type="date"
                    value={shippedDate}
                    onChange={(e) => setShippedDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-xs bg-white"
                  />
                </div>
              )}
            </div>
          </div>

          <ImageUploader
            value={photo}
            onChange={setPhoto}
            label="Foto del pedido / pendientes (opcional)"
          />
        </div>

        {/* Footer: Cancel & Save Buttons strictly in the footer */}
        <div className="mt-4 pt-3 border-t border-purple-100 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCancelEdit}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!clientId || !price || !shippingType}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white shadow-2xs transition active:scale-95 disabled:opacity-50"
          >
            <Check className="w-4 h-4 text-purple-300" />
            <span>Guardar Cambios</span>
          </button>
        </div>
      </form>
    );
  }

  // Preview Mode & Detail Mode
  return (
    <div
      className={`rounded-3xl border transition-all duration-200 ${statusConfig.cardBg} ${
        isExpanded ? 'shadow-sm ring-1 ring-purple-200/80' : 'shadow-2xs hover:shadow-xs'
      } overflow-hidden`}
    >
      {/* Compact Preview Card Header */}
      <div
        className="p-3.5 sm:p-4 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-3">
          {/* Order thumbnail or fallback icon */}
          {order.photo ? (
            <img
              src={order.photo}
              alt="Joyas"
              className="w-14 h-14 rounded-2xl object-cover border border-purple-200/80 shadow-2xs shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-purple-50/60 border border-purple-200/60 flex items-center justify-center text-purple-600 shadow-2xs shrink-0">
              <Package className="w-6 h-6 stroke-[1.5]" />
            </div>
          )}

          {/* Main info row: Description, Client, Price, Tags */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1">
                  {order.description || 'Pedido de pendientes/bisutería'}
                </h4>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-0.5">
                  <span className="font-medium text-slate-800 truncate">
                    {client ? `${client.name} ${client.surnames || ''}` : 'Cliente no especificado'}
                  </span>
                  {client?.tags && client.tags.length > 0 && (
                    <span className="hidden sm:inline-flex items-center text-[10px] px-1.5 py-0.2 rounded-md bg-purple-50 text-purple-700 border border-purple-200/50">
                      #{client.tags[0]}
                    </span>
                  )}
                </div>
              </div>

              {/* Price & Shipping */}
              <div className="text-right shrink-0">
                <span className="font-extrabold text-slate-950 text-base">
                  {formatCurrency(order.price)}
                </span>
                <span className="block text-[10px] text-slate-500 font-medium">
                  {order.shippingType || 'Envío sin asignar'}
                </span>
              </div>
            </div>

            {/* Quick badges bar */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 mt-2.5 pt-2 border-t border-slate-100 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusConfig.badgeBg}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                  {statusConfig.label}
                </span>

                {daysOrderToReady && (
                  <span
                    className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200/60 shadow-2xs"
                    title={`De creación a listo: ${daysOrderToReady.label}`}
                  >
                    ⏳ ➔ 📦 {daysOrderToReady.label}
                  </span>
                )}
                {daysReadyToShipped && (
                  <span
                    className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200/60 shadow-2xs"
                    title={`De listo a enviado: ${daysReadyToShipped.label}`}
                  >
                    📦 ➔ ✅ {daysReadyToShipped.label}
                  </span>
                )}
                {daysOrderToShipped && !daysReadyToShipped && (
                  <span
                    className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200/60 shadow-2xs"
                    title={`Total de pedido a enviado: ${daysOrderToShipped.label}`}
                  >
                    ⏳ ➔ ✅ {daysOrderToShipped.label}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                <span>{formatShortDate(order.orderDate)}</span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Detail Mode */}
      {isExpanded && (
        <div className="px-3.5 pb-4 pt-2 border-t border-purple-100 bg-purple-50/20 space-y-3.5 text-xs text-slate-600 animate-in fade-in duration-150">
          {/* Quick status progress buttons */}
          <div className="bg-white p-2.5 rounded-2xl border border-purple-100/90 flex flex-wrap items-center justify-between gap-1.5 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-700 pl-1">
              Cambiar estado:
            </span>
            <div className="flex items-center gap-1">
              {(['pendiente', 'listo', 'enviado'] as OrderStatus[]).map((st) => {
                const isCurrent = order.status === st;
                const cfg = getStatusConfig(st);
                return (
                  <button
                    key={st}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickStatusChange(st);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition active:scale-95 border ${
                      isCurrent
                        ? `${cfg.badgeBg} ring-1 ring-purple-400 font-bold`
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full elapsed days badges */}
          {(daysOrderToReady || daysReadyToShipped || daysOrderToShipped) && (
            <div className="bg-white p-2.5 rounded-2xl border border-purple-100/70 space-y-1">
              <span className="block text-[11px] font-semibold text-slate-700 mb-1">
                ⏱️ Tiempo entre cambios de estado:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {daysOrderToReady && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-medium">
                    ⏳ ➔ 📦 <strong>{daysOrderToReady.label}</strong>
                  </span>
                )}
                {daysReadyToShipped && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-900 border border-purple-200 font-medium">
                    📦 ➔ ✅ <strong>{daysReadyToShipped.label}</strong>
                  </span>
                )}
                {daysOrderToShipped && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 font-medium">
                    ⏳ ➔ ✅ <strong>{daysOrderToShipped.label}</strong> (total)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Shipping Address */}
          <div className="bg-white p-2.5 rounded-2xl border border-purple-100 flex items-start gap-2 shadow-2xs">
            <MapPin className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-900">
                  Dirección de entrega {order.isCustomAddress && '(Personalizada)'}
                </span>
                <button
                  onClick={copyAddress}
                  className="text-slate-400 hover:text-purple-700 p-0.5 rounded transition"
                  title="Copiar dirección"
                >
                  {copySuccess ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <p className="text-slate-800 font-medium mt-0.5 whitespace-pre-line leading-relaxed">
                {order.shippingAddress || (client?.address ? client.address : 'Sin dirección especificada')}
              </p>
            </div>
          </div>

          {/* Dates Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-500 bg-white p-2.5 rounded-2xl border border-purple-100/60 shadow-2xs">
            <div>
              <span className="block font-semibold text-slate-700">Fecha Pedido:</span>
              <span>{formatDateSpanish(order.orderDate)}</span>
            </div>
            <div>
              <span className="block font-semibold text-slate-700">Fecha Listo:</span>
              <span>{order.readyDate ? formatDateSpanish(order.readyDate) : 'Aún no listo'}</span>
            </div>
            <div>
              <span className="block font-semibold text-slate-700">Fecha Envío:</span>
              <span>{order.shippedDate ? formatDateSpanish(order.shippedDate) : 'Aún no enviado'}</span>
            </div>
          </div>

          {/* Photo Preview if present */}
          {order.photo && (
            <div className="rounded-2xl overflow-hidden border border-purple-200/80 max-h-64 bg-slate-900/5 flex items-center justify-center">
              <img
                src={order.photo}
                alt="Foto detallada del pedido"
                className="w-full h-full object-contain max-h-64"
              />
            </div>
          )}

          {/* Action buttons: Edit, Delete */}
          <div className="pt-2 border-t border-purple-100 flex items-center justify-between">
            {client && onSelectClient && (
              <button
                type="button"
                onClick={() => onSelectClient(client.id)}
                className="inline-flex items-center gap-1 text-xs text-purple-700 hover:underline font-semibold"
              >
                <User className="w-3.5 h-3.5" />
                <span>Ver ficha de {client.name}</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 ml-auto">
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 hover:text-purple-700 bg-white border border-slate-200 hover:bg-purple-50 transition active:scale-95"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
              <button
                onClick={() => {
                  if (window.confirm('¿Seguro que deseas eliminar este pedido?')) {
                    onDelete(order.id);
                  }
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
