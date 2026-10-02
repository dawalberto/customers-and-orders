import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-40 flex items-center gap-2 rounded-xl bg-amber-500/95 text-white px-3.5 py-2 text-xs font-medium shadow-lg backdrop-blur-xs animate-in slide-in-from-bottom duration-300">
      <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
      <span>Modo sin conexión activo. Tus datos se guardan en este dispositivo.</span>
    </div>
  );
};
