export type ShippingType = 'Ordinario' | 'Certificado' | 'En mano' | '';

export type OrderStatus = 'pendiente' | 'listo' | 'enviado';

export type OrdersViewMode = 'stack' | 'list';

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
  price: number; // mandatory in €
  shippingAddress: string; // defaults to client's address
  isCustomAddress?: boolean; // whether address was manually overridden
  shippingType: ShippingType; // mandatory, empty by default
  orderDate: string; // mandatory, defaults to now YYYY-MM-DD
  photo?: string; // base64 compressed
  status: OrderStatus; // defaults to 'pendiente'
  readyDate?: string; // auto-filled when marked as 'listo'
  shippedDate?: string; // auto-filled when marked as 'enviado'
  createdAt: string;
  updatedAt: string;
}

export interface AppDataBackup {
  version: number;
  exportedAt: string;
  clients: Client[];
  orders: Order[];
}

export type ActiveTab = 'clients' | 'orders' | 'dashboard' | 'data';
