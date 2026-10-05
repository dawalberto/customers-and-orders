import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Client, Order, AppDataBackup } from '../types';

const DB_NAME = 'mispedidos_db';
const DB_VERSION = 1;
const MIGRATION_DONE_KEY = 'mispedidos_migrated_to_idb';
export const STORAGE_CHANGE_EVENT = 'mispedidos_data_change';

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
}

let dbPromise: Promise<IDBPDatabase<MisPedidosDBSchema>> | null = null;

function notifyChange() {
  window.dispatchEvent(new CustomEvent(STORAGE_CHANGE_EVENT));
}

/**
 * Initializes and returns the IndexedDB instance.
 * Automatically handles migration from localStorage if previous data exists.
 */
export async function getDB(): Promise<IDBPDatabase<MisPedidosDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<MisPedidosDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create clients object store
        if (!db.objectStoreNames.contains('clients')) {
          const clientStore = db.createObjectStore('clients', { keyPath: 'id' });
          clientStore.createIndex('by_name', 'name');
          clientStore.createIndex('by_date', 'clientDate');
        }

        // Create orders object store
        if (!db.objectStoreNames.contains('orders')) {
          const orderStore = db.createObjectStore('orders', { keyPath: 'id' });
          orderStore.createIndex('by_client', 'clientId');
          orderStore.createIndex('by_date', 'orderDate');
          orderStore.createIndex('by_status', 'status');
        }
      },
    }).then(async (db) => {
      // Perform seamless one-time migration from localStorage
      await checkAndMigrateFromLocalStorage(db);
      return db;
    });
  }
  return dbPromise;
}

/**
 * Automatically migrates existing localStorage data into IndexedDB without loss.
 */
async function checkAndMigrateFromLocalStorage(db: IDBPDatabase<MisPedidosDBSchema>) {
  try {
    const isMigrated = localStorage.getItem(MIGRATION_DONE_KEY);
    const rawClients = localStorage.getItem('mispedidos_clients');
    const rawOrders = localStorage.getItem('mispedidos_orders');

    // Only run if not already migrated or if IndexedDB is empty but localStorage has data
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
            await ordersStore.put(order);
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

// ==================== CLIENTS ====================

export async function getClients(): Promise<Client[]> {
  try {
    const db = await getDB();
    const clients = await db.getAll('clients');
    // Sort descending by createdAt or clientDate
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
    return await db.getAll('orders');
  } catch (err) {
    console.error('Error reading orders from IndexedDB', err);
    return [];
  }
}

export async function saveOrders(orders: Order[]): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction('orders', 'readwrite');
    await tx.objectStore('orders').clear();
    for (const order of orders) {
      await tx.objectStore('orders').put(order);
    }
    await tx.done;
    notifyChange();
  } catch (err) {
    console.error('Error saving orders list to IndexedDB', err);
  }
}

export async function saveOrder(order: Partial<Order> & { clientId: string; price: number; shippingType: Order['shippingType']; orderDate: string }): Promise<Order> {
  const db = await getDB();
  const now = new Date().toISOString();

  let targetOrder: Order;

  if (order.id) {
    const existing = await db.get('orders', order.id);
    if (existing) {
      targetOrder = {
        ...existing,
        ...order,
        updatedAt: now,
      };
    } else {
      targetOrder = {
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
    }
  } else {
    targetOrder = {
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

  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    clients,
    orders,
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
      await orderStore.put(order);
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
    await orderStore.put(order);
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
    const tx = db.transaction(['clients', 'orders'], 'readwrite');
    await tx.objectStore('clients').clear();
    await tx.objectStore('orders').clear();
    await tx.done;

    // Also clear localStorage backup flags
    localStorage.removeItem('mispedidos_clients');
    localStorage.removeItem('mispedidos_orders');
    localStorage.removeItem(MIGRATION_DONE_KEY);

    notifyChange();
  } catch (err) {
    console.error('Error clearing data from IndexedDB', err);
  }
}

/**
 * Calculates current estimated storage size in KB using modern navigator.storage API
 */
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

  // Fallback estimation
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
