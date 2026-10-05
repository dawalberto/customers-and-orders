import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Package, 
  BarChart3, 
  Database, 
  Boxes,
  Send
} from 'lucide-react';
import { Client, Order, ActiveTab, OrderPackage } from './types';
import { 
  getClients, 
  getOrders, 
  saveClient, 
  deleteClient, 
  saveOrder, 
  deleteOrder, 
  STORAGE_CHANGE_EVENT 
} from './services/storage';
import { ClientsView } from './components/clients/ClientsView';
import { OrdersView } from './components/orders/OrdersView';
import { ShippingView } from './components/shipping/ShippingView';
import { DashboardView } from './components/dashboard/DashboardView';
import { BackupView } from './components/backup/BackupView';
import { OrderModal } from './components/orders/OrderModal';
import { PWAInstallButton } from './components/common/PWAInstallButton';
import { OfflineIndicator } from './components/common/OfflineIndicator';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('orders');
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Filter & Navigation states
  const [filterClientIdForOrders, setFilterClientIdForOrders] = useState<string | null>(null);

  // Modals for creating order for a specific client
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);

  // Load data & handle URL hash routing
  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedClients, loadedOrders] = await Promise.all([
          getClients(),
          getOrders(),
        ]);
        setClients(loadedClients);
        setOrders(loadedOrders);
      } catch (err) {
        console.error('Error loading data from IndexedDB:', err);
      }
    };

    loadData();

    const checkRoute = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path.endsWith('/data') || hash === '#/data' || hash === '#data') {
        setActiveTab('data');
      } else if (hash === '#clients' || hash === '#/clients') {
        setActiveTab('clients');
      } else if (hash === '#shipping' || hash === '#/shipping') {
        setActiveTab('shipping');
      } else if (hash === '#dashboard' || hash === '#/dashboard') {
        setActiveTab('dashboard');
      } else if (hash === '#orders' || hash === '#/orders') {
        setActiveTab('orders');
      }
    };

    checkRoute();

    window.addEventListener(STORAGE_CHANGE_EVENT, loadData);
    window.addEventListener('storage', loadData);
    window.addEventListener('hashchange', checkRoute);
    window.addEventListener('popstate', checkRoute);

    return () => {
      window.removeEventListener(STORAGE_CHANGE_EVENT, loadData);
      window.removeEventListener('storage', loadData);
      window.removeEventListener('hashchange', checkRoute);
      window.removeEventListener('popstate', checkRoute);
    };
  }, []);

  const navigateToTab = (tab: ActiveTab, clearFilter = true) => {
    // REQUIREMENT: "Si en algún momento se llega a filtrar el listado de pedidos por cliente... cuando me voy de esa vista y regreso todavía se mantiene el filtro... Una vez se abandona esta vista y vuelvo manualmente a esta lista debería tener los filtros limpios"
    if (clearFilter) {
      setFilterClientIdForOrders(null);
    }
    setActiveTab(tab);
    if (tab === 'data') {
      window.location.hash = '#/data';
    } else {
      window.location.hash = `#/${tab}`;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToClientOrders = (clientId: string) => {
    setFilterClientIdForOrders(clientId);
    navigateToTab('orders', false);
  };

  const handleSaveClient = async (clientData: Partial<Client> & { name: string }) => {
    return await saveClient(clientData);
  };

  const handleDeleteClient = async (clientId: string) => {
    await deleteClient(clientId);
  };

  const handleSaveOrder = async (orderData: Partial<Order> & { clientId: string; shippingType: Order['shippingType']; orderDate: string; packages: OrderPackage[] }) => {
    await saveOrder(orderData);
  };

  const handleDeleteOrder = async (orderId: string) => {
    await deleteOrder(orderId);
  };

  const handleQuickCreateClient = async (clientData: Partial<Client> & { name: string }): Promise<Client> => {
    return await saveClient(clientData);
  };

  const pendingOrdersCount = orders.filter((o) => o.status === 'pendiente').length;

  return (
    <div className="min-h-screen bg-purple-50/20 text-slate-900 flex flex-col font-sans pb-8 overflow-x-hidden">
      {/* Top Header: | LOGO    P  C  E  A    B | as requested */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-purple-100 shadow-2xs">
        <div className="max-w-5xl mx-auto px-2 sm:px-6 py-2.5 flex items-center justify-between gap-1.5 sm:gap-4">
          {/* 1. LOGO: Jewelry box icon */}
          <button
            onClick={() => navigateToTab('orders', true)}
            className="w-10 h-10 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-purple-300 shadow-2xs hover:scale-105 active:scale-95 transition shrink-0"
            title="Mis Pedidos"
          >
            <Boxes className="w-5 h-5 text-purple-400" />
          </button>

          {/* 2. NAVBAR: Centered P - C - E - A */}
          <nav className="flex items-center gap-1 sm:gap-1.5 bg-purple-50/70 p-1 rounded-2xl border border-purple-100/90 shadow-2xs">
            {/* Pedidos (P) */}
            <button
              onClick={() => navigateToTab('orders', true)}
              className={`relative flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold transition active:scale-95 ${
                activeTab === 'orders'
                  ? 'bg-zinc-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-purple-900 hover:bg-white/80'
              }`}
              title="Pedidos"
            >
              <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 pointer-events-none" />
              <span className="hidden sm:inline pointer-events-none">Pedidos</span>
              <span className="sm:hidden font-extrabold pointer-events-none">P</span>
              {pendingOrdersCount > 0 && (
                <span className="pointer-events-none px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-black shadow-2xs">
                  {pendingOrdersCount}
                </span>
              )}
            </button>

            {/* Clientes (C) */}
            <button
              onClick={() => navigateToTab('clients', true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold transition active:scale-95 ${
                activeTab === 'clients'
                  ? 'bg-zinc-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-purple-900 hover:bg-white/80'
              }`}
              title="Clientes"
            >
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 pointer-events-none" />
              <span className="hidden sm:inline pointer-events-none">Clientes</span>
              <span className="sm:hidden font-extrabold pointer-events-none">C</span>
            </button>

            {/* Envíos (E) - NEW MENU OPTION */}
            <button
              onClick={() => navigateToTab('shipping', true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold transition active:scale-95 ${
                activeTab === 'shipping'
                  ? 'bg-zinc-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-purple-900 hover:bg-white/80'
              }`}
              title="Tarifas de Envío"
            >
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 -rotate-12 shrink-0 pointer-events-none" />
              <span className="hidden sm:inline pointer-events-none">Envíos</span>
              <span className="sm:hidden font-extrabold pointer-events-none">E</span>
            </button>

            {/* Análisis (A) */}
            <button
              onClick={() => navigateToTab('dashboard', true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold transition active:scale-95 ${
                activeTab === 'dashboard'
                  ? 'bg-zinc-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-purple-900 hover:bg-white/80'
              }`}
              title="Análisis"
            >
              <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 pointer-events-none" />
              <span className="hidden sm:inline pointer-events-none">Análisis</span>
              <span className="sm:hidden font-extrabold pointer-events-none">A</span>
            </button>
          </nav>

          {/* 3. RIGHT CONTROLS: PWA Install + B (Backup) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <PWAInstallButton />
            <button
              onClick={() => navigateToTab('data', true)}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl border transition active:scale-95 flex items-center justify-center shrink-0 ${
                activeTab === 'data'
                  ? 'bg-zinc-900 text-purple-300 border-zinc-900 shadow-2xs'
                  : 'bg-white text-slate-600 hover:text-purple-800 hover:bg-purple-50 border-slate-200'
              }`}
              title="Copias de seguridad / Datos (B)"
            >
              <Database className="w-4 h-4 pointer-events-none" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3.5 sm:px-6 pt-4 pb-8 overflow-x-hidden">
        {activeTab === 'clients' && (
          <ClientsView
            clients={clients}
            orders={orders}
            onSaveClient={handleSaveClient}
            onDeleteClient={handleDeleteClient}
            onNavigateToOrders={handleNavigateToClientOrders}
            onCreateOrderForClient={(clientId) => {
              setFilterClientIdForOrders(clientId);
              setIsNewOrderModalOpen(true);
            }}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersView
            orders={orders}
            clients={clients}
            onSaveOrder={handleSaveOrder}
            onDeleteOrder={handleDeleteOrder}
            onQuickCreateClient={handleQuickCreateClient}
            selectedClientId={filterClientIdForOrders}
            onClearClientFilter={() => setFilterClientIdForOrders(null)}
            onSelectClient={(cId) => {
              navigateToTab('clients', true);
            }}
          />
        )}

        {activeTab === 'shipping' && (
          <ShippingView orders={orders} />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            orders={orders}
            clients={clients}
            onSelectOrder={(orderId) => {
              navigateToTab('orders', true);
            }}
          />
        )}

        {activeTab === 'data' && (
          <BackupView
            onBackToApp={() => navigateToTab('orders', true)}
            clientsCount={clients.length}
            ordersCount={orders.length}
          />
        )}
      </main>

      {/* Modal for creating order from Client card */}
      <OrderModal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        onSave={handleSaveOrder}
        clients={clients}
        onQuickCreateClient={handleQuickCreateClient}
        preselectedClientId={filterClientIdForOrders || undefined}
      />

      {/* Non-intrusive Offline Indicator */}
      <OfflineIndicator />
    </div>
  );
}
