import React, { useState, useRef, useEffect } from 'react';
import { 
  Download, 
  Upload, 
  Database, 
  AlertTriangle, 
  CheckCircle2, 
  HardDrive, 
  FileJson, 
  Trash2, 
  ArrowLeft,
  Share2,
  Copy,
  Check
} from 'lucide-react';
import { exportBackup, importBackup, clearAllData, getEstimatedStorageSize } from '../../services/storage';
import { AppDataBackup } from '../../types';

interface BackupViewProps {
  onBackToApp: () => void;
  clientsCount: number;
  ordersCount: number;
}

export const BackupView: React.FC<BackupViewProps> = ({
  onBackToApp,
  clientsCount,
  ordersCount,
}) => {
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [copied, setCopied] = useState(false);
  const [storageSize, setStorageSize] = useState<string>('0');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshStorageSize = () => {
    getEstimatedStorageSize().then(setStorageSize);
  };

  useEffect(() => {
    refreshStorageSize();
  }, [clientsCount, ordersCount]);

  /**
   * PWA & Mobile-compatible export function:
   * 1. Attempts Web Share API with File object (official PWA way to save file on iOS/Android)
   * 2. Fallback to Blob object URL download
   */
  const handleExport = async () => {
    try {
      const backup = await exportBackup();
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `mis-pedidos-copia-${dateStr}.json`;
      const jsonString = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });

      // Check if Web Share API with files is supported (works reliably in PWA mode!)
      const file = new File([blob], filename, { type: 'application/json' });
      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: filename,
            text: 'Copia de seguridad de Mis Pedidos en formato JSON.',
          });
          setStatusMessage({
            type: 'success',
            text: `Copia de seguridad compartida/guardada con éxito (${backup.clients.length} clientes, ${backup.orders.length} pedidos).`,
          });
          return;
        } catch (shareErr: any) {
          // If user aborted share sheet, don't show error, just fallback to standard download
          if (shareErr.name === 'AbortError') return;
        }
      }

      // Standard Blob URL download fallback
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 500);

      setStatusMessage({
        type: 'success',
        text: `Descarga de copia iniciada (${backup.clients.length} clientes, ${backup.orders.length} pedidos).`,
      });
    } catch (err: any) {
      console.error('Export error:', err);
      setStatusMessage({
        type: 'error',
        text: 'No se pudo exportar automáticamente. Usa el botón "Copiar JSON" para guardarlo manualmente.',
      });
    }
  };

  // Copy raw JSON to clipboard as a 100% foolproof fallback
  const handleCopyJsonToClipboard = async () => {
    try {
      const backup = await exportBackup();
      const jsonString = JSON.stringify(backup, null, 2);
      navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      setStatusMessage({
        type: 'success',
        text: 'Copia de seguridad copiada al portapapeles. Puedes pegarla en Notas, WhatsApp o guardarla en un archivo.',
      });
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'No se pudo copiar al portapapeles.',
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as AppDataBackup;
        const result = await importBackup(parsed, importMode);
        refreshStorageSize();
        setStatusMessage({
          type: 'success',
          text: `Datos importados con éxito en IndexedDB: ${result.clientsCount} clientes y ${result.ordersCount} pedidos restaurados en la app.`,
        });
      } catch (err: any) {
        console.error(err);
        setStatusMessage({
          type: 'error',
          text: `Error al importar el archivo: ${err.message || 'Formato no válido'}.`,
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClear = async () => {
    if (window.confirm('¿ATENCIÓN: Seguro que deseas eliminar todos los datos de la app? Esta acción no se puede deshacer a menos que tengas una copia en JSON.')) {
      await clearAllData();
      refreshStorageSize();
      setStatusMessage({
        type: 'success',
        text: 'Todos los datos locales de IndexedDB han sido borrados.',
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 px-1 sm:px-0 overflow-x-hidden">
      {/* Back button */}
      <button
        onClick={onBackToApp}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 hover:text-purple-700 text-xs font-semibold shadow-2xs transition active:scale-95"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a la aplicación</span>
      </button>

      {/* Header Banner - Black & Lilac Palette */}
      <div className="bg-zinc-950 rounded-3xl p-5 sm:p-6 text-white shadow-sm border border-zinc-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-extrabold truncate">Copias de Seguridad (Datos)</h1>
            <p className="text-xs text-zinc-400">Guarda o restaura tus clientes y pedidos en formato .JSON</p>
          </div>
        </div>

        {/* Current storage info */}
        <div className="mt-4 pt-3.5 border-t border-zinc-800/80 flex flex-wrap gap-4 text-xs font-medium text-zinc-300">
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-4 h-4 text-purple-400" />
            <span>Espacio ocupado (IndexedDB): <strong>~{storageSize} KB</strong></span>
          </div>
          <div>
            <span>Clientes: <strong className="text-white">{clientsCount}</strong></span>
          </div>
          <div>
            <span>Pedidos: <strong className="text-white">{ordersCount}</strong></span>
          </div>
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-xs sm:text-sm animate-in fade-in duration-150 ${
            statusMessage.type === 'success'
              ? 'bg-purple-50 border-purple-200 text-purple-950'
              : 'bg-red-50 border-red-200 text-red-950'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span className="font-medium flex-1">{statusMessage.text}</span>
        </div>
      )}

      {/* Export Section */}
      <div className="bg-white rounded-3xl border border-purple-100 p-5 sm:p-6 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
          <Download className="w-5 h-5 text-purple-600" />
          <span>Exportar Copia de Seguridad</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Genera un archivo <code>.json</code> con tus clientes, teléfonos, direcciones, fotos y pedidos. Compatible con la app instalada en móvil (PWA) y navegador.
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs sm:text-sm shadow-xs transition active:scale-95"
          >
            <Download className="w-4 h-4 text-purple-300" />
            <span>Guardar / Descargar .JSON</span>
          </button>

          <button
            onClick={handleCopyJsonToClipboard}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-semibold text-xs sm:text-sm transition active:scale-95"
            title="Copiar datos al portapapeles"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-purple-700" />
                <span>¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-purple-600" />
                <span>Copiar texto JSON</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-white rounded-3xl border border-purple-100 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
          <Upload className="w-5 h-5 text-purple-600" />
          <span>Restaurar / Importar Datos</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Selecciona un archivo <code>.json</code> para restaurar tus clientes y pedidos.
        </p>

        {/* Mode selector */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-800">Método de importación:</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <label
              className={`flex items-start gap-2 p-3 rounded-xl border cursor-pointer transition ${
                importMode === 'replace'
                  ? 'border-purple-500 bg-purple-50/60 font-semibold text-purple-950 ring-1 ring-purple-300'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              <input
                type="radio"
                name="mode"
                checked={importMode === 'replace'}
                onChange={() => setImportMode('replace')}
                className="mt-0.5 text-purple-600"
              />
              <div>
                <span>Reemplazar todo</span>
                <p className="text-[11px] font-normal text-slate-500 mt-0.5">
                  Sustituye por completo los datos actuales por los del archivo.
                </p>
              </div>
            </label>

            <label
              className={`flex items-start gap-2 p-3 rounded-xl border cursor-pointer transition ${
                importMode === 'merge'
                  ? 'border-purple-500 bg-purple-50/60 font-semibold text-purple-950 ring-1 ring-purple-300'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              <input
                type="radio"
                name="mode"
                checked={importMode === 'merge'}
                onChange={() => setImportMode('merge')}
                className="mt-0.5 text-purple-600"
              />
              <div>
                <span>Combinar (Merge)</span>
                <p className="text-[11px] font-normal text-slate-500 mt-0.5">
                  Une los clientes y pedidos sin borrar los existentes.
                </p>
              </div>
            </label>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-purple-300 hover:bg-purple-50 text-purple-900 font-semibold text-xs sm:text-sm shadow-xs transition active:scale-95"
        >
          <Upload className="w-4 h-4 text-purple-600" />
          <span>Seleccionar archivo .JSON para importar</span>
        </button>
      </div>

      {/* Danger Zone: Reset all */}
      <div className="bg-red-50/40 rounded-3xl border border-red-200 p-5 space-y-2.5">
        <div className="flex items-center gap-2 text-red-950 font-bold text-sm">
          <Trash2 className="w-4 h-4 text-red-600" />
          <span>Zona de peligro: Borrar todos los datos</span>
        </div>
        <p className="text-xs text-red-700 leading-relaxed">
          Si deseas reiniciar la aplicación y vaciar clientes y pedidos almacenados en este navegador, puedes hacerlo aquí.
        </p>
        <button
          onClick={handleClear}
          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-xs transition active:scale-95"
        >
          Vaciar todos los datos de la app
        </button>
      </div>
    </div>
  );
};
