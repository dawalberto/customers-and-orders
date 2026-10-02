import React, { useState } from 'react';
import { 
  Clock, 
  Package, 
  CheckCircle2, 
  MapPin, 
  User, 
  Calendar, 
  Send, 
  Edit3, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  X, 
  Copy,
  Lock,
  Unlock,
  AlertCircle
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

  // Status visual styles
  const getStatusConfig = (st: OrderStatus) => {
    switch (st) {
      case 'pendiente':
        return {
          label: '⏳ Pendiente',
          subLabel: 'Por hacer',
          badgeBg: 'bg-amber-100 text-amber-900 border-amber-200',
          cardBg: 'bg-gradient-to-br from-amber-50/40 via-white to-rose-50/20 border-amber-200/70',
          dot: 'bg-amber-500',
        };
      case 'listo':
        return {
          label: '📦 Listo',
          subLabel: 'Hecho (sin enviar)',
          badgeBg: 'bg-sky-100 text-sky-900 border-sky-200',
          cardBg: 'bg-gradient-to-br from-sky-50/40 via-white to-indigo-50/20 border-sky-200/70',
          dot: 'bg-sky-500',
        };
      case 'enviado':
        return {
          label: '✅ Enviado',
          subLabel: 'Entregado/en camino',
          badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-200',
          cardBg: 'bg-gradient-to-br from-emerald-50/40 via-white to-teal-50/20 border-emerald-200/70',
          dot: 'bg-emerald-500',
        };
    }
  };

  const statusConfig = getStatusConfig(order.status);

  // Status change helper for inline quick-change
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

  // Status change helper inside full Edit Mode
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

  // When changing client in edit form, auto-fill address if not custom
  const handleClientSelectInEdit = (newClientId: string) => {
    setClientId(newClientId);
    if (!isCustomAddress) {
      const selectedClient = clients.find((c) => c.id === newClientId);
      if (selectedClient && selectedClient.address) {
        setShippingAddress(selectedClient.address);
      }
    }
  };

  // Calculate day difference badges
  // 1) ⏳ -> 📦 (orderDate to readyDate)
  // 2) 📦 -> ✅ (readyDate to shippedDate)
  // 3) ⏳ -> ✅ (orderDate to shippedDate)
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
      <form onSubmit={handleSaveEdit} className="bg-white rounded-2xl border border-rose-300 shadow-md p-4 sm:p-5 transition">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-rose-100">
          <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Edit3 className="w-4 h-4 text-rose-500" />
            Editar Pedido
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              type="submit"
              disabled={!clientId || !price || !shippingType}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-xs transition disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              Guardar
            </button>
          </div>
        </div>

        <div className="space-y-3.5 text-sm">
          {/* Client Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cliente <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={clientId}
              onChange={(e) => handleClientSelectInEdit(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm bg-white"
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
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción del pedido</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Pendientes media luna con cuarzo rosa"
              className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm"
            />
          </div>

          {/* Price, ShippingType, OrderDate */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Precio (€) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="24.50"
                className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tipo de Envío <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={shippingType}
                onChange={(e) => setShippingType(e.target.value as ShippingType)}
                className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm bg-white"
              >
                <option value="" disabled>Elegir tipo</option>
                <option value="Ordinario">Ordinario</option>
                <option value="Certificado">Certificado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha del Pedido <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm"
              />
            </div>
          </div>

          {/* Shipping Address with lock/unlock */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">Dirección de envío</label>
              <button
                type="button"
                onClick={() => setIsCustomAddress(!isCustomAddress)}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1"
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
                  ? 'border-rose-300 focus:ring-2 focus:ring-rose-100 bg-white'
                  : 'border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed'
              }`}
            />
          </div>

          {/* Status selector & Dates */}
          <div className="p-3 bg-rose-50/50 rounded-2xl border border-rose-100 space-y-3">
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
                          ? `${cfg.badgeBg} shadow-xs`
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ready date & Shipped date (shown if status is listo/enviado or if date exists) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {(status === 'listo' || status === 'enviado' || readyDate) && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    📦 Fecha Listo
                  </label>
                  <input
                    type="date"
                    value={readyDate}
                    onChange={(e) => setReadyDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-xs bg-white"
                  />
                </div>
              )}

              {(status === 'enviado' || shippedDate) && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ✅ Fecha Envío
                  </label>
                  <input
                    type="date"
                    value={shippedDate}
                    onChange={(e) => setShippedDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-xs bg-white"
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
      </form>
    );
  }

  // Preview Mode & Detail Mode
  return (
    <div
      className={`rounded-2xl border transition-all duration-200 ${statusConfig.cardBg} ${
        isExpanded ? 'shadow-md ring-1 ring-rose-200/50' : 'shadow-2xs hover:shadow-xs'
      } overflow-hidden`}
    >
      {/* Compact Preview Card Header (always visible) */}
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
              className="w-14 h-14 rounded-xl object-cover border border-rose-200/80 shadow-2xs shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-white/80 border border-rose-200/60 flex items-center justify-center text-rose-400 shadow-2xs shrink-0">
              <Package className="w-6 h-6 stroke-[1.5]" />
            </div>
          )}

          {/* Main info row: Description, Client, Price, Tags */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-bold text-slate-800 text-sm leading-snug line-clamp-1">
                  {order.description || 'Pedido de pendientes/bisutería'}
                </h4>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-0.5">
                  <span className="font-medium text-rose-950 truncate">
                    {client ? `${client.name} ${client.surnames || ''}` : 'Cliente no especificado'}
                  </span>
                  {/* 1 or 2 client tags if present */}
                  {client?.tags && client.tags.length > 0 && (
                    <span className="hidden sm:inline-flex items-center text-[10px] px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-700">
                      #{client.tags[0]}
                    </span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="text-right shrink-0">
                <span className="font-extrabold text-slate-900 text-base">
                  {formatCurrency(order.price)}
                </span>
                <span className="block text-[10px] text-slate-500 font-medium">
                  {order.shippingType || 'Envío sin asignar'}
                </span>
              </div>
            </div>

            {/* Quick badges bar: Status, Order Date, Days badges */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 mt-2.5 pt-2 border-t border-rose-100/60 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Status pill button with dropdown or toggle */}
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusConfig.badgeBg}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                  {statusConfig.label}
                </span>

                {/* Days badges preview if ready/shipped */}
                {daysOrderToReady && (
                  <span
                    className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/90 text-slate-700 border border-slate-200/60 shadow-2xs"
                    title={`De creación a listo: ${daysOrderToReady.label}`}
                  >
                    ⏳ ➔ 📦 {daysOrderToReady.label}
                  </span>
                )}
                {daysReadyToShipped && (
                  <span
                    className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/90 text-slate-700 border border-slate-200/60 shadow-2xs"
                    title={`De listo a enviado: ${daysReadyToShipped.label}`}
                  >
                    📦 ➔ ✅ {daysReadyToShipped.label}
                  </span>
                )}
                {daysOrderToShipped && !daysReadyToShipped && (
                  <span
                    className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/90 text-slate-700 border border-slate-200/60 shadow-2xs"
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
        <div className="px-3.5 pb-4 pt-2 border-t border-rose-100/80 bg-white/80 backdrop-blur-xs space-y-3.5 text-xs text-slate-600 animate-in fade-in duration-150">
          {/* Quick status progress buttons */}
          <div className="bg-rose-50/60 p-2 rounded-xl border border-rose-100 flex items-center justify-between gap-1">
            <span className="text-[11px] font-semibold text-slate-600 pl-1">
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
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition active:scale-95 border ${
                      isCurrent
                        ? `${cfg.badgeBg} ring-1 ring-rose-400`
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full elapsed days badges row if status is listo or enviado */}
          {(daysOrderToReady || daysReadyToShipped || daysOrderToShipped) && (
            <div className="bg-white p-2.5 rounded-xl border border-rose-100/70 space-y-1">
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
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-900 border border-sky-200 font-medium">
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
          <div className="bg-rose-50/40 p-2.5 rounded-xl border border-rose-100 flex items-start gap-2">
            <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-900">
                  Dirección de envío {order.isCustomAddress && '(Personalizada)'}
                </span>
                <button
                  onClick={copyAddress}
                  className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition"
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-rose-100/60">
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

          {/* Large Photo Preview if present */}
          {order.photo && (
            <div className="rounded-xl overflow-hidden border border-rose-200/80 max-h-64 bg-black/5 flex items-center justify-center">
              <img
                src={order.photo}
                alt="Foto detallada del pedido"
                className="w-full h-full object-contain max-h-64"
              />
            </div>
          )}

          {/* Action buttons: Edit, Delete */}
          <div className="pt-2 border-t border-rose-100 flex items-center justify-between">
            {client && onSelectClient && (
              <button
                type="button"
                onClick={() => onSelectClient(client.id)}
                className="inline-flex items-center gap-1 text-xs text-rose-700 hover:underline font-medium"
              >
                <User className="w-3.5 h-3.5" />
                <span>Ver ficha de {client.name}</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 ml-auto">
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 transition active:scale-95"
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
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition active:scale-95"
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
