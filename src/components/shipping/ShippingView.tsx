import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Package, 
  Clock, 
  Check, 
  X,
  Sparkles
} from 'lucide-react';
import { ShippingRateConfig, Order, ShippingType } from '../../types';
import { getShippingRates, saveShippingRates } from '../../services/storage';
import { formatCurrency } from '../../utils/dateUtils';

interface ShippingViewProps {
  orders: Order[];
}

export const ShippingView: React.FC<ShippingViewProps> = ({ orders }) => {
  const [rates, setRates] = useState<ShippingRateConfig>({
    'En mano': 0,
    'Ordinario': 2.50,
    'Certificado': 5.95,
  });
  const [initialRates, setInitialRates] = useState<ShippingRateConfig>({
    'En mano': 0,
    'Ordinario': 2.50,
    'Certificado': 5.95,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    getShippingRates().then((currentRates) => {
      setRates(currentRates);
      setInitialRates(currentRates);
      setLoading(false);
    });
  }, []);

  // Count orders per shipping type
  const countsByShipping: Record<string, number> = {
    'En mano': orders.filter((o) => o.shippingType === 'En mano').length,
    'Ordinario': orders.filter((o) => o.shippingType === 'Ordinario').length,
    'Certificado': orders.filter((o) => o.shippingType === 'Certificado').length,
  };

  const hasChanges = 
    rates['En mano'] !== initialRates['En mano'] ||
    rates['Ordinario'] !== initialRates['Ordinario'] ||
    rates['Certificado'] !== initialRates['Certificado'];

  const handleOpenSaveDialog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) {
      setStatusMsg({ type: 'success', text: 'No hay cambios pendientes de guardar en las tarifas.' });
      return;
    }
    // Open confirmation modal to let user decide update scope
    setShowConfirmModal(true);
  };

  const handleApplyRates = async (updateExisting: boolean) => {
    setShowConfirmModal(false);
    setSaving(true);
    setStatusMsg(null);

    try {
      const result = await saveShippingRates(rates, updateExisting);
      setInitialRates({ ...rates });
      setStatusMsg({
        type: 'success',
        text: updateExisting
          ? `Tarifas guardadas. Se han actualizado ${result.updatedOrdersCount} pedidos anteriores.`
          : 'Tarifas guardadas para pedidos futuros. Los pedidos anteriores mantienen sus precios.',
      });
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Error al guardar las tarifas de envío.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 px-1 sm:px-0 overflow-x-hidden">
      {/* Header Banner - Black & Lilac Palette */}
      <div className="bg-zinc-950 rounded-3xl p-5 sm:p-6 text-white shadow-sm border border-zinc-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0">
            <Send className="w-5 h-5 -rotate-12" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-extrabold truncate">Tarifas de Envío</h1>
            <p className="text-xs text-zinc-400">Configura el precio asignado por defecto a cada método de entrega</p>
          </div>
        </div>

        <div className="mt-4 pt-3.5 border-t border-zinc-800/80 flex flex-wrap gap-4 text-xs font-medium text-zinc-300">
          <div className="flex items-center gap-1.5">
            <Package className="w-4 h-4 text-purple-400" />
            <span>Total de pedidos registrados: <strong className="text-white">{orders.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Status banner */}
      {statusMsg && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-xs sm:text-sm animate-in fade-in duration-150 ${
            statusMsg.type === 'success'
              ? 'bg-purple-50 border-purple-200 text-purple-950'
              : 'bg-red-50 border-red-200 text-red-950'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span className="font-medium flex-1">{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Rates Form */}
      <form onSubmit={handleOpenSaveDialog} className="space-y-4">
        <div className="bg-white rounded-3xl border border-purple-100 p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-purple-100/80">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Truck className="w-4 h-4 text-purple-600" />
              Precios por Tipo de Envío
            </h2>
            <span className="text-xs text-slate-500 font-medium">Modificables en cualquier momento</span>
          </div>

          <div className="space-y-4">
            {/* 1. En mano */}
            <div className="p-4 rounded-2xl border border-purple-100/90 bg-purple-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-900">🤝 En mano</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                    {countsByShipping['En mano'] || 0} pedidos
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Entrega personal o recogida en taller/punto acordado.</p>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <label className="text-xs font-bold text-slate-700">Precio (€):</label>
                <div className="relative w-28">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={rates['En mano']}
                    onChange={(e) => setRates({ ...rates, 'En mano': parseFloat(e.target.value) || 0 })}
                    className="w-full pl-3 pr-7 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm font-bold bg-white text-slate-900 text-right"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">€</span>
                </div>
              </div>
            </div>

            {/* 2. Ordinario */}
            <div className="p-4 rounded-2xl border border-purple-100/90 bg-purple-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-900">✉️ Ordinario</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                    {countsByShipping['Ordinario'] || 0} pedidos
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Envío postal estándar sin número de seguimiento.</p>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <label className="text-xs font-bold text-slate-700">Precio (€):</label>
                <div className="relative w-28">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={rates['Ordinario']}
                    onChange={(e) => setRates({ ...rates, 'Ordinario': parseFloat(e.target.value) || 0 })}
                    className="w-full pl-3 pr-7 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm font-bold bg-white text-slate-900 text-right"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">€</span>
                </div>
              </div>
            </div>

            {/* 3. Certificado */}
            <div className="p-4 rounded-2xl border border-purple-100/90 bg-purple-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-900">📦 Certificado</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                    {countsByShipping['Certificado'] || 0} pedidos
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Envío con número de seguimiento y entrega bajo firma.</p>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <label className="text-xs font-bold text-slate-700">Precio (€):</label>
                <div className="relative w-28">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={rates['Certificado']}
                    onChange={(e) => setRates({ ...rates, 'Certificado': parseFloat(e.target.value) || 0 })}
                    className="w-full pl-3 pr-7 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm font-bold bg-white text-slate-900 text-right"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">€</span>
                </div>
              </div>
            </div>
          </div>

          {/* Format preview explanation */}
          <div className="bg-purple-100/60 rounded-2xl p-3.5 border border-purple-200 text-xs text-purple-950 space-y-1">
            <span className="font-bold flex items-center gap-1.5 text-purple-900">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              Visualización de precios en pedidos:
            </span>
            <p className="leading-relaxed text-purple-900/90">
              En las tarjetas de pedidos se mostrará el desglose claro de: <br className="sm:hidden" />
              <strong className="text-slate-900">Precio Producto</strong> + <strong className="text-slate-900">Coste Envío <Send className="w-3 h-3 inline text-purple-600 -rotate-12 align-baseline" /></strong> = <strong className="text-slate-950">Total</strong>
            </p>
          </div>

          {/* Footer Submit Button */}
          <div className="pt-2 flex items-center justify-end">
            <button
              type="submit"
              disabled={saving || !hasChanges}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs sm:text-sm shadow-xs transition active:scale-95 disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-purple-300" />
              <span>Guardar Tarifas de Envío</span>
            </button>
          </div>
        </div>
      </form>

      {/* Confirmation Modal to Decide Scope of Update */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-x-hidden">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl border border-purple-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 border-b border-purple-100">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-extrabold text-slate-900">¿Actualizar pedidos anteriores?</h3>
                <p className="text-xs text-slate-500">Has modificado el precio de uno o varios envíos</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Elige cómo deseas aplicar este nuevo precio:
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleApplyRates(false)}
                className="w-full text-left p-3.5 rounded-2xl border border-slate-200 hover:border-purple-400 hover:bg-purple-50/40 transition group"
              >
                <div className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-purple-950 flex items-center justify-between">
                  <span>Solo para pedidos nuevos</span>
                  <span className="text-[11px] font-normal text-slate-400">Recomendado</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Los pedidos ya registrados conservarán el precio de envío que tenían cuando se crearon.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleApplyRates(true)}
                className="w-full text-left p-3.5 rounded-2xl border border-purple-200 bg-purple-50/30 hover:border-purple-500 hover:bg-purple-50 transition group"
              >
                <div className="font-bold text-xs sm:text-sm text-purple-950 flex items-center justify-between">
                  <span>Actualizar también todos los pedidos anteriores</span>
                  <span className="text-[11px] font-semibold text-purple-700">Recalcular</span>
                </div>
                <p className="text-xs text-purple-800/80 mt-1">
                  Se actualizará el coste de envío en los {orders.length} pedidos ya existentes que utilicen estos métodos.
                </p>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
