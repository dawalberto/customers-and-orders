import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Package, 
  BarChart3, 
  Plus, 
  Database, 
  Sparkles,
  ShoppingBag,
  UserPlus,
  PackagePlus,
  ArrowRight
} from 'lucide-react';
import { Client, Order, ActiveTab } from './types';
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
import { DashboardView } from './components/dashboard/DashboardView';
import { BackupView } from './components/backup/BackupView';
import { ClientModal } from './components/clients/ClientModal';
import { OrderModal } from './components/orders/OrderModal';
import { PWAInstallButton } from './components/common/PWAInstallButton';
import { OfflineIndicator } from './components/common/OfflineIndicator';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('orders');
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Filter & Navigation states
  const [filterClientIdForOrders, setFilterClientIdForOrders] = useState<string | null>(null);

  // Modals for quick "+ Nuevo" action in header
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [quickNewDropdownOpen, setQuickNewDropdownOpen] = useState(false);

  // Load data & handle URL hash routing (e.g. #/data or /data)
  useEffect(() => {
    const loadData = () => {
      setClients(getClients());
      setOrders(getOrders());
    };

    loadData();

    // Check if initial URL points to /data or #/data
    const checkRoute = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/data' || hash === '#/data' || hash === '#data') {
        setActiveTab('data');
      } else if (hash === '#clients' || hash === '#/clients') {
        setActiveTab('clients');
      } else if (hash === '#dashboard' || hash === '#/dashboard') {
        setActiveTab('dashboard');
      } else if (hash === '#orders' || hash === '#/orders') {
        setActiveTab('orders');
      }
    };

    checkRoute();

    // Listen to reactive storage events
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

  const navigateToTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (tab === 'data') {
      window.location.hash = '#/data';
    } else {
      window.location.hash = `#/${tab}`;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigate to orders with client filter
  const handleNavigateToClientOrders = (clientId: string) => {
    setFilterClientIdForOrders(clientId);
    navigateToTab('orders');
  };

  // Save / Delete Client Handlers
  const handleSaveClient = (clientData: Partial<Client> & { name: string }) => {
    return saveClient(clientData);
  };

  const handleDeleteClient = (clientId: string) => {
    deleteClient(clientId);
  };

  // Save / Delete Order Handlers
  const handleSaveOrder = (orderData: Partial<Order> & { clientId: string; price: number; shippingType: Order['shippingType']; orderDate: string }) => {
    saveOrder(orderData);
  };

  const handleDeleteOrder = (orderId: string) => {
    deleteOrder(orderId);
  };

  // Quick Client creation helper (used when inside Order modal)
  const handleQuickCreateClient = (clientData: Partial<Client> & { name: string }): Client => {
    return saveClient(clientData);
  };

  // Count pending orders for badge in navigation
  const pendingOrdersCount = orders.filter((o) => o.status === 'pendiente').length;

  return (
    <div className="min-h-screen bg-rose-50/40 text-slate-800 flex flex-col font-sans pb-24 md:pb-12">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-rose-100 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          {/* Brand Logo & Name */}
          <div
            onClick={() => navigateToTab('orders')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-400 via-rose-400 to-pink-300 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-slate-800 text-base tracking-tight block leading-tight">
                MIS PEDIDOS
              </span>
              <span className="text-[10px] font-semibold text-rose-500 tracking-wide uppercase block">
                Pendientes & Bisutería
              </span>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1 bg-rose-50/60 p-1 rounded-2xl border border-rose-100/70">
            <button
              onClick={() => navigateToTab('orders')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'orders'
                  ? 'bg-white text-rose-800 shadow-xs'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Pedidos</span>
              {pendingOrdersCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-extrabold">
                  {pendingOrdersCount}
                </span>
              )}
            </button>
            <button
              onClick={() => navigateToTab('clients')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'clients'
                  ? 'bg-white text-rose-800 shadow-xs'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Clientes</span>
              {clients.length > 0 && (
                <span className="text-[11px] text-slate-400 font-semibold">
                  ({clients.length})
                </span>
              )}
            </button>
            <button
              onClick={() => navigateToTab('dashboard')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'dashboard'
                  ? 'bg-white text-rose-800 shadow-xs'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Análisis</span>
            </button>
          </nav>

          {/* Right Header Controls: PWA install button, Quick + Menu, Hidden /data link */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <PWAInstallButton />

            {/* Quick Add Button with dropdown */}
            <div className="relative">
              <button
                onClick={() => setQuickNewDropdownOpen(!quickNewDropdownOpen)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-2xs transition active:scale-95"
                title="Crear nuevo..."
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Nuevo</span>
              </button>

              {quickNewDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-rose-100 p-1.5 z-40 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setQuickNewDropdownOpen(false)}
                >
                  <button
                    onClick={() => setIsNewOrderModalOpen(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-900 rounded-xl transition text-left"
                  >
                    <PackagePlus className="w-4 h-4 text-rose-500" />
                    <span>Nuevo Pedido</span>
                  </button>
                  <button
                    onClick={() => setIsNewClientModalOpen(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-900 rounded-xl transition text-left"
                  >
                    <UserPlus className="w-4 h-4 text-rose-500" />
                    <span>Nuevo Cliente</span>
                  </button>
                </div>
              )}
            </div>

            {/* Hidden /data access icon */}
            <button
              onClick={() => navigateToTab('data')}
              className={`p-2 rounded-xl transition ${
                activeTab === 'data'
                  ? 'bg-rose-100 text-rose-700'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-rose-50'
              }`}
              title="Copias de seguridad / Datos (/data)"
            >
              <Database className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3.5 sm:px-6 pt-4 pb-8">
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
              navigateToTab('clients');
            }}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            orders={orders}
            clients={clients}
            onSelectOrder={(orderId) => {
              navigateToTab('orders');
            }}
          />
        )}

        {activeTab === 'data' && (
          <BackupView
            onBackToApp={() => navigateToTab('orders')}
            clientsCount={clients.length}
            ordersCount={orders.length}
          />
        )}
      </main>

      {/* Bottom Navigation Bar for Mobile (Smartphones) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-rose-100 shadow-lg px-2 py-3">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {/* Pedidos */}
          <button
            onClick={() => navigateToTab('orders')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition relative ${
              activeTab === 'orders'
                ? 'text-rose-600 font-bold'
                : 'text-slate-500 hover:text-rose-500'
            }`}
          >
            <div className="relative">
              <Package className="w-5 h-5" />
              {pendingOrdersCount > 0 && (
                <span className="absolute -top-1 -right-2.5 px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500 text-white font-extrabold shadow-2xs">
                  {pendingOrdersCount}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-0.5">Pedidos</span>
          </button>

          {/* Clientes */}
          <button
            onClick={() => navigateToTab('clients')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition ${
              activeTab === 'clients'
                ? 'text-rose-600 font-bold'
                : 'text-slate-500 hover:text-rose-500'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[11px] mt-0.5">Clientes</span>
          </button>

          {/* Análisis */}
          <button
            onClick={() => navigateToTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition ${
              activeTab === 'dashboard'
                ? 'text-rose-600 font-bold'
                : 'text-slate-500 hover:text-rose-500'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[11px] mt-0.5">Análisis</span>
          </button>
        </div>
      </nav>

      {/* Global Modals for Quick "+ Nuevo" */}
      <ClientModal
        isOpen={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
        onSave={handleSaveClient}
      />

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
