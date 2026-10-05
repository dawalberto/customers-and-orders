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
  Unlock,
  Plus,
  Send,
  Sparkles,
  ArrowRightLeft
} from 'lucide-react';
import { Order, Client, OrderStatus, ShippingType, OrderPackage } from '../../types';
import { formatDateSpanish, formatShortDate, formatCurrency, calculateDaysBetween, getTodayDateString } from '../../utils/dateUtils';
import { ImageUploader } from '../common/ImageUploader';
import { OrderPriceDisplay } from '../common/OrderPriceDisplay';

interface OrderCardProps {
  order: Order;
  clients: Client[];
  onUpdate: (updatedOrder: Order) => void;
  onDelete: (orderId: string) => void;
  onSelectClient?: (clientId: string) => void;
  onMovePackage?: (pkg: OrderPackage, order: Order) => void;
  initialExpanded?: boolean;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  clients,
  onUpdate,
  onDelete,
  onSelectClient,
  onMovePackage,
  initialExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [isEditing, setIsEditing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isStatusTransitioning, setIsStatusTransitioning] = useState(false);

  // Edit form states
  const [clientId, setClientId] = useState(order.clientId);
  const [shippingAddress, setShippingAddress] = useState(order.shippingAddress);
  const [isCustomAddress, setIsCustomAddress] = useState(order.isCustomAddress || false);
  const [shippingType, setShippingType] = useState<ShippingType>(order.shippingType);
  const [shippingCost, setShippingCost] = useState<number>(order.shippingCost ?? 0);
  const [orderDate, setOrderDate] = useState(order.orderDate || getTodayDateString());
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [readyDate, setReadyDate] = useState(order.readyDate || '');
  const [packagedDate, setPackagedDate] = useState(order.packagedDate || '');
  const [shippedDate, setShippedDate] = useState(order.shippedDate || '');
  const [photo, setPhoto] = useState<string | undefined>(order.photo);

  // Packages list in edit mode
  const [editPackages, setEditPackages] = useState<Array<{
    id: string;
    description: string;
    price: string;
    shippingType: ShippingType;
    status: OrderStatus;
    photo?: string;
  }>>(
    (order.packages && order.packages.length > 0)
      ? order.packages.map((p) => ({
          id: p.id,
          description: p.description,
          price: String(p.price),
          shippingType: p.shippingType || order.shippingType,
          status: p.status || order.status,
          photo: p.photo,
        }))
      : [
          {
            id: `${order.id}_pkg_1`,
            description: order.description || '',
            price: String(order.price || 0),
            shippingType: order.shippingType,
            status: order.status,
            photo: order.photo,
          },
        ]
  );

  const client = clients.find((c) => c.id === order.clientId);

  // Status visual styles for the 4 states: pendiente, listo, empaquetado, enviado
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
          subLabel: 'Hecho (sin empaquetar)',
          badgeBg: 'bg-purple-100 text-purple-900 border-purple-200/80',
          cardBg: 'bg-white border-slate-200/90 hover:border-purple-300',
          dot: 'bg-purple-600',
        };
      case 'empaquetado':
        return {
          label: '🎁 Empaquetado',
          subLabel: 'Preparado para enviar',
          badgeBg: 'bg-indigo-50 text-indigo-900 border-indigo-200/80',
          cardBg: 'bg-white border-slate-200/90 hover:border-indigo-300',
          dot: 'bg-indigo-600',
        };
      case 'enviado':
        return {
          label: '✅ Enviado',
          subLabel: 'Entregado o en camino',
          badgeBg: 'bg-emerald-50 text-emerald-900 border-emerald-200/80',
          cardBg: 'bg-white border-slate-200/90 hover:border-emerald-300',
          dot: 'bg-emerald-600',
        };
    }
  };

  const statusConfig = getStatusConfig(order.status);

  // Inline quick status change WITH SMOOTH TRANSITION
  const handleQuickStatusChange = (newStatus: OrderStatus) => {
    if (newStatus === order.status) return;

    // Trigger graceful visual transition
    setIsStatusTransitioning(true);

    const today = getTodayDateString();
    let updatedReadyDate = order.readyDate;
    let updatedPackagedDate = order.packagedDate;
    let updatedShippedDate = order.shippedDate;

    if (newStatus === 'listo') {
      if (!updatedReadyDate) updatedReadyDate = today;
    } else if (newStatus === 'empaquetado') {
      if (!updatedReadyDate) updatedReadyDate = today;
      if (!updatedPackagedDate) updatedPackagedDate = today;
    } else if (newStatus === 'enviado') {
      if (!updatedReadyDate) updatedReadyDate = today;
      if (!updatedPackagedDate) updatedPackagedDate = today;
      if (!updatedShippedDate) updatedShippedDate = today;
    }

    // REQUIREMENT: Update packages' status to match order's status
    const updatedPackages = (order.packages || []).map((pkg) => ({
      ...pkg,
      status: newStatus,
    }));

    setTimeout(() => {
      onUpdate({
        ...order,
        status: newStatus,
        readyDate: updatedReadyDate,
        packagedDate: updatedPackagedDate,
        shippedDate: updatedShippedDate,
        packages: updatedPackages,
        updatedAt: new Date().toISOString(),
      });
      setIsStatusTransitioning(false);
    }, 220);
  };

  // Modify status of a single package independently
  const handleSinglePackageStatusChange = (pkgId: string, newPkgStatus: OrderStatus) => {
    const updatedPackages = (order.packages || []).map((pkg) =>
      pkg.id === pkgId ? { ...pkg, status: newPkgStatus } : pkg
    );
    onUpdate({
      ...order,
      packages: updatedPackages,
      updatedAt: new Date().toISOString(),
    });
  };

  // Status change inside Edit Mode
  const handleEditStatusChange = (newStatus: OrderStatus) => {
    setStatus(newStatus);
    const today = getTodayDateString();
    if (newStatus === 'listo' && !readyDate) {
      setReadyDate(today);
    } else if (newStatus === 'empaquetado') {
      if (!readyDate) setReadyDate(today);
      if (!packagedDate) setPackagedDate(today);
    } else if (newStatus === 'enviado') {
      if (!readyDate) setReadyDate(today);
      if (!packagedDate) setPackagedDate(today);
      if (!shippedDate) setShippedDate(today);
    }

    // Also update all package edit statuses
    setEditPackages((prev) =>
      prev.map((pkg) => ({
        ...pkg,
        status: newStatus,
      }))
    );
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

  // Badges of days elapsed between 4 statuses
  const daysOrderToReady = (order.readyDate && order.orderDate)
    ? calculateDaysBetween(order.orderDate, order.readyDate)
    : null;

  const daysReadyToPackaged = (order.readyDate && order.packagedDate)
    ? calculateDaysBetween(order.readyDate, order.packagedDate)
    : null;

  const daysPackagedToShipped = (order.packagedDate && order.shippedDate)
    ? calculateDaysBetween(order.packagedDate, order.shippedDate)
    : null;

  const daysOrderToShipped = (order.orderDate && order.shippedDate)
    ? calculateDaysBetween(order.orderDate, order.shippedDate)
    : null;

  // Edit Mode: Package handlers
  const handleAddEditPackage = () => {
    setEditPackages((prev) => [
      ...prev,
      {
        id: `pkg_${Date.now()}_${prev.length + 1}`,
        description: '',
        price: '',
        shippingType: shippingType,
        status: status,
      },
    ]);
  };

  const handleRemoveEditPackage = (idx: number) => {
    if (editPackages.length <= 1) return;
    setEditPackages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateEditPackage = (idx: number, field: string, val: any) => {
    setEditPackages((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  // Live sum in Edit Mode
  const liveTotalProductsPrice = editPackages.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0);
  const liveTotalWithShipping = liveTotalProductsPrice + (Number(shippingCost) || 0);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    if (!shippingType) return;
    if (editPackages.length === 0) return;

    const parsedPackages: OrderPackage[] = editPackages.map((pkg, idx) => ({
      id: pkg.id || `pkg_${Date.now()}_${idx + 1}`,
      description: pkg.description.trim() || `Paquete ${idx + 1}`,
      price: parseFloat(pkg.price) || 0,
      shippingType: pkg.shippingType || shippingType,
      status: pkg.status || status,
      photo: pkg.photo,
    }));

    onUpdate({
      ...order,
      clientId,
      price: liveTotalProductsPrice,
      shippingCost: Number(shippingCost) || 0,
      shippingAddress: shippingAddress.trim(),
      isCustomAddress,
      shippingType,
      orderDate,
      status,
      readyDate: readyDate || undefined,
      packagedDate: packagedDate || undefined,
      shippedDate: shippedDate || undefined,
      packages: parsedPackages,
      photo,
      updatedAt: new Date().toISOString(),
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setClientId(order.clientId);
    setShippingAddress(order.shippingAddress);
    setIsCustomAddress(order.isCustomAddress || false);
    setShippingType(order.shippingType);
    setShippingCost(order.shippingCost ?? 0);
    setOrderDate(order.orderDate || getTodayDateString());
    setStatus(order.status);
    setReadyDate(order.readyDate || '');
    setPackagedDate(order.packagedDate || '');
    setShippedDate(order.shippedDate || '');
    setPhoto(order.photo);
    setEditPackages(
      (order.packages || []).map((p) => ({
        id: p.id,
        description: p.description,
        price: String(p.price),
        shippingType: p.shippingType || order.shippingType,
        status: p.status || order.status,
        photo: p.photo,
      }))
    );
    setIsEditing(false);
  };

  const copyAddress = () => {
    if (!order.shippingAddress) return;
    navigator.clipboard.writeText(order.shippingAddress);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const totalPackagesCount = order.packages?.length || 1;

  if (isEditing) {
    return (
      <form onSubmit={handleSaveEdit} className="bg-white rounded-3xl border border-purple-200 shadow-sm p-4 sm:p-5 transition overflow-x-hidden">
        {/* Header - Simple title without save buttons */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-purple-100">
          <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Edit3 className="w-4 h-4 text-purple-600" />
            Editar Pedido y Paquetes
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

        <div className="space-y-4 text-xs">
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

          {/* Shipping Type, Cost and Order Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <option value="En mano">🤝 En mano</option>
                <option value="Ordinario">✉️ Ordinario</option>
                <option value="Certificado">📦 Certificado</option>
              </select>
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Coste Envío (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={shippingCost}
                onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 outline-none text-sm bg-white font-bold"
              />
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

          {/* Shipping Address */}
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

          {/* Status selector (4 states) */}
          <div className="p-3 bg-purple-50/40 rounded-2xl border border-purple-100 space-y-3 min-w-0">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Estado del Pedido</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {(['pendiente', 'listo', 'empaquetado', 'enviado'] as OrderStatus[]).map((st) => {
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

            {/* Dates: readyDate, packagedDate, shippedDate */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {(status === 'listo' || status === 'empaquetado' || status === 'enviado' || readyDate) && (
                <div className="min-w-0">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    📦 Fecha Listo
                  </label>
                  <input
                    type="date"
                    value={readyDate}
                    onChange={(e) => setReadyDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 focus:border-purple-500 outline-none text-xs bg-white"
                  />
                </div>
              )}

              {(status === 'empaquetado' || status === 'enviado' || packagedDate) && (
                <div className="min-w-0">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    🎁 Fecha Empaquetado
                  </label>
                  <input
                    type="date"
                    value={packagedDate}
                    onChange={(e) => setPackagedDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 focus:border-purple-500 outline-none text-xs bg-white"
                  />
                </div>
              )}

              {(status === 'enviado' || shippedDate) && (
                <div className="min-w-0">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    ✅ Fecha Envío
                  </label>
                  <input
                    type="date"
                    value={shippedDate}
                    onChange={(e) => setShippedDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 focus:border-purple-500 outline-none text-xs bg-white"
                  />
                </div>
              )}
            </div>
          </div>

          {/* EDIT PACKAGES SECTION */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Paquetes / Artículos ({editPackages.length})
              </span>
              <button
                type="button"
                onClick={handleAddEditPackage}
                className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-xl transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir paquete</span>
              </button>
            </div>

            <div className="space-y-3">
              {editPackages.map((pkg, idx) => (
                <div key={pkg.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">
                      Paquete #{idx + 1}
                    </span>
                    {editPackages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEditPackage(idx)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                      Descripción (Texto completo):
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={pkg.description}
                      onChange={(e) => handleUpdateEditPackage(idx, 'description', e.target.value)}
                      placeholder="Descripción detallada de las joyas/artículo..."
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 focus:border-purple-500 outline-none text-xs bg-white resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Precio (€):</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={pkg.price}
                        onChange={(e) => handleUpdateEditPackage(idx, 'price', e.target.value)}
                        className="w-full px-2.5 py-1 rounded-xl border border-slate-200 outline-none text-xs bg-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Envío:</label>
                      <select
                        value={pkg.shippingType}
                        onChange={(e) => handleUpdateEditPackage(idx, 'shippingType', e.target.value as ShippingType)}
                        className="w-full px-2 py-1 rounded-xl border border-slate-200 outline-none text-xs bg-white"
                      >
                        <option value="En mano">En mano</option>
                        <option value="Ordinario">Ordinario</option>
                        <option value="Certificado">Certificado</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Estado:</label>
                      <select
                        value={pkg.status}
                        onChange={(e) => handleUpdateEditPackage(idx, 'status', e.target.value as OrderStatus)}
                        className="w-full px-2 py-1 rounded-xl border border-slate-200 outline-none text-xs bg-white"
                      >
                        <option value="pendiente">⏳ Pendiente</option>
                        <option value="listo">📦 Listo</option>
                        <option value="empaquetado">🎁 Empaquetado</option>
                        <option value="enviado">✅ Enviado</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Live totals */}
            <div className="p-3 rounded-2xl bg-zinc-950 text-white space-y-1">
              <div className="flex justify-between text-xs text-zinc-300">
                <span>Suma artículos ({editPackages.length} paq.):</span>
                <span className="font-bold text-white">{formatCurrency(liveTotalProductsPrice)}</span>
              </div>
              <div className="flex justify-between text-xs text-zinc-300">
                <span>Coste envío:</span>
                <span className="font-bold text-purple-300">{formatCurrency(shippingCost)}</span>
              </div>
              <div className="pt-1 border-t border-zinc-800 flex justify-between text-xs font-bold text-white">
                <span>Total Pedido:</span>
                <span className="text-sm font-black text-purple-300">{formatCurrency(liveTotalWithShipping)}</span>
              </div>
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
            disabled={!clientId || !shippingType || editPackages.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white shadow-2xs transition active:scale-95 disabled:opacity-50"
          >
            <Check className="w-4 h-4 text-purple-300" />
            <span>Guardar Cambios</span>
          </button>
        </div>
      </form>
    );
  }

  // Preview Mode & Detail Mode (WITH SMOOTH STATUS TRANSITIONS)
  return (
    <div
      className={`rounded-3xl border transition-all duration-300 ease-out ${statusConfig.cardBg} ${
        isStatusTransitioning ? 'opacity-40 scale-[0.98]' : 'opacity-100 scale-100'
      } ${
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

          {/* Main info row: Client, Packages summary, Price Breakdown */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug">
                    {client ? `${client.name} ${client.surnames || ''}` : 'Cliente no especificado'}
                  </span>
                  <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200/60">
                    {totalPackagesCount} {totalPackagesCount === 1 ? 'paquete' : 'paquetes'}
                  </span>
                </div>

                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                  <span className="font-semibold text-slate-700">{order.shippingType || 'Envío sin asignar'}</span>
                  <span>·</span>
                  <span>{formatShortDate(order.orderDate)}</span>
                </div>
              </div>

              {/* REQUIREMENT: Show 23€ + 5,95€(icono avión) = 28,95€ */}
              <div className="self-start sm:self-auto sm:text-right shrink-0 pt-1 sm:pt-0">
                <OrderPriceDisplay
                  productPrice={order.price}
                  shippingCost={order.shippingCost}
                  size="md"
                />
              </div>
            </div>

            {/* Quick status badges bar */}
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
                    ⏳➔📦 {daysOrderToReady.label}
                  </span>
                )}
                {daysReadyToPackaged && (
                  <span
                    className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200/60 shadow-2xs"
                    title={`De listo a empaquetado: ${daysReadyToPackaged.label}`}
                  >
                    📦➔🎁 {daysReadyToPackaged.label}
                  </span>
                )}
                {daysPackagedToShipped && (
                  <span
                    className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200/60 shadow-2xs"
                    title={`De empaquetado a enviado: ${daysPackagedToShipped.label}`}
                  >
                    🎁➔✅ {daysPackagedToShipped.label}
                  </span>
                )}
                {daysOrderToShipped && !daysReadyToPackaged && !daysPackagedToShipped && (
                  <span
                    className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200/60 shadow-2xs"
                    title={`Total de pedido a enviado: ${daysOrderToShipped.label}`}
                  >
                    ⏳➔✅ {daysOrderToShipped.label}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                <span>{isExpanded ? 'Ocultar detalles' : 'Ver paquetes'}</span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-purple-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Detail Mode: SHOWS NESTED PACKAGES (PAQUETES) WITH FULL DESCRIPTIONS */}
      {isExpanded && (
        <div className="px-3.5 pb-4 pt-3 border-t border-purple-100 bg-purple-50/20 space-y-3.5 text-xs text-slate-600 animate-in fade-in duration-150">
          {/* Quick status progress buttons: 4 States */}
          <div className="bg-white p-2.5 rounded-2xl border border-purple-100/90 flex flex-wrap items-center justify-between gap-1.5 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-700 pl-1">
              Cambiar estado del pedido:
            </span>
            <div className="flex flex-wrap items-center gap-1">
              {(['pendiente', 'listo', 'empaquetado', 'enviado'] as OrderStatus[]).map((st) => {
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

          {/* HIERARCHICAL LEVEL 3: PAQUETES DE ESTE PEDIDO */}
          <div className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-950 block">
              📦 Artículos / Paquetes incluidos ({totalPackagesCount}):
            </span>

            <div className="space-y-2">
              {order.packages && order.packages.length > 0 ? (
                order.packages.map((pkg, idx) => {
                  const pkgConfig = getStatusConfig(pkg.status || order.status);
                  return (
                    <div
                      key={pkg.id || idx}
                      className="bg-white p-3 rounded-2xl border border-purple-200/90 shadow-2xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-md bg-purple-100 text-purple-900 text-[10px] flex items-center justify-center font-black">
                            #{idx + 1}
                          </span>
                          Paquete {idx + 1}
                        </span>

                        <div className="flex items-center gap-2 flex-wrap">
                          {/* PACKAGE STATUS SELECTOR: Allows changing each package status directly! */}
                          <select
                            value={pkg.status || order.status}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleSinglePackageStatusChange(pkg.id, e.target.value as OrderStatus);
                            }}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer outline-none transition ${pkgConfig.badgeBg}`}
                            title="Cambiar estado de este paquete individualmente"
                          >
                            <option value="pendiente">⏳ Pendiente</option>
                            <option value="listo">📦 Listo</option>
                            <option value="empaquetado">🎁 Empaquetado</option>
                            <option value="enviado">✅ Enviado</option>
                          </select>

                          {/* REQUIREMENT: "mover a otro pedido" button */}
                          {onMovePackage && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onMovePackage(pkg, order);
                              }}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 hover:text-purple-950 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 px-2 py-0.5 rounded-lg transition active:scale-95 shadow-2xs"
                              title="Mover este paquete a otro pedido"
                            >
                              <ArrowRightLeft className="w-3 h-3 text-purple-600" />
                              <span>Mover a otro pedido</span>
                            </button>
                          )}

                          <span className="font-black text-slate-950 text-xs sm:text-sm pl-1">
                            {formatCurrency(pkg.price)}
                          </span>
                        </div>
                      </div>

                      {/* REQUIREMENT: "Es de vital importancia que las descripciones de los paquetes siempre se vean enteras... nunca cortar el contenido y poner ..." */}
                      <p className="text-xs text-slate-800 font-medium whitespace-pre-wrap break-words leading-relaxed pl-6.5">
                        {pkg.description || 'Sin descripción'}
                      </p>

                      {pkg.shippingType && pkg.shippingType !== order.shippingType && (
                        <div className="pl-6.5 text-[10px] text-purple-700 font-semibold">
                          Envío específico: {pkg.shippingType}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="bg-white p-3 rounded-2xl border border-purple-100 text-slate-600">
                  <p className="text-xs whitespace-pre-wrap break-words">{order.description || 'Artículo'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Full elapsed days badges */}
          {(daysOrderToReady || daysReadyToPackaged || daysPackagedToShipped || daysOrderToShipped) && (
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
                {daysReadyToPackaged && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-900 border border-purple-200 font-medium">
                    📦 ➔ 🎁 <strong>{daysReadyToPackaged.label}</strong>
                  </span>
                )}
                {daysPackagedToShipped && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-900 border border-indigo-200 font-medium">
                    🎁 ➔ ✅ <strong>{daysPackagedToShipped.label}</strong>
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-500 bg-white p-2.5 rounded-2xl border border-purple-100/60 shadow-2xs">
            <div>
              <span className="block font-semibold text-slate-700">Fecha Pedido:</span>
              <span>{formatDateSpanish(order.orderDate)}</span>
            </div>
            <div>
              <span className="block font-semibold text-slate-700">Fecha Listo:</span>
              <span>{order.readyDate ? formatDateSpanish(order.readyDate) : '-'}</span>
            </div>
            <div>
              <span className="block font-semibold text-slate-700">Fecha Empaquetado:</span>
              <span>{order.packagedDate ? formatDateSpanish(order.packagedDate) : '-'}</span>
            </div>
            <div>
              <span className="block font-semibold text-slate-700">Fecha Envío:</span>
              <span>{order.shippedDate ? formatDateSpanish(order.shippedDate) : '-'}</span>
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
                  if (window.confirm('¿Seguro que deseas eliminar este pedido y sus paquetes?')) {
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
