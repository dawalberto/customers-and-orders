import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Client, Order, OrderPackage, AppDataBackup, ShippingRateConfig, ShippingType } from '../types';

const DB_NAME = 'mispedidos_db';
const DB_VERSION = 2;
const MIGRATION_DONE_KEY = 'mispedidos_migrated_to_idb';
export const STORAGE_CHANGE_EVENT = 'mispedidos_data_change';

export const DEFAULT_SHIPPING_RATES: ShippingRateConfig = {
  'En mano': 0,
  'Ordinario': 2.50,
  'Certificado': 5.95,
};

interface MisPedidosDBSchema extends DBSchema {
  clients: {
    key: string;
    value: Client;
    indexes: {
      by_name: string;
      by_date: string;
    };
  };
  orders: {
    key: string;
    value: Order;
    indexes: {
      by_client: string;
      by_date: string;
      by_status: string;
    };
  };
  settings: {
    key: string;
    value: any;
  };
}

let dbPromise: Promise<IDBPDatabase<MisPedidosDBSchema>> | null = null;

function notifyChange() {
  window.dispatchEvent(new CustomEvent(STORAGE_CHANGE_EVENT));
}

export async function getDB(): Promise<IDBPDatabase<MisPedidosDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<MisPedidosDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains('clients')) {
          const clientStore = db.createObjectStore('clients', { keyPath: 'id' });
          clientStore.createIndex('by_name', 'name');
          clientStore.createIndex('by_date', 'clientDate');
        }

        if (!db.objectStoreNames.contains('orders')) {
          const orderStore = db.createObjectStore('orders', { keyPath: 'id' });
          orderStore.createIndex('by_client', 'clientId');
          orderStore.createIndex('by_date', 'orderDate');
          orderStore.createIndex('by_status', 'status');
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    }).then(async (db) => {
      await checkAndMigrateFromLocalStorage(db);
      return db;
    });
  }
  return dbPromise;
}

async function checkAndMigrateFromLocalStorage(db: IDBPDatabase<MisPedidosDBSchema>) {
  try {
    const isMigrated = localStorage.getItem(MIGRATION_DONE_KEY);
    const rawClients = localStorage.getItem('mispedidos_clients');
    const rawOrders = localStorage.getItem('mispedidos_orders');

    if (!isMigrated && (rawClients || rawOrders)) {
      const tx = db.transaction(['clients', 'orders'], 'readwrite');
      const clientsStore = tx.objectStore('clients');
      const ordersStore = tx.objectStore('orders');

      if (rawClients) {
        const parsedClients = JSON.parse(rawClients);
        if (Array.isArray(parsedClients)) {
          for (const client of parsedClients) {
            await clientsStore.put(client);
          }
        }
      }

      if (rawOrders) {
        const parsedOrders = JSON.parse(rawOrders);
        if (Array.isArray(parsedOrders)) {
          for (const order of parsedOrders) {
            await ordersStore.put(normalizeOrder(order, DEFAULT_SHIPPING_RATES));
          }
        }
      }

      await tx.done;
      localStorage.setItem(MIGRATION_DONE_KEY, 'true');
      console.log('Migración automática de localStorage a IndexedDB completada con éxito.');
    }
  } catch (err) {
    console.error('Error durante la migración a IndexedDB:', err);
  }
}

// ==================== SETTINGS & SHIPPING RATES ====================

export async function getShippingRates(): Promise<ShippingRateConfig> {
  try {
    const db = await getDB();
    const rates = await db.get('settings', 'shipping_rates');
    if (rates && typeof rates === 'object') {
      return {
        'En mano': typeof rates['En mano'] === 'number' ? rates['En mano'] : DEFAULT_SHIPPING_RATES['En mano'],
        'Ordinario': typeof rates['Ordinario'] === 'number' ? rates['Ordinario'] : DEFAULT_SHIPPING_RATES['Ordinario'],
        'Certificado': typeof rates['Certificado'] === 'number' ? rates['Certificado'] : DEFAULT_SHIPPING_RATES['Certificado'],
      };
    }
    return { ...DEFAULT_SHIPPING_RATES };
  } catch (err) {
    console.error('Error reading shipping rates:', err);
    return { ...DEFAULT_SHIPPING_RATES };
  }
}

export async function saveShippingRates(
  newRates: ShippingRateConfig,
  updateExistingOrders = false
): Promise<{ updatedOrdersCount: number }> {
  const db = await getDB();
  await db.put('settings', newRates, 'shipping_rates');

  let updatedCount = 0;

  if (updateExistingOrders) {
    const tx = db.transaction('orders', 'readwrite');
    const store = tx.objectStore('orders');
    const orders = await store.getAll();

    for (const order of orders) {
      if (order.shippingType && newRates[order.shippingType as keyof ShippingRateConfig] !== undefined) {
        const newFee = newRates[order.shippingType as keyof ShippingRateConfig];
        if (order.shippingCost !== newFee) {
          order.shippingCost = newFee;
          order.updatedAt = new Date().toISOString();
          await store.put(order);
          updatedCount++;
        }
      }
    }

    await tx.done;
  }

  notifyChange();
  return { updatedOrdersCount: updatedCount };
}

// ==================== NORMALIZATION HELPER ====================

export function normalizeOrder(order: any, rates?: ShippingRateConfig): Order {
  const currentRates = rates || DEFAULT_SHIPPING_RATES;
  const shippingType = order.shippingType || '';
  const defaultFee = shippingType && currentRates[shippingType as keyof ShippingRateConfig] !== undefined
    ? currentRates[shippingType as keyof ShippingRateConfig]
    : 0;

  const shippingCost = typeof order.shippingCost === 'number' ? order.shippingCost : defaultFee;

  let packages: OrderPackage[] = [];
  if (Array.isArray(order.packages) && order.packages.length > 0) {
    packages = order.packages.map((pkg: any, idx: number) => ({
      id: pkg.id || `${order.id || 'ord'}_pkg_${idx + 1}`,
      description: pkg.description !== undefined ? String(pkg.description) : '',
      price: Number(pkg.price) || 0,
      shippingType: pkg.shippingType !== undefined ? pkg.shippingType : order.shippingType,
      status: pkg.status || order.status || 'pendiente',
      photo: pkg.photo,
    }));
  } else {
    packages = [{
      id: `${order.id || 'ord'}_pkg_1`,
      description: order.description || 'Artículo',
      price: Number(order.price) || 0,
      shippingType: order.shippingType || '',
      status: order.status || 'pendiente',
      photo: order.photo,
    }];
  }

  const calculatedProductPrice = packages.reduce((sum, p) => sum + (Number(p.price) || 0), 0);

  return {
    id: order.id,
    description: order.description || (packages.length === 1 ? packages[0].description : `${packages.length} paquetes`),
    clientId: order.clientId,
    price: calculatedProductPrice,
    shippingCost,
    shippingAddress: order.shippingAddress || '',
    isCustomAddress: !!order.isCustomAddress,
    shippingType: order.shippingType || '',
    orderDate: order.orderDate,
    photo: order.photo || packages[0]?.photo,
    status: order.status || 'pendiente',
    readyDate: order.readyDate,
    packagedDate: order.packagedDate,
    shippedDate: order.shippedDate,
    packages,
    createdAt: order.createdAt || new Date().toISOString(),
    updatedAt: order.updatedAt || new Date().toISOString(),
  };
}

// ==================== CLIENTS ====================

export async function getClients(): Promise<Client[]> {
  try {
    const db = await getDB();
    const clients = await db.getAll('clients');
    return clients.sort((a, b) => new Date(b.createdAt || b.clientDate).getTime() - new Date(a.createdAt || a.clientDate).getTime());
  } catch (err) {
    console.error('Error reading clients from IndexedDB', err);
    return [];
  }
}

export async function saveClients(clients: Client[]): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction('clients', 'readwrite');
    await tx.objectStore('clients').clear();
    for (const client of clients) {
      await tx.objectStore('clients').put(client);
    }
    await tx.done;
    notifyChange();
  } catch (err) {
    console.error('Error saving clients list to IndexedDB', err);
  }
}

export async function saveClient(client: Partial<Client> & { name: string }): Promise<Client> {
  const db = await getDB();
  const now = new Date().toISOString();

  let targetClient: Client;

  if (client.id) {
    const existing = await db.get('clients', client.id);
    if (existing) {
      targetClient = {
        ...existing,
        ...client,
        updatedAt: now,
      };
    } else {
      targetClient = {
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
    }
  } else {
    targetClient = {
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
  }

  await db.put('clients', targetClient);
  notifyChange();
  return targetClient;
}

export async function deleteClient(clientId: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('clients', clientId);
    notifyChange();
  } catch (err) {
    console.error('Error deleting client from IndexedDB', err);
  }
}

// ==================== ORDERS ====================

export async function getOrders(): Promise<Order[]> {
  try {
    const db = await getDB();
    const rawOrders = await db.getAll('orders');
    const rates = await getShippingRates();
    return rawOrders.map((o) => normalizeOrder(o, rates));
  } catch (err) {
    console.error('Error reading orders from IndexedDB', err);
    return [];
  }
}

export async function saveOrders(orders: Order[]): Promise<void> {
  try {
    const db = await getDB();
    const rates = await getShippingRates();
    const tx = db.transaction('orders', 'readwrite');
    await tx.objectStore('orders').clear();
    for (const order of orders) {
      await tx.objectStore('orders').put(normalizeOrder(order, rates));
    }
    await tx.done;
    notifyChange();
  } catch (err) {
    console.error('Error saving orders list to IndexedDB', err);
  }
}

export async function saveOrder(
  order: Partial<Order> & {
    clientId: string;
    shippingType: Order['shippingType'];
    orderDate: string;
    price?: number;
    packages?: OrderPackage[];
  }
): Promise<Order> {
  const db = await getDB();
  const rates = await getShippingRates();
  const now = new Date().toISOString();
  const today = now.split('T')[0];

  const defaultFee = order.shippingType && rates[order.shippingType as keyof ShippingRateConfig] !== undefined
    ? rates[order.shippingType as keyof ShippingRateConfig]
    : 0;

  const shippingCost = typeof order.shippingCost === 'number' ? order.shippingCost : defaultFee;

  let packages: OrderPackage[] = [];
  if (Array.isArray(order.packages) && order.packages.length > 0) {
    packages = order.packages.map((pkg, idx) => ({
      id: pkg.id || `${order.id || 'ord'}_pkg_${idx + 1}`,
      description: pkg.description !== undefined ? String(pkg.description) : '',
      price: Number(pkg.price) || 0,
      shippingType: pkg.shippingType !== undefined ? pkg.shippingType : order.shippingType,
      status: pkg.status || order.status || 'pendiente',
      photo: pkg.photo,
    }));
  } else {
    packages = [{
      id: `${order.id || 'ord'}_pkg_1`,
      description: order.description || '',
      price: Number(order.price) || 0,
      shippingType: order.shippingType || '',
      status: order.status || 'pendiente',
      photo: order.photo,
    }];
  }

  // Calculate order status dates
  const newStatus = order.status || 'pendiente';
  let readyDate = order.readyDate;
  let packagedDate = order.packagedDate;
  let shippedDate = order.shippedDate;

  if (newStatus === 'listo') {
    if (!readyDate) readyDate = today;
  } else if (newStatus === 'empaquetado') {
    if (!readyDate) readyDate = today;
    if (!packagedDate) packagedDate = today;
  } else if (newStatus === 'enviado') {
    if (!readyDate) readyDate = today;
    if (!packagedDate) packagedDate = today;
    if (!shippedDate) shippedDate = today;
  }

  // When order changes status, also update all packages' status to match
  packages = packages.map((pkg) => ({
    ...pkg,
    status: newStatus,
  }));

  const totalProductPrice = packages.reduce((sum, p) => sum + (Number(p.price) || 0), 0);

  let targetOrder: Order;

  if (order.id) {
    const existing = await db.get('orders', order.id);
    targetOrder = {
      ...(existing || {}),
      ...order,
      id: order.id,
      shippingAddress: order.shippingAddress !== undefined ? order.shippingAddress : (existing?.shippingAddress || ''),
      price: totalProductPrice,
      shippingCost,
      status: newStatus,
      readyDate,
      packagedDate,
      shippedDate,
      packages,
      updatedAt: now,
      createdAt: existing?.createdAt || order.createdAt || now,
    };
  } else {
    const newId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    targetOrder = {
      id: newId,
      description: order.description?.trim() || '',
      clientId: order.clientId,
      price: totalProductPrice,
      shippingCost,
      shippingAddress: order.shippingAddress?.trim() || '',
      isCustomAddress: order.isCustomAddress || false,
      shippingType: order.shippingType,
      orderDate: order.orderDate,
      photo: order.photo || packages[0]?.photo,
      status: newStatus,
      readyDate,
      packagedDate,
      shippedDate,
      packages: packages.map((pkg, idx) => ({ ...pkg, id: pkg.id || `${newId}_pkg_${idx + 1}` })),
      createdAt: now,
      updatedAt: now,
    };
  }

  await db.put('orders', targetOrder);
  notifyChange();
  return targetOrder;
}

export async function deleteOrder(orderId: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('orders', orderId);
    notifyChange();
  } catch (err) {
    console.error('Error deleting order from IndexedDB', err);
  }
}

// ==================== BACKUP & RESTORE ====================

export async function exportBackup(): Promise<AppDataBackup> {
  const clients = await getClients();
  const orders = await getOrders();
  const shippingRates = await getShippingRates();

  return {
    version: 3,
    exportedAt: new Date().toISOString(),
    clients,
    orders,
    shippingRates,
  };
}

export async function importBackup(
  backupData: AppDataBackup,
  mode: 'replace' | 'merge' = 'replace'
): Promise<{ clientsCount: number; ordersCount: number }> {
  if (!backupData || !Array.isArray(backupData.clients) || !Array.isArray(backupData.orders)) {
    throw new Error('El archivo no contiene un formato de copia de seguridad válido de Mis Pedidos.');
  }

  const db = await getDB();
  const currentRates = backupData.shippingRates || (await getShippingRates());

  // Save imported shipping rates if present
  if (backupData.shippingRates) {
    await db.put('settings', backupData.shippingRates, 'shipping_rates');
  }

  const tx = db.transaction(['clients', 'orders'], 'readwrite');
  const clientStore = tx.objectStore('clients');
  const orderStore = tx.objectStore('orders');

  if (mode === 'replace') {
    await clientStore.clear();
    await orderStore.clear();

    for (const client of backupData.clients) {
      await clientStore.put(client);
    }
    for (const order of backupData.orders) {
      await orderStore.put(normalizeOrder(order, currentRates));
    }

    await tx.done;
    notifyChange();

    return {
      clientsCount: backupData.clients.length,
      ordersCount: backupData.orders.length,
    };
  }

  // Merge mode
  for (const client of backupData.clients) {
    await clientStore.put(client);
  }
  for (const order of backupData.orders) {
    await orderStore.put(normalizeOrder(order, currentRates));
  }

  await tx.done;
  notifyChange();

  const totalClients = (await db.getAllKeys('clients')).length;
  const totalOrders = (await db.getAllKeys('orders')).length;

  return {
    clientsCount: totalClients,
    ordersCount: totalOrders,
  };
}

export async function clearAllData(): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(['clients', 'orders', 'settings'], 'readwrite');
    await tx.objectStore('clients').clear();
    await tx.objectStore('orders').clear();
    await tx.objectStore('settings').clear();
    await tx.done;

    localStorage.removeItem('mispedidos_clients');
    localStorage.removeItem('mispedidos_orders');
    localStorage.removeItem(MIGRATION_DONE_KEY);

    notifyChange();
  } catch (err) {
    console.error('Error clearing data from IndexedDB', err);
  }
}

export async function getEstimatedStorageSize(): Promise<string> {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      if (estimate.usage !== undefined) {
        return (estimate.usage / 1024).toFixed(1);
      }
    }
  } catch {
    // fallback
  }

  try {
    const db = await getDB();
    const clients = await db.getAll('clients');
    const orders = await db.getAll('orders');
    const totalBytes = JSON.stringify(clients).length + JSON.stringify(orders).length;
    return (totalBytes / 1024).toFixed(1);
  } catch {
    return '0';
  }
}
