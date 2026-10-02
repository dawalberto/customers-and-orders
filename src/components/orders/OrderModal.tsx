import React, { useState, useEffect } from 'react';
import { X, PackagePlus, Lock, Unlock, UserPlus } from 'lucide-react';
import { Order, Client, OrderStatus, ShippingType } from '../../types';
import { getTodayDateString } from '../../utils/dateUtils';
import { ImageUploader } from '../common/ImageUploader';
import { ClientModal } from '../clients/ClientModal';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (orderData: Partial<Order> & { clientId: string; price: number; shippingType: ShippingType; orderDate: string }) => void;
  clients: Client[];
  onQuickCreateClient?: (clientData: Partial<Client> & { name: string }) => Client;
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
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState(preselectedClientId || '');
  const [price, setPrice] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [isCustomAddress, setIsCustomAddress] = useState(false);
  const [shippingType, setShippingType] = useState<ShippingType>('');
  const [orderDate, setOrderDate] = useState(getTodayDateString());
  const [status, setStatus] = useState<OrderStatus>('pendiente');
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [isQuickClientOpen, setIsQuickClientOpen] = useState(false);

  useEffect(() => {
    if (preselectedClientId) {
      setClientId(preselectedClientId);
      const c = clients.find((item) => item.id === preselectedClientId);
      if (c && c.address) {
        setShippingAddress(c.address);
      }
    } else if (!clientId && clients.length > 0) {
      setClientId(clients[0].id);
      if (clients[0].address) {
        setShippingAddress(clients[0].address);
      }
    }
  }, [preselectedClientId, clients]);

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

  const handleQuickClientSaved = (clientData: Partial<Client> & { name: string }) => {
    if (onQuickCreateClient) {
      const created = onQuickCreateClient(clientData);
      setClientId(created.id);
      if (created.address) {
        setShippingAddress(created.address);
      }
    }
    setIsQuickClientOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) return;
    if (!shippingType) return;

    const today = getTodayDateString();
    let readyDate: string | undefined = undefined;
    let shippedDate: string | undefined = undefined;

    if (status === 'listo') {
      readyDate = today;
    } else if (status === 'enviado') {
      readyDate = today;
      shippedDate = today;
    }

    onSave({
      description: description.trim(),
      clientId,
      price: numPrice,
      shippingAddress: shippingAddress.trim(),
      isCustomAddress,
      shippingType,
      orderDate,
      status,
      readyDate,
      shippedDate,
      photo,
    });

    // Reset
    setDescription('');
    setPrice('');
    setShippingType('');
    setOrderDate(getTodayDateString());
    setStatus('pendiente');
    setPhoto(undefined);
    setIsCustomAddress(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150 overflow-x-hidden">
        <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl border border-purple-100 overflow-hidden">
          {/* Header - Simple title and close X */}
          <div className="px-5 py-4 border-b border-purple-100/80 flex items-center justify-between bg-purple-50/40 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <PackagePlus className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900 truncate">Nuevo Pedido</h2>
                <p className="text-[11px] text-slate-500">Cliente, precio, envío y fecha obligatorios</p>
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
          <form onSubmit={handleSubmit} className="overflow-y-auto overflow-x-hidden p-4 sm:p-5 space-y-3.5 flex-1">
            {/* Client selector with button to create client on the fly */}
            <div className="min-w-0">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Cliente <span className="text-purple-600">*</span>
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

              {clients.length === 0 ? (
                <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-200/80 text-center">
                  <p className="text-xs text-purple-900 font-medium mb-2">
                    Aún no tienes ningún cliente registrado
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsQuickClientOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold shadow-2xs"
                  >
                    + Añadir primer cliente
                  </button>
                </div>
              ) : (
                <select
                  required
                  value={clientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm bg-white"
                >
                  <option value="" disabled>Selecciona un cliente</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.surnames} {c.address ? `— ${c.address.slice(0, 25)}...` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Description */}
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Descripción
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Pendientes media luna con cuarzo..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm"
              />
            </div>

            {/* Price & Shipping Type & Date */}
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
                  <option value="" disabled>Selecciona tipo</option>
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

            {/* Shipping Address with lock / custom toggle */}
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

            {/* Initial Status selector */}
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Estado inicial
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['pendiente', 'listo', 'enviado'] as OrderStatus[]).map((st) => {
                  const isSel = status === st;
                  const labels = {
                    pendiente: '⏳ Pendiente',
                    listo: '📦 Listo',
                    enviado: '✅ Enviado',
                  };
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatus(st)}
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

            {/* Photo upload */}
            <ImageUploader
              value={photo}
              onChange={setPhoto}
              label="Foto del pedido / pendientes (opcional)"
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
                disabled={!clientId || !price || !shippingType}
                className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold shadow-xs transition active:scale-95 disabled:opacity-50"
              >
                Crear Pedido
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
