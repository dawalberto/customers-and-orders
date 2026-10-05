import React, { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white shadow-2xs transition active:scale-95"
        title="Instalar como App en tu móvil o PC"
      >
        <Download className="w-3.5 h-3.5 text-purple-300" />
        <span>Instalar</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-100 hover:bg-purple-200 text-purple-900 transition active:scale-95"
          title="Instalar en iPhone"
        >
          <Download className="w-3.5 h-3.5 text-purple-700" />
          <span>Instalar</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 top-0 left-0 h-dvh w-dvw z-50 flex items-end sm:items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-purple-100 animate-in fade-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-purple-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
                    💜
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Instalar Mis Pedidos</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <p>
                    Pulsa el icono de <strong className="text-slate-900">Compartir</strong> <Share className="inline w-4 h-4 text-purple-600 align-text-bottom mx-0.5" /> en la barra inferior de Safari.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <p>
                    Baja un poco en el menú y toca en <strong className="text-slate-900">Añadir a pantalla de inicio</strong> (+).
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  <p>
                    Toca en <strong className="text-slate-900">Añadir</strong> arriba a la derecha. ¡Y listo! Se abrirá como app independiente sin barras de navegador.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 px-4 rounded-2xl bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
