import { Client, Order, AppDataBackup } from '../types';

const CLIENTS_STORAGE_KEY = 'mispedidos_clients';
const ORDERS_STORAGE_KEY = 'mispedidos_orders';
export const STORAGE_CHANGE_EVENT = 'mispedidos_data_change';

function notifyChange() {
  window.dispatchEvent(new CustomEvent(STORAGE_CHANGE_EVENT));
}

// CLIENTS
export function getClients(): Client[] {
  try {
    const raw = localStorage.getItem(CLIENTS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading clients from localStorage', err);
    return [];
  }
}

export function saveClients(clients: Client[]): void {
  try {
    localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
    notifyChange();
  } catch (err) {
    console.error('Error saving clients to localStorage', err);
  }
}

export function saveClient(client: Partial<Client> & { name: string }): Client {
  const clients = getClients();
  const now = new Date().toISOString();

  let updatedClient: Client;

  if (client.id) {
    const index = clients.findIndex((c) => c.id === client.id);
    if (index !== -1) {
      updatedClient = {
        ...clients[index],
        ...client,
        updatedAt: now,
      };
      clients[index] = updatedClient;
    } else {
      updatedClient = {
        id: client.id,
        name: client.name.trim(),
        surnames: client.surnames?.trim() || '',
        address: client.address?.trim() || '',
        phone: client.phone?.trim() || '',
        dni: client.dni?.trim() || '',
        tags: client.tags || [],
        note: client.note?.trim() || '',
        clientDate: client.clientDate || now.split('T')[0],
        photo: client.photo,
        createdAt: now,
        updatedAt: now,
      };
      clients.unshift(updatedClient);
    }
  } else {
    updatedClient = {
      id: `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: client.name.trim(),
      surnames: client.surnames?.trim() || '',
      address: client.address?.trim() || '',
      phone: client.phone?.trim() || '',
      dni: client.dni?.trim() || '',
      tags: client.tags || [],
      note: client.note?.trim() || '',
      clientDate: client.clientDate || now.split('T')[0],
      photo: client.photo,
      createdAt: now,
      updatedAt: now,
    };
    clients.unshift(updatedClient);
  }

  saveClients(clients);
  return updatedClient;
}

export function deleteClient(clientId: string): void {
  const clients = getClients().filter((c) => c.id !== clientId);
  saveClients(clients);
}

// ORDERS
export function getOrders(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading orders from localStorage', err);
    return [];
  }
}

export function saveOrders(orders: Order[]): void {
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    notifyChange();
  } catch (err) {
    console.error('Error saving orders to localStorage', err);
  }
}

export function saveOrder(order: Partial<Order> & { clientId: string; price: number; shippingType: Order['shippingType']; orderDate: string }): Order {
  const orders = getOrders();
  const now = new Date().toISOString();

  let updatedOrder: Order;

  if (order.id) {
    const index = orders.findIndex((o) => o.id === order.id);
    if (index !== -1) {
      updatedOrder = {
        ...orders[index],
        ...order,
        updatedAt: now,
      };
      orders[index] = updatedOrder;
    } else {
      updatedOrder = {
        id: order.id,
        description: order.description?.trim() || '',
        clientId: order.clientId,
        price: order.price,
        shippingAddress: order.shippingAddress?.trim() || '',
        isCustomAddress: order.isCustomAddress || false,
        shippingType: order.shippingType,
        orderDate: order.orderDate,
        photo: order.photo,
        status: order.status || 'pendiente',
        readyDate: order.readyDate,
        shippedDate: order.shippedDate,
        createdAt: now,
        updatedAt: now,
      };
      orders.unshift(updatedOrder);
    }
  } else {
    updatedOrder = {
      id: `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      description: order.description?.trim() || '',
      clientId: order.clientId,
      price: order.price,
      shippingAddress: order.shippingAddress?.trim() || '',
      isCustomAddress: order.isCustomAddress || false,
      shippingType: order.shippingType,
      orderDate: order.orderDate,
      photo: order.photo,
      status: order.status || 'pendiente',
      readyDate: order.readyDate,
      shippedDate: order.shippedDate,
      createdAt: now,
      updatedAt: now,
    };
    orders.unshift(updatedOrder);
  }

  saveOrders(orders);
  return updatedOrder;
}

export function deleteOrder(orderId: string): void {
  const orders = getOrders().filter((o) => o.id !== orderId);
  saveOrders(orders);
}

// BACKUP & RESTORE
export function exportBackup(): AppDataBackup {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    clients: getClients(),
    orders: getOrders(),
  };
}

export function importBackup(
  backupData: AppDataBackup,
  mode: 'replace' | 'merge' = 'replace'
): { clientsCount: number; ordersCount: number } {
  if (!backupData || !Array.isArray(backupData.clients) || !Array.isArray(backupData.orders)) {
    throw new Error('El archivo no contiene un formato de copia de seguridad válido de Mis Pedidos.');
  }

  if (mode === 'replace') {
    saveClients(backupData.clients);
    saveOrders(backupData.orders);
    return {
      clientsCount: backupData.clients.length,
      ordersCount: backupData.orders.length,
    };
  }

  // Merge mode
  const currentClients = getClients();
  const currentOrders = getOrders();

  const clientMap = new Map(currentClients.map((c) => [c.id, c]));
  backupData.clients.forEach((c) => clientMap.set(c.id, c));
  const mergedClients = Array.from(clientMap.values());

  const orderMap = new Map(currentOrders.map((o) => [o.id, o]));
  backupData.orders.forEach((o) => orderMap.set(o.id, o));
  const mergedOrders = Array.from(orderMap.values());

  saveClients(mergedClients);
  saveOrders(mergedOrders);

  return {
    clientsCount: mergedClients.length,
    ordersCount: mergedOrders.length,
  };
}

export function clearAllData(): void {
  localStorage.removeItem(CLIENTS_STORAGE_KEY);
  localStorage.removeItem(ORDERS_STORAGE_KEY);
  notifyChange();
}
