import React, { useState, useMemo } from 'react';
import { 
  X, 
  ArrowRightLeft, 
  Search, 
  Package, 
  User, 
  Check, 
  AlertCircle,
  Boxes
} from 'lucide-react';
import { Order, OrderPackage, Client } from '../../types';
import { formatCurrency, formatShortDate, normalizeSearch } from '../../utils/dateUtils';

interface MovePackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageToMove: OrderPackage | null;
  sourceOrder: Order | null;
  allOrders: Order[];
  clients: Client[];
  onConfirmMove: (packageId: string, fromOrderId: string, toOrderId: string) => Promise<void>;
}

export const MovePackageModal: React.FC<MovePackageModalProps> = ({
  isOpen,
  onClose,
  packageToMove,
  sourceOrder,
  allOrders,
  clients,
  onConfirmMove,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTargetOrderId, setSelectedTargetOrderId] = useState<string>('');
  const [moving, setMoving] = useState(false);

  // Available target orders (all except current source order)
  const candidateOrders = useMemo(() => {
    if (!sourceOrder) return [];
    return allOrders.filter((o) => o.id !== sourceOrder.id);
  }, [allOrders, sourceOrder]);

  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return candidateOrders;
    const query = normalizeSearch(searchTerm);

    return candidateOrders.filter((order) => {
      const client = clients.find((c) => c.id === order.clientId);
      const clientName = client ? normalizeSearch(`${client.name} ${client.surnames || ''}`) : '';
      const orderDesc = normalizeSearch(order.description);
      const packagesText = (order.packages || []).map((p) => normalizeSearch(p.description)).join(' ');

      return (
        clientName.includes(query) ||
        orderDesc.includes(query) ||
        packagesText.includes(query) ||
        normalizeSearch(order.shippingType).includes(query)
      );
    });
  }, [candidateOrders, clients, searchTerm]);

  if (!isOpen || !packageToMove || !sourceOrder) return null;

  const sourceClient = clients.find((c) => c.id === sourceOrder.clientId);
  const isSourceLastPackage = (sourceOrder.packages?.length || 1) <= 1;

  const handleExecuteMove = async () => {
    if (!selectedTargetOrderId || moving) return;
    setMoving(true);
    try {
      await onConfirmMove(packageToMove.id, sourceOrder.id, selectedTargetOrderId);
      onClose();
    } catch (err) {
      console.error('Error executing move:', err);
    } finally {
      setMoving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150 overflow-x-hidden">
      <div className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl border border-purple-100 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-purple-100/80 flex items-center justify-between bg-purple-50/50 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-extrabold text-slate-900 truncate">Mover Paquete a Otro Pedido</h2>
              <p className="text-[11px] text-slate-500">Reasigna este artículo a un pedido existente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Selected package to move badge */}
          <div className="p-3 rounded-2xl bg-purple-100/50 border border-purple-200/90 text-xs space-y-1">
            <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
              Paquete seleccionado para mover:
            </span>
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span className="truncate pr-2">{packageToMove.description || 'Artículo'}</span>
              <span className="text-purple-900 shrink-0">{formatCurrency(packageToMove.price)}</span>
            </div>
            <div className="text-[11px] text-slate-600">
              Pedido origen: <strong className="text-slate-800">{sourceClient ? `${sourceClient.name} ${sourceClient.surnames || ''}` : 'Cliente'}</strong> ({formatShortDate(sourceOrder.orderDate)})
            </div>

            {isSourceLastPackage && (
              <div className="mt-2 pt-2 border-t border-purple-200/80 text-[11px] text-amber-800 flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>
                  Este es el único paquete de este pedido. Al moverlo, el pedido original quedará vacío y se eliminará automáticamente.
                </span>
              </div>
            )}
          </div>

          {/* Target Orders Search */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Selecciona el pedido de destino:
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar pedido por cliente, paquetes o descripción..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 focus:border-purple-500 outline-none text-xs"
              />
            </div>
          </div>

          {/* List of Target Orders */}
          <div className="space-y-2.5 max-h-[38vh] overflow-y-auto pr-1">
            {candidateOrders.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                No hay otros pedidos disponibles para mover este paquete. Crea primero otro pedido.
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                No se han encontrado pedidos que coincidan con la búsqueda.
              </div>
            ) : (
              filteredOrders.map((cand) => {
                const candClient = clients.find((c) => c.id === cand.clientId);
                const isSelected = selectedTargetOrderId === cand.id;
                const pkgsCount = cand.packages?.length || 1;

                return (
                  <div
                    key={cand.id}
                    onClick={() => setSelectedTargetOrderId(cand.id)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer select-none text-xs space-y-2 ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/70 shadow-xs ring-1 ring-purple-600'
                        : 'border-slate-200 hover:border-purple-300 bg-white hover:bg-purple-50/20'
                    }`}
                  >
                    {/* Header: Client name + date + current package count */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-extrabold text-slate-900 block truncate">
                            {candClient ? `${candClient.name} ${candClient.surnames || ''}` : 'Cliente'}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {formatShortDate(cand.orderDate)} · {cand.shippingType || 'Envío'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center gap-1 font-bold text-[11px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200/80">
                          <Boxes className="w-3 h-3" />
                          <span>{pkgsCount} {pkgsCount === 1 ? 'paquete actual' : 'paquetes actuales'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Descriptions of all packages in this candidate order (REQUIREMENT) */}
                    <div className="bg-white/80 p-2.5 rounded-xl border border-purple-100/80 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Paquetes actuales de este pedido:
                      </span>
                      {cand.packages && cand.packages.length > 0 ? (
                        <ul className="space-y-1">
                          {cand.packages.map((p, idx) => (
                            <li key={p.id || idx} className="text-xs text-slate-700 font-medium flex items-start gap-1.5 leading-snug">
                              <span className="text-purple-600 font-bold shrink-0">• #{idx + 1}:</span>
                              <span className="whitespace-pre-wrap break-words">{p.description || 'Sin descripción'} ({formatCurrency(p.price)})</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-600 italic">
                          • {cand.description || 'Artículo'} ({formatCurrency(cand.price)})
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-purple-100 flex items-center justify-end gap-2 bg-purple-50/20 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!selectedTargetOrderId || moving}
            onClick={handleExecuteMove}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition active:scale-95 disabled:opacity-50"
          >
            <Check className="w-4 h-4 text-purple-300" />
            <span>Mover Paquete a este Pedido</span>
          </button>
        </div>
      </div>
    </div>
  );
};
