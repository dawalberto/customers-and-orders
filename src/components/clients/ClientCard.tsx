import React, { useState } from 'react';
import { 
  User, 
  MapPin, 
  Phone, 
  CreditCard, 
  Tag, 
  FileText, 
  Calendar, 
  ShoppingBag, 
  Euro, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  MessageCircle, 
  Copy, 
  Plus 
} from 'lucide-react';
import { Client, Order } from '../../types';
import { formatDateSpanish, formatCurrency, getTodayDateString } from '../../utils/dateUtils';
import { ImageUploader } from '../common/ImageUploader';

interface ClientCardProps {
  client: Client;
  orders: Order[];
  onUpdate: (updatedClient: Client) => void;
  onDelete: (clientId: string) => void;
  onNavigateToOrders: (clientId: string) => void;
  onCreateOrderForClient?: (clientId: string) => void;
  initialEditMode?: boolean;
}

export const ClientCard: React.FC<ClientCardProps> = ({
  client,
  orders,
  onUpdate,
  onDelete,
  onNavigateToOrders,
  onCreateOrderForClient,
  initialEditMode = false,
}) => {
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [showTooltip, setShowTooltip] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Form edit states
  const [name, setName] = useState(client.name);
  const [surnames, setSurnames] = useState(client.surnames || '');
  const [address, setAddress] = useState(client.address || '');
  const [phone, setPhone] = useState(client.phone || '');
  const [dni, setDni] = useState(client.dni || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(client.tags || []);
  const [note, setNote] = useState(client.note || '');
  const [clientDate, setClientDate] = useState(client.clientDate || getTodayDateString());
  const [photo, setPhoto] = useState<string | undefined>(client.photo);

  // Client orders
  const clientOrders = orders.filter((o) => o.clientId === client.id);
  const totalOrdersCount = clientOrders.length;

  // Calculate financials: this week, this month, total
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const dayOfWeek = (now.getDay() + 6) % 7;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  let spentWeek = 0;
  let spentMonth = 0;
  let spentTotal = 0;

  clientOrders.forEach((o) => {
    const val = Number(o.price) || 0;
    spentTotal += val;

    try {
      const orderDate = new Date(o.orderDate);
      if (orderDate >= startOfWeek) {
        spentWeek += val;
      }
      if (orderDate.getFullYear() === currentYear && orderDate.getMonth() === currentMonth) {
        spentMonth += val;
      }
    } catch {
      // ignore
    }
  });

  const handleAddTag = () => {
    const cleaned = tagInput.trim();
    if (cleaned && !tags.includes(cleaned)) {
      setTags([...tags, cleaned]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onUpdate({
      ...client,
      name: name.trim(),
      surnames: surnames.trim(),
      address: address.trim(),
      phone: phone.trim(),
      dni: dni.trim(),
      tags,
      note: note.trim(),
      clientDate,
      photo,
      updatedAt: new Date().toISOString(),
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setName(client.name);
    setSurnames(client.surnames || '');
    setAddress(client.address || '');
    setPhone(client.phone || '');
    setDni(client.dni || '');
    setTags(client.tags || []);
    setNote(client.note || '');
    setClientDate(client.clientDate || getTodayDateString());
    setPhoto(client.photo);
    setIsEditing(false);
  };

  const copyAddress = () => {
    if (!client.address) return;
    navigator.clipboard.writeText(client.address);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const cleanPhone = client.phone ? client.phone.replace(/\D/g, '') : '';
  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('34') || cleanPhone.length > 9 ? cleanPhone : '34' + cleanPhone}` : null;

  if (isEditing) {
    return (
      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-purple-200 shadow-sm p-4 sm:p-5 transition overflow-x-hidden">
        {/* Header - Simple title without save buttons */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-purple-100">
          <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Edit3 className="w-4 h-4 text-purple-600" />
            Editar Cliente
          </span>
          <button
            type="button"
            onClick={handleCancel}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            title="Cerrar edición"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre <span className="text-purple-600">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del cliente"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm transition"
              />
            </div>
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Apellidos</label>
              <input
                type="text"
                value={surnames}
                onChange={(e) => setSurnames(e.target.value)}
                placeholder="Apellidos"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej. 612 34 56 78"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm transition"
              />
            </div>
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1">DNI / NIF</label>
              <input
                type="text"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                placeholder="12345678X"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm transition"
              />
            </div>
          </div>

          <div className="min-w-0">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Dirección de entrega</label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Calle, número, piso, CP, Ciudad, Provincia"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm transition resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha de cliente</label>
              <input
                type="date"
                value={clientDate}
                onChange={(e) => setClientDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm transition"
              />
            </div>
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Etiquetas (tags)</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Instagram, VIP..."
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm transition"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-semibold transition shrink-0"
                >
                  +
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-purple-50 text-purple-800 border border-purple-200/50"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-purple-950 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notas / Observaciones</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Preferencias de bisutería, cierres especiales..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm transition resize-none"
            />
          </div>

          <ImageUploader
            value={photo}
            onChange={setPhoto}
            label="Foto del cliente / perfil (opcional)"
          />
        </div>

        {/* Footer: Cancelar y Guardar buttons STRICTLY in footer */}
        <div className="mt-4 pt-3 border-t border-purple-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white shadow-2xs transition active:scale-95 disabled:opacity-50"
          >
            <Check className="w-4 h-4 text-purple-300" />
            <span>Guardar Cambios</span>
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-purple-100/90 shadow-2xs hover:shadow-xs transition-all duration-200 p-4 sm:p-5 flex flex-col justify-between overflow-x-hidden">
      <div>
        {/* Header: Photo/Avatar + Name + Actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {client.photo ? (
              <img
                src={client.photo}
                alt={client.name}
                className="w-13 h-13 rounded-2xl object-cover border border-purple-200 shadow-2xs shrink-0"
              />
            ) : (
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-purple-100 via-purple-50 to-violet-100 border border-purple-200/80 flex items-center justify-center text-purple-800 font-bold text-lg shadow-2xs shrink-0">
                {client.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-base leading-tight truncate">
                {client.name} {client.surnames}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-purple-500 shrink-0" />
                <span>Desde {formatDateSpanish(client.clientDate)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-slate-400 hover:text-purple-700 rounded-lg hover:bg-purple-50 transition"
              title="Editar cliente"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (window.confirm(`¿Seguro que deseas eliminar al cliente "${client.name}"? Los pedidos se mantendrán.`)) {
                  onDelete(client.id);
                }
              }}
              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
              title="Eliminar cliente"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tags */}
        {client.tags && client.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {client.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200/60"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Details list: Address, Phone, DNI */}
        <div className="mt-3.5 space-y-2 text-xs text-slate-600">
          {client.address ? (
            <div className="flex items-start gap-2 bg-purple-50/30 p-2.5 rounded-2xl border border-purple-100/60">
              <MapPin className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 whitespace-pre-line leading-relaxed">
                  {client.address}
                </p>
              </div>
              <button
                onClick={copyAddress}
                className="text-slate-400 hover:text-purple-700 p-1 rounded-md hover:bg-purple-100 transition shrink-0"
                title="Copiar dirección"
              >
                {copySuccess ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          ) : (
            <p className="text-slate-400 italic text-[11px]">Sin dirección guardada</p>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1">
            {client.phone && (
              <div className="flex items-center gap-1.5 text-slate-800">
                <Phone className="w-3.5 h-3.5 text-purple-600" />
                <a href={`tel:${client.phone}`} className="hover:underline font-medium">
                  {client.phone}
                </a>
                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-emerald-600 hover:text-emerald-700 ml-1 p-0.5 rounded-md hover:bg-emerald-50"
                    title="Abrir chat de WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}

            {client.dni && (
              <div className="flex items-center gap-1.5 text-slate-600">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span>DNI: {client.dni}</span>
              </div>
            )}
          </div>

          {client.note && (
            <div className="flex items-start gap-1.5 text-slate-500 text-[11px] pt-1">
              <FileText className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
              <p className="italic">{client.note}</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Metrics & Actions */}
      <div className="mt-4 pt-3 border-t border-purple-100/70 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Orders count button */}
          <button
            onClick={() => onNavigateToOrders(client.id)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-900 transition active:scale-95"
            title="Ver los pedidos de este cliente"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-purple-600" />
            <span>
              {totalOrdersCount} {totalOrdersCount === 1 ? 'pedido' : 'pedidos'}
            </span>
          </button>

          {/* Money spent badge with 3-line tooltip */}
          <div className="relative">
            <button
              onClick={() => setShowTooltip(!showTooltip)}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-900 transition active:scale-95"
              title="Pulsar para ver desglose de gasto"
            >
              <Euro className="w-3.5 h-3.5 text-purple-600" />
              <span>{formatCurrency(spentTotal)}</span>
            </button>

            {/* Popover / Tooltip with 3 lines: Esta semana, Este mes, Total */}
            {showTooltip && (
              <div
                className="absolute bottom-full left-0 mb-2 z-30 w-52 p-3 bg-zinc-950 text-white rounded-2xl shadow-xl text-xs space-y-1.5 animate-in fade-in zoom-in-95 duration-150 border border-zinc-800"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="font-semibold text-purple-300 pb-1 border-b border-zinc-800">
                  Gasto de {client.name}
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Esta semana:</span>
                  <span className="font-semibold text-white">{formatCurrency(spentWeek)}</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Este mes:</span>
                  <span className="font-semibold text-white">{formatCurrency(spentMonth)}</span>
                </div>
                <div className="flex justify-between text-zinc-200 pt-1 border-t border-zinc-800">
                  <span className="font-bold">Total:</span>
                  <span className="font-bold text-purple-400">{formatCurrency(spentTotal)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {onCreateOrderForClient && (
          <button
            onClick={() => onCreateOrderForClient(client.id)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200/70 transition active:scale-95 shadow-2xs"
            title="Añadir pedido para este cliente"
          >
            <Plus className="w-3.5 h-3.5 text-purple-700" />
            <ShoppingBag className="w-3.5 h-3.5 text-purple-700" />
            <span className="font-bold">Pedido</span>
          </button>
        )}
      </div>
    </div>
  );
};
