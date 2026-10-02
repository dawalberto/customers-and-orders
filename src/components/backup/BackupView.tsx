import React, { useState, useRef } from 'react';
import { 
  Download, 
  Upload, 
  Database, 
  AlertTriangle, 
  CheckCircle2, 
  HardDrive, 
  RefreshCw,
  FileJson,
  Trash2,
  ArrowLeft
} from 'lucide-react';
import { exportBackup, importBackup, clearAllData } from '../../services/storage';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Storage usage estimation
  const getLocalStorageSize = () => {
    let total = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += ((localStorage[key].length + key.length) * 2);
      }
    }
    return (total / 1024).toFixed(1); // in KB
  };

  const handleExport = () => {
    try {
      const backup = exportBackup();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backup, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `mis-pedidos-copia-${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setStatusMessage({
        type: 'success',
        text: `Copia de seguridad descargada con éxito (${backup.clients.length} clientes, ${backup.orders.length} pedidos).`,
      });
    } catch (err) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: 'Error al exportar los datos.',
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as AppDataBackup;
        const result = importBackup(parsed, importMode);
        setStatusMessage({
          type: 'success',
          text: `Datos importados con éxito: ${result.clientsCount} clientes y ${result.ordersCount} pedidos restaurados en la app.`,
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

  const handleClear = () => {
    if (window.confirm('¿ATENCIÓN: Seguro que deseas eliminar todos los datos de la app? Esta acción no se puede deshacer a menos que tengas una copia en JSON.')) {
      clearAllData();
      setStatusMessage({
        type: 'success',
        text: 'Todos los datos locales han sido borrados.',
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={onBackToApp}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-slate-700 hover:text-rose-700 text-xs font-semibold shadow-2xs transition active:scale-95"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a la aplicación</span>
      </button>

      {/* Title */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-3xl p-6 text-white shadow-md">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold">Copias de Seguridad (Datos)</h1>
            <p className="text-xs text-rose-100">Exporta e importa tus clientes y pedidos en formato .json</p>
          </div>
        </div>

        {/* Current storage info */}
        <div className="mt-4 pt-4 border-t border-white/20 flex flex-wrap gap-4 text-xs font-medium text-rose-50">
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-4 h-4 text-white" />
            <span>Espacio ocupado: <strong>~{getLocalStorageSize()} KB</strong></span>
          </div>
          <div>
            <span>Clientes actuales: <strong>{clientsCount}</strong></span>
          </div>
          <div>
            <span>Pedidos actuales: <strong>{ordersCount}</strong></span>
          </div>
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-sm animate-in fade-in duration-150 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{statusMessage.text}</span>
        </div>
      )}

      {/* Export Section */}
      <div className="bg-white rounded-3xl border border-rose-100 p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
          <Download className="w-5 h-5 text-rose-500" />
          <span>Exportar Copia de Seguridad</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Descarga un archivo <code>.json</code> completo con todos tus clientes, teléfonos, direcciones, fotos y pedidos para guardarlo a buen recaudo o transferirlo a otro móvil.
        </p>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm shadow-xs transition active:scale-95"
        >
          <FileJson className="w-4 h-4" />
          <span>Descargar archivo .JSON</span>
        </button>
      </div>

      {/* Import Section */}
      <div className="bg-white rounded-3xl border border-rose-100 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
          <Upload className="w-5 h-5 text-rose-500" />
          <span>Restaurar / Importar Datos</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Selecciona un archivo <code>.json</code> previamente exportado para restaurar tu información.
        </p>

        {/* Mode selector */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">Método de importación:</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <label
              className={`flex items-start gap-2 p-3 rounded-xl border cursor-pointer transition ${
                importMode === 'replace'
                  ? 'border-rose-400 bg-rose-50/60 font-semibold text-rose-950'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              <input
                type="radio"
                name="mode"
                checked={importMode === 'replace'}
                onChange={() => setImportMode('replace')}
                className="mt-0.5"
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
                  ? 'border-rose-400 bg-rose-50/60 font-semibold text-rose-950'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              <input
                type="radio"
                name="mode"
                checked={importMode === 'merge'}
                onChange={() => setImportMode('merge')}
                className="mt-0.5"
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
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 font-semibold text-sm shadow-xs transition active:scale-95"
        >
          <Upload className="w-4 h-4" />
          <span>Seleccionar archivo .JSON para importar</span>
        </button>
      </div>

      {/* Danger Zone: Reset all */}
      <div className="bg-red-50/50 rounded-3xl border border-red-200/80 p-5 space-y-3">
        <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
          <Trash2 className="w-4 h-4 text-red-600" />
          <span>Zona de peligro: Borrar todos los datos</span>
        </div>
        <p className="text-xs text-red-700 leading-relaxed">
          Si deseas reiniciar la aplicación limpia y vaciar clientes y pedidos almacenados en este navegador, puedes hacerlo aquí.
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
