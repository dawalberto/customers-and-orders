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

  // When preselectedClientId or clients change, sync
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

    // Reset fields
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
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
        <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl border border-rose-100 overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-rose-100 flex items-center justify-between bg-rose-50/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <PackagePlus className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Nuevo Pedido</h2>
                <p className="text-xs text-slate-500">Cliente, precio, envío y fecha obligatorios</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4">
            {/* Client selector with button to create client on the fly */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Cliente <span className="text-rose-500">*</span>
                </label>
                {onQuickCreateClient && (
                  <button
                    type="button"
                    onClick={() => setIsQuickClientOpen(true)}
                    className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Crear cliente nuevo</span>
                  </button>
                )}
              </div>

              {clients.length === 0 ? (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-center">
                  <p className="text-xs text-rose-800 font-medium mb-2">
                    Aún no tienes ningún cliente registrado
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsQuickClientOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-rose-500 text-white text-xs font-semibold shadow-xs"
                  >
                    + Añadir primer cliente
                  </button>
                </div>
              ) : (
                <select
                  required
                  value={clientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm bg-white"
                >
                  <option value="" disabled>Selecciona un cliente</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.surnames} {c.address ? `— ${c.address.slice(0, 30)}...` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Descripción
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Pendientes media luna con cuarzo rosa"
                className="w-full px-3 py-2.5 rounded-xl border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm"
              />
            </div>

            {/* Price & Shipping Type & Date */}
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
                  className="w-full px-3 py-2.5 rounded-xl border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm"
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
                  className="w-full px-3 py-2.5 rounded-xl border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm bg-white"
                >
                  <option value="" disabled>Selecciona tipo</option>
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
                  className="w-full px-3 py-2.5 rounded-xl border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm"
                />
              </div>
            </div>

            {/* Shipping Address with lock / custom toggle */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Dirección de envío
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomAddress(!isCustomAddress)}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1"
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
                    ? 'border-rose-300 focus:ring-2 focus:ring-rose-100 bg-white'
                    : 'border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed'
                }`}
              />
            </div>

            {/* Initial Status selector (default ⏳ Pendiente) */}
            <div>
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
                          ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                          : 'bg-white text-slate-700 border-rose-200/80 hover:bg-rose-50'
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

            {/* Submit */}
            <div className="pt-3 border-t border-rose-100 flex items-center justify-end gap-2">
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
                className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold shadow-xs transition active:scale-95 disabled:opacity-50"
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
