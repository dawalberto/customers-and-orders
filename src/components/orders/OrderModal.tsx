import React, { useState, useEffect } from 'react';
import { X, PackagePlus, Lock, Unlock, UserPlus, Plus, Trash2, Send } from 'lucide-react';
import { Order, Client, OrderStatus, ShippingType, OrderPackage, ShippingRateConfig } from '../../types';
import { getTodayDateString, formatCurrency } from '../../utils/dateUtils';
import { ImageUploader } from '../common/ImageUploader';
import { ClientModal } from '../clients/ClientModal';
import { getShippingRates } from '../../services/storage';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (orderData: Partial<Order> & { clientId: string; shippingType: ShippingType; orderDate: string; packages: OrderPackage[] }) => void | Promise<void>;
  clients: Client[];
  onQuickCreateClient?: (clientData: Partial<Client> & { name: string }) => Promise<Client> | Client;
  preselectedClientId?: string;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  clients,
  onQuickCreateClient,
  preselectedClientId,
}) => {
  const [clientId, setClientId] = useState(preselectedClientId || '');
  const [shippingAddress, setShippingAddress] = useState('');
  const [isCustomAddress, setIsCustomAddress] = useState(false);
  const [shippingType, setShippingType] = useState<ShippingType>('Ordinario');
  const [shippingCost, setShippingCost] = useState<number>(2.50);
  const [orderDate, setOrderDate] = useState(getTodayDateString());
  const [status, setStatus] = useState<OrderStatus>('pendiente');
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [isQuickClientOpen, setIsQuickClientOpen] = useState(false);
  const [rates, setRates] = useState<ShippingRateConfig | null>(null);

  // Packages list: order starts with 1 package
  const [packages, setPackages] = useState<Array<{
    id: string;
    description: string;
    price: string;
    shippingType: ShippingType;
    status: OrderStatus;
    photo?: string;
  }>>([
    {
      id: `pkg_${Date.now()}_1`,
      description: '',
      price: '',
      shippingType: 'Ordinario',
      status: 'pendiente',
    },
  ]);

  useEffect(() => {
    getShippingRates().then((r) => {
      setRates(r);
      if (shippingType && typeof (r as any)[shippingType] === 'number') {
        setShippingCost((r as any)[shippingType]);
      }
    });
  }, [shippingType]);

  useEffect(() => {
    if (preselectedClientId) {
      setClientId(preselectedClientId);
      const c = clients.find((item) => item.id === preselectedClientId);
      if (c && c.address) {
        setShippingAddress(c.address);
      }
    } else {
      // REQUIREMENT: DO NOT auto-select a client! Leave empty so user chooses deliberately.
      setClientId('');
      setShippingAddress('');
    }
  }, [preselectedClientId, isOpen]);

  if (!isOpen) return null;

  const handleClientChange = (newId: string) => {
    setClientId(newId);
    if (!isCustomAddress) {
      const selected = clients.find((c) => c.id === newId);
      if (selected && selected.address) {
        setShippingAddress(selected.address);
      } else {
        setShippingAddress('');
      }
    }
  };

  const handleShippingTypeChange = (newType: ShippingType) => {
    setShippingType(newType);
    if (rates && newType && typeof (rates as any)[newType] === 'number') {
      setShippingCost((rates as any)[newType]);
    }
    // Also update packages shippingType if they matched the previous default
    setPackages((prev) =>
      prev.map((pkg) => ({
        ...pkg,
        shippingType: pkg.shippingType === shippingType ? newType : pkg.shippingType,
      }))
    );
  };

  const handleStatusChange = (newStatus: OrderStatus) => {
    setStatus(newStatus);
    // REQUIREMENT: "Si el pedido cambia de estado también se deben cambiar los estados de los paquetes al mismo estado"
    setPackages((prev) =>
      prev.map((pkg) => ({
        ...pkg,
        status: newStatus,
      }))
    );
  };

  // Add a new package
  const handleAddPackage = () => {
    setPackages((prev) => [
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

  // Remove package
  const handleRemovePackage = (index: number) => {
    if (packages.length <= 1) return;
    setPackages((prev) => prev.filter((_, i) => i !== index));
  };

  // Update specific package field
  const handleUpdatePackage = (index: number, field: string, value: any) => {
    setPackages((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleQuickClientSaved = async (clientData: Partial<Client> & { name: string }) => {
    if (onQuickCreateClient) {
      const created = await onQuickCreateClient(clientData);
      setClientId(created.id);
      if (created.address) {
        setShippingAddress(created.address);
      }
    }
    setIsQuickClientOpen(false);
  };

  // Calculate live sum of packages
  const totalProductsPrice = packages.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0);
  const totalOrderWithShipping = totalProductsPrice + (Number(shippingCost) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    if (!shippingType) return;
    if (packages.length === 0) return;

    // Validate that at least one package has a valid price
    const parsedPackages: OrderPackage[] = packages.map((pkg, idx) => ({
      id: pkg.id || `pkg_${Date.now()}_${idx + 1}`,
      description: pkg.description.trim() || `Paquete ${idx + 1}`,
      price: parseFloat(pkg.price) || 0,
      shippingType: pkg.shippingType || shippingType,
      status: pkg.status || status,
      photo: pkg.photo,
    }));

    const today = getTodayDateString();
    let readyDate: string | undefined = undefined;
    let packagedDate: string | undefined = undefined;
    let shippedDate: string | undefined = undefined;

    if (status === 'listo') {
      readyDate = today;
    } else if (status === 'empaquetado') {
      readyDate = today;
      packagedDate = today;
    } else if (status === 'enviado') {
      readyDate = today;
      packagedDate = today;
      shippedDate = today;
    }

    onSave({
      clientId,
      price: totalProductsPrice,
      shippingCost,
      shippingAddress: shippingAddress.trim(),
      isCustomAddress,
      shippingType,
      orderDate,
      status,
      readyDate,
      packagedDate,
      shippedDate,
      packages: parsedPackages,
      photo,
    });

    // Reset
    setClientId('');
    setShippingType('Ordinario');
    setOrderDate(getTodayDateString());
    setStatus('pendiente');
    setPhoto(undefined);
    setIsCustomAddress(false);
    setPackages([
      {
        id: `pkg_${Date.now()}_1`,
        description: '',
        price: '',
        shippingType: 'Ordinario',
        status: 'pendiente',
      },
    ]);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150 overflow-x-hidden">
        <div className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl border border-purple-100 overflow-hidden">
          {/* Header - Simple title and close X */}
          <div className="px-5 py-4 border-b border-purple-100/80 flex items-center justify-between bg-purple-50/40 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <PackagePlus className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900 truncate">Nuevo Pedido</h2>
                <p className="text-[11px] text-slate-500">Selecciona el cliente y añade sus paquetes</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="overflow-y-auto overflow-x-hidden p-4 sm:p-5 space-y-4 flex-1">
            {/* 1. Client Selector (NO default selection, user chooses consciously) */}
            <div className="min-w-0">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Cliente <span className="text-purple-600">* (Obligatorio)</span>
                </label>
                {onQuickCreateClient && (
                  <button
                    type="button"
                    onClick={() => setIsQuickClientOpen(true)}
                    className="inline-flex items-center gap-1 text-xs text-purple-700 hover:text-purple-900 font-semibold"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Crear cliente nuevo</span>
                  </button>
                )}
              </div>

              <select
                required
                value={clientId}
                onChange={(e) => handleClientChange(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none bg-white transition ${
                  !clientId
                    ? 'border-purple-300 ring-2 ring-purple-100 text-slate-500'
                    : 'border-slate-200 focus:border-purple-500 text-slate-900'
                }`}
              >
                <option value="" disabled>-- Selecciona un cliente --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.surnames} {c.address ? `— ${c.address.slice(0, 30)}...` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Order Date & Main Shipping Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo de Envío del Pedido <span className="text-purple-600">*</span>
                </label>
                <select
                  required
                  value={shippingType}
                  onChange={(e) => handleShippingTypeChange(e.target.value as ShippingType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm bg-white"
                >
                  <option value="En mano">🤝 En mano ({formatCurrency(rates?.['En mano'] ?? 0)})</option>
                  <option value="Ordinario">✉️ Ordinario ({formatCurrency(rates?.['Ordinario'] ?? 2.5)})</option>
                  <option value="Certificado">📦 Certificado ({formatCurrency(rates?.['Certificado'] ?? 5.95)})</option>
                </select>
              </div>
            </div>

            {/* 3. Shipping Address with lock / custom toggle */}
            <div className="min-w-0">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Dirección de entrega
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomAddress(!isCustomAddress)}
                  className="text-xs text-purple-700 hover:text-purple-900 font-semibold inline-flex items-center gap-1"
                >
                  {isCustomAddress ? (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Personalizada</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Modificar para este pedido</span>
                    </>
                  )}
                </button>
              </div>
              <textarea
                rows={2}
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                disabled={!isCustomAddress}
                placeholder="Se autorellena con la dirección del cliente"
                className={`w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none transition ${
                  isCustomAddress
                    ? 'border-purple-300 focus:ring-2 focus:ring-purple-100 bg-white'
                    : 'border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed'
                }`}
              />
            </div>

            {/* 4. Initial Status selector: 4 States */}
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Estado inicial del pedido
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {(['pendiente', 'listo', 'empaquetado', 'enviado'] as OrderStatus[]).map((st) => {
                  const isSel = status === st;
                  const labels = {
                    pendiente: '⏳ Pendiente',
                    listo: '📦 Listo',
                    empaquetado: '🎁 Empaquetado',
                    enviado: '✅ Enviado',
                  };
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(st)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-semibold transition border ${
                        isSel
                          ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-purple-50'
                      }`}
                    >
                      {labels[st]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. MULTI-PACKAGE SECTION (FEAT/REFACTOR) */}
            <div className="pt-2 border-t border-purple-100">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Paquetes del Pedido ({packages.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">Añade los artículos o paquetes que componen esta venta</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddPackage}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-xs shadow-2xs transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Añadir paquete</span>
                </button>
              </div>

              <div className="space-y-3">
                {packages.map((pkg, idx) => (
                  <div
                    key={pkg.id}
                    className="p-3.5 rounded-2xl bg-purple-50/40 border border-purple-200/80 shadow-2xs space-y-2.5 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-purple-950 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-purple-200 text-purple-900 text-[11px] flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        Paquete #{idx + 1}
                      </span>
                      {packages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePackage(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                          title="Eliminar este paquete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Package Description (NEVER truncated, full text) */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Descripción del paquete <span className="text-purple-600">*</span>
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={pkg.description}
                        onChange={(e) => handleUpdatePackage(idx, 'description', e.target.value)}
                        placeholder="Ej: Pendientes media luna en plata de ley con cuarzo rosa..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-xs bg-white resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {/* Price */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Precio (€) <span className="text-purple-600">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={pkg.price}
                          onChange={(e) => handleUpdatePackage(idx, 'price', e.target.value)}
                          placeholder="24.50"
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 focus:border-purple-500 outline-none text-xs bg-white font-bold"
                        />
                      </div>

                      {/* Package Shipping Type */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Envío (Paquete)
                        </label>
                        <select
                          value={pkg.shippingType || shippingType}
                          onChange={(e) => handleUpdatePackage(idx, 'shippingType', e.target.value as ShippingType)}
                          className="w-full px-2 py-1.5 rounded-xl border border-slate-200 focus:border-purple-500 outline-none text-xs bg-white"
                        >
                          <option value="En mano">🤝 En mano</option>
                          <option value="Ordinario">✉️ Ordinario</option>
                          <option value="Certificado">📦 Certificado</option>
                        </select>
                      </div>

                      {/* Package Status */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Estado (Paquete)
                        </label>
                        <select
                          value={pkg.status || status}
                          onChange={(e) => handleUpdatePackage(idx, 'status', e.target.value as OrderStatus)}
                          className="w-full px-2 py-1.5 rounded-xl border border-slate-200 focus:border-purple-500 outline-none text-xs bg-white"
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
            </div>

            {/* 6. Live Totals Breakdown */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 text-white shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-xs text-zinc-300">
                <span>Suma de artículos ({packages.length} {packages.length === 1 ? 'paquete' : 'paquetes'}):</span>
                <span className="font-bold text-white">{formatCurrency(totalProductsPrice)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-300">
                <span className="flex items-center gap-1">
                  <span>Coste de envío ({shippingType || 'Sin asignar'}):</span>
                  <Send className="w-3 h-3 text-purple-400 -rotate-12" />
                </span>
                <span className="font-bold text-purple-300">{formatCurrency(shippingCost)}</span>
              </div>
              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-sm font-extrabold text-white">
                <span>Total Pedido:</span>
                <span className="text-base text-purple-300 font-black">
                  {formatCurrency(totalOrderWithShipping)}
                </span>
              </div>
            </div>

            {/* Photo upload for the order */}
            <ImageUploader
              value={photo}
              onChange={setPhoto}
              label="Foto general del pedido (opcional)"
            />

            {/* Submit & Cancel STRICTLY in footer */}
            <div className="pt-3 border-t border-purple-100 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!clientId || !shippingType || packages.length === 0}
                className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold shadow-xs transition active:scale-95 disabled:opacity-50"
              >
                Crear Pedido ({packages.length} {packages.length === 1 ? 'paquete' : 'paquetes'})
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Quick Client Modal if needed */}
      <ClientModal
        isOpen={isQuickClientOpen}
        onClose={() => setIsQuickClientOpen(false)}
        onSave={handleQuickClientSaved}
      />
    </>
  );
};
