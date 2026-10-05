import React from 'react';
import { Send } from 'lucide-react';
import { formatCurrency } from '../../utils/dateUtils';

interface OrderPriceDisplayProps {
  productPrice: number;
  shippingCost?: number;
  size?: 'sm' | 'md' | 'lg';
  compact?: boolean;
}

export const OrderPriceDisplay: React.FC<OrderPriceDisplayProps> = ({
  productPrice,
  shippingCost = 0,
  size = 'md',
  compact = false,
}) => {
  const safeProductPrice = Number(productPrice) || 0;
  const safeShippingCost = Number(shippingCost) || 0;
  const totalPrice = safeProductPrice + safeShippingCost;

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1 text-right text-xs">
        <span className="font-semibold text-slate-800">{formatCurrency(safeProductPrice)}</span>
        <span className="text-slate-400 font-medium">+</span>
        <span className="inline-flex items-center gap-0.5 text-purple-700 font-semibold">
          {formatCurrency(safeShippingCost)}
          <Send className="w-2.5 h-2.5 -rotate-12 inline shrink-0" />
        </span>
        <span className="text-slate-400 font-medium">=</span>
        <span className="font-black text-slate-950 text-sm">{formatCurrency(totalPrice)}</span>
      </div>
    );
  }

  const textClasses = {
    sm: 'text-xs',
    md: 'text-xs sm:text-sm',
    lg: 'text-sm sm:text-base',
  };

  const totalClasses = {
    sm: 'text-xs font-black',
    md: 'text-sm sm:text-base font-black',
    lg: 'text-base sm:text-lg font-black',
  };

  return (
    <div className={`inline-flex flex-wrap items-center justify-end gap-1 sm:gap-1.5 ${textClasses[size]}`}>
      <span className="font-semibold text-slate-700" title="Precio de los artículos/paquetes">
        {formatCurrency(safeProductPrice)}
      </span>
      <span className="text-slate-400 font-medium">+</span>
      <span className="inline-flex items-center gap-1 font-semibold text-purple-700 bg-purple-50/80 px-1.5 py-0.5 rounded-lg border border-purple-200/60" title="Gastos de envío">
        <span>{formatCurrency(safeShippingCost)}</span>
        <Send className="w-3 h-3 -rotate-12 text-purple-600 shrink-0" />
      </span>
      <span className="text-slate-400 font-medium">=</span>
      <span className={`text-slate-950 ${totalClasses[size]}`} title="Precio total del pedido">
        {formatCurrency(totalPrice)}
      </span>
    </div>
  );
};
