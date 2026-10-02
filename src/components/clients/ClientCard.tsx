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
  ExternalLink,
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

  // Start of current week (Monday)
  const dayOfWeek = (now.getDay() + 6) % 7; // 0 is Monday
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
      // ignore date parse issues
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

  // Clean WhatsApp number format
  const cleanPhone = client.phone ? client.phone.replace(/\D/g, '') : '';
  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('34') || cleanPhone.length > 9 ? cleanPhone : '34' + cleanPhone}` : null;

  if (isEditing) {
    return (
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-rose-200 shadow-sm p-4 sm:p-5 transition">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-rose-100">
          <span className="text-sm font-bold text-rose-900 flex items-center gap-1.5">
            <Edit3 className="w-4 h-4 text-rose-500" />
            Editar Cliente
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleCancel}
              className="p-1.5 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
              title="Cancelar"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-xs transition disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              Guardar
            </button>
          </div>
        </div>

        <div className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nombre <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del cliente"
                className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Apellidos</label>
              <input
                type="text"
                value={surnames}
                onChange={(e) => setSurnames(e.target.value)}
                placeholder="Apellidos"
                className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Teléfono</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej. 612 34 56 78"
                className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">DNI / NIF</label>
              <input
                type="text"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                placeholder="12345678X"
                className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Dirección de entrega</label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Calle, número, piso, CP, Ciudad, Provincia"
              className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Fecha de cliente</label>
              <input
                type="date"
                value={clientDate}
                onChange={(e) => setClientDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Etiquetas (tags)</label>
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
                  placeholder="Ej: Instagram, VIP, Feria"
                  className="flex-1 px-3 py-2 rounded-xl border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-medium transition"
                >
                  +
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-rose-100/70 text-rose-800"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-rose-950 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Notas / Observaciones</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Preferencias de bisutería, cierres especiales, etc."
              className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition resize-none"
            />
          </div>

          <div>
            <ImageUploader
              value={photo}
              onChange={setPhoto}
              label="Foto del cliente / perfil (opcional)"
            />
          </div>
        </div>
      </form>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-rose-100/80 shadow-xs hover:shadow-md transition-all duration-200 p-4 sm:p-5 flex flex-col justify-between">
      <div>
        {/* Header: Photo/Avatar + Name + Actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {client.photo ? (
              <img
                src={client.photo}
                alt={client.name}
                className="w-13 h-13 rounded-2xl object-cover border border-rose-200 shadow-2xs shrink-0"
              />
            ) : (
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-200 border border-rose-200/60 flex items-center justify-center text-rose-700 font-bold text-lg shadow-2xs shrink-0">
                {client.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-bold text-slate-800 text-base leading-tight truncate">
                {client.name} {client.surnames}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-rose-400 shrink-0" />
                <span>Desde {formatDateSpanish(client.clientDate)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
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
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/50"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Details list: Address, Phone, DNI */}
        <div className="mt-3.5 space-y-2 text-xs text-slate-600">
          {client.address ? (
            <div className="flex items-start gap-2 bg-rose-50/40 p-2.5 rounded-xl border border-rose-100/50">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-700 whitespace-pre-line leading-relaxed">
                  {client.address}
                </p>
              </div>
              <button
                onClick={copyAddress}
                className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-100/50 transition shrink-0"
                title="Copiar dirección al portapapeles"
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
              <div className="flex items-center gap-1.5 text-slate-700">
                <Phone className="w-3.5 h-3.5 text-rose-500" />
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
              <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <p className="italic">{client.note}</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Metrics & Actions */}
      <div className="mt-4 pt-3 border-t border-rose-100/70 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Orders count button: navigates to orders filtered by client */}
          <button
            onClick={() => onNavigateToOrders(client.id)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-800 transition active:scale-95"
            title="Ver los pedidos de este cliente"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-rose-600" />
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
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition active:scale-95"
              title="Pulsar para ver desglose de gasto"
            >
              <Euro className="w-3.5 h-3.5 text-emerald-600" />
              <span>{formatCurrency(spentTotal)}</span>
            </button>

            {/* Popover / Tooltip with 3 lines: Esta semana, Este mes, Total */}
            {showTooltip && (
              <div
                className="absolute bottom-full left-0 mb-2 z-30 w-52 p-3 bg-slate-900 text-white rounded-xl shadow-xl text-xs space-y-1.5 animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="font-semibold text-rose-300 pb-1 border-b border-slate-700">
                  Gasto de {client.name}
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Esta semana:</span>
                  <span className="font-semibold text-white">{formatCurrency(spentWeek)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Este mes:</span>
                  <span className="font-semibold text-white">{formatCurrency(spentMonth)}</span>
                </div>
                <div className="flex justify-between text-slate-200 pt-1 border-t border-slate-800">
                  <span className="font-bold">Total:</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(spentTotal)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {onCreateOrderForClient && (
          <button
            onClick={() => onCreateOrderForClient(client.id)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-rose-700 hover:bg-rose-50 transition"
            title="Nuevo pedido para este cliente"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nuevo pedido</span>
          </button>
        )}
      </div>
    </div>
  );
};
