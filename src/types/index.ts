export type ShippingType = 'Ordinario' | 'Certificado' | 'En mano' | '';

export type OrderStatus = 'pendiente' | 'listo' | 'empaquetado' | 'enviado';

export type OrdersViewMode = 'stack' | 'list';

export interface ShippingRateConfig {
  'En mano': number;
  'Ordinario': number;
  'Certificado': number;
  giftThresholdEnabled?: boolean;
  giftThresholdAmount?: number;
}

export interface OrderPackage {
  id: string;
  description: string;
  price: number;
  shippingType?: ShippingType;
  status: OrderStatus;
  photo?: string;
}

export interface Client {
  id: string;
  name: string; // mandatory
  surnames?: string;
  address?: string;
  phone?: string;
  dni?: string;
  tags: string[];
  note?: string;
  clientDate: string; // YYYY-MM-DD or ISO
  photo?: string; // base64 compressed
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  description?: string;
  clientId: string; // mandatory
  price: number; // product price (sum of package prices)
  shippingCost?: number; // shipping fee
  shippingAddress: string; // defaults to client's address
  isCustomAddress?: boolean; // whether address was manually overridden
  shippingType: ShippingType; // mandatory, empty by default
  orderDate: string; // mandatory, defaults to now YYYY-MM-DD
  photo?: string; // base64 compressed
  status: OrderStatus; // defaults to 'pendiente'
  readyDate?: string; // auto-filled when marked as 'listo'
  packagedDate?: string; // auto-filled when marked as 'empaquetado'
  shippedDate?: string; // auto-filled when marked as 'enviado'
  packages: OrderPackage[]; // packages in this order
  createdAt: string;
  updatedAt: string;
}

export interface AppDataBackup {
  version: number;
  exportedAt: string;
  clients: Client[];
  orders: Order[];
  shippingRates?: ShippingRateConfig;
}

export type ActiveTab = 'clients' | 'orders' | 'shipping' | 'dashboard' | 'data';
