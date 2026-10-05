import React, { useState, useMemo, useEffect } from 'react';
import { Search, UserPlus, Users, X, Filter, User } from 'lucide-react';
import { Client, Order } from '../../types';
import { ClientCard } from './ClientCard';
import { ClientModal } from './ClientModal';
import { normalizeSearch } from '../../utils/dateUtils';

interface ClientsViewProps {
  clients: Client[];
  orders: Order[];
  onSaveClient: (client: Partial<Client> & { name: string }) => void | Promise<any>;
  onDeleteClient: (clientId: string) => void | Promise<any>;
  onNavigateToOrders: (clientId: string) => void;
  onCreateOrderForClient: (clientId: string) => void;
  focusedClientId?: string | null;
  onClearFocusedClient?: () => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  orders,
  onSaveClient,
  onDeleteClient,
  onNavigateToOrders,
  onCreateOrderForClient,
  focusedClientId,
  onClearFocusedClient,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeFocusedId, setActiveFocusedId] = useState<string | null>(focusedClientId || null);

  useEffect(() => {
    setActiveFocusedId(focusedClientId || null);
  }, [focusedClientId]);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    clients.forEach((c) => {
      c.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  }, [clients]);

  // Filter clients comfortably by name, surnames, address, tags, or focused client
  const filteredClients = useMemo(() => {
    if (activeFocusedId) {
      const match = clients.filter((c) => c.id === activeFocusedId);
      if (match.length > 0) return match;
    }

    const query = normalizeSearch(searchTerm);

    return clients.filter((c) => {
      if (selectedTag && !c.tags?.includes(selectedTag)) {
        return false;
      }

      if (!query) return true;

      const normName = normalizeSearch(c.name);
      const normSurnames = normalizeSearch(c.surnames);
      const normAddress = normalizeSearch(c.address);
      const normTags = c.tags ? c.tags.map(normalizeSearch).join(' ') : '';
      const normDni = normalizeSearch(c.dni);
      const normPhone = normalizeSearch(c.phone);

      return (
        normName.includes(query) ||
        normSurnames.includes(query) ||
        normAddress.includes(query) ||
        normTags.includes(query) ||
        normDni.includes(query) ||
        normPhone.includes(query)
      );
    });
  }, [clients, searchTerm, selectedTag, activeFocusedId]);

  const focusedClientObj = clients.find((c) => c.id === activeFocusedId);

  const handleClearFocus = () => {
    setActiveFocusedId(null);
    if (onClearFocusedClient) onClearFocusedClient();
  };

  return (
    <div className="space-y-4 overflow-x-hidden">
      {/* Top action & search header */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              if (activeFocusedId) handleClearFocus();
              setSearchTerm(e.target.value);
            }}
            placeholder="Buscar por nombre, dirección, etiqueta o teléfono..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white border border-slate-200/90 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm placeholder:text-slate-400 shadow-2xs transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm shadow-xs transition active:scale-95 shrink-0"
        >
          <UserPlus className="w-4 h-4 text-purple-300" />
          <span>Añadir Cliente</span>
        </button>
      </div>

      {/* REQUIREMENT: Dedicated Banner when filtered exclusively by client from order */}
      {activeFocusedId && focusedClientObj && (
        <div className="bg-purple-100/90 border border-purple-200 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs text-purple-950 animate-in fade-in duration-150 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-purple-200 text-purple-900 flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-purple-700 block tracking-wider">
                Ficha exclusiva de cliente:
              </span>
              <span className="font-extrabold text-slate-900 text-sm truncate block">
                {focusedClientObj.name} {focusedClientObj.surnames}
              </span>
            </div>
          </div>
          <button
            onClick={handleClearFocus}
            className="inline-flex items-center gap-1 font-bold text-xs bg-white text-purple-900 hover:bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl transition shadow-2xs active:scale-95 shrink-0"
            title="Ver todos los clientes"
          >
            <X className="w-3.5 h-3.5" />
            <span>Ver todos los clientes</span>
          </button>
        </div>
      )}

      {/* Tag filters pill bar if tags exist (when not in exclusive focus) */}
      {!activeFocusedId && allTags.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-slate-400 text-[11px] font-medium shrink-0 flex items-center gap-1 pl-1">
            <Filter className="w-3 h-3 text-purple-400" />
            <span>Etiquetas:</span>
          </span>
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition ${
              selectedTag === null
                ? 'bg-zinc-900 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-purple-50 border border-slate-200'
            }`}
          >
            Todas ({clients.length})
          </button>
          {allTags.map((tag) => {
            const isSelected = selectedTag === tag;
            const count = clients.filter((c) => c.tags?.includes(tag)).length;
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(isSelected ? null : tag)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition ${
                  isSelected
                    ? 'bg-zinc-900 text-white'
                    : 'bg-white text-slate-600 hover:bg-purple-50 border border-slate-200'
                }`}
              >
                #{tag} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Clients List or Empty State */}
      {clients.length === 0 ? (
        <div className="bg-white rounded-3xl border border-purple-100 p-8 sm:p-12 text-center max-w-md mx-auto my-6 shadow-2xs">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-200/80 text-purple-600 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No hay clientes todavía</h3>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Guarda a las personas que te compran bisutería y pendientes para tener su dirección y datos a mano sin rebuscar en chats.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm shadow-xs transition active:scale-95"
          >
            <UserPlus className="w-4 h-4 text-purple-300" />
            <span>Crear primer cliente</span>
          </button>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
          No se encontraron clientes con el filtro seleccionado.
          <div className="mt-3">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedTag(null);
                handleClearFocus();
              }}
              className="text-xs text-purple-700 font-semibold hover:underline"
            >
              Limpiar búsqueda
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              orders={orders}
              onUpdate={onSaveClient}
              onDelete={onDeleteClient}
              onNavigateToOrders={onNavigateToOrders}
              onCreateOrderForClient={onCreateOrderForClient}
            />
          ))}
        </div>
      )}

      {/* Client Modal */}
      <ClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={onSaveClient}
      />
    </div>
  );
};
