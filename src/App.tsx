import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Package, 
  BarChart3, 
  Plus, 
  Database, 
  Sparkles,
  UserPlus,
  PackagePlus
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

  // Load data & handle URL hash routing
  useEffect(() => {
    const loadData = () => {
      setClients(getClients());
      setOrders(getOrders());
    };

    loadData();

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

  const handleNavigateToClientOrders = (clientId: string) => {
    setFilterClientIdForOrders(clientId);
    navigateToTab('orders');
  };

  const handleSaveClient = (clientData: Partial<Client> & { name: string }) => {
    return saveClient(clientData);
  };

  const handleDeleteClient = (clientId: string) => {
    deleteClient(clientId);
  };

  const handleSaveOrder = (orderData: Partial<Order> & { clientId: string; price: number; shippingType: Order['shippingType']; orderDate: string }) => {
    saveOrder(orderData);
  };

  const handleDeleteOrder = (orderId: string) => {
    deleteOrder(orderId);
  };

  const handleQuickCreateClient = (clientData: Partial<Client> & { name: string }): Client => {
    return saveClient(clientData);
  };

  const pendingOrdersCount = orders.filter((o) => o.status === 'pendiente').length;

  return (
    <div className="min-h-screen bg-purple-50/20 text-slate-900 flex flex-col font-sans pb-24 md:pb-12 overflow-x-hidden">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-purple-100 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          {/* Brand Logo & Name */}
          <div
            onClick={() => navigateToTab('orders')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-9 h-9 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-purple-300 shadow-2xs group-hover:scale-105 transition">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <span className="font-black text-slate-950 text-base tracking-tight block leading-tight">
                MIS PEDIDOS
              </span>
              <span className="text-[10px] font-semibold text-purple-600 tracking-wider uppercase block">
                Pendientes & Bisutería
              </span>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1 bg-purple-50/50 p-1 rounded-2xl border border-purple-100">
            <button
              onClick={() => navigateToTab('orders')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'orders'
                  ? 'bg-zinc-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-purple-700'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Pedidos</span>
              {pendingOrdersCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-black">
                  {pendingOrdersCount}
                </span>
              )}
            </button>
            <button
              onClick={() => navigateToTab('clients')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'clients'
                  ? 'bg-zinc-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-purple-700'
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
                  ? 'bg-zinc-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-purple-700'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Análisis</span>
            </button>
          </nav>

          {/* Right Header Controls: PWA install, Quick + Menu, /data icon */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <PWAInstallButton />

            {/* Quick Add Button with dropdown */}
            <div className="relative">
              <button
                onClick={() => setQuickNewDropdownOpen(!quickNewDropdownOpen)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white shadow-2xs transition active:scale-95"
                title="Crear nuevo..."
              >
                <Plus className="w-3.5 h-3.5 text-purple-300" />
                <span className="hidden sm:inline">Nuevo</span>
              </button>

              {quickNewDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-purple-100 p-1.5 z-40 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setQuickNewDropdownOpen(false)}
                >
                  <button
                    onClick={() => setIsNewOrderModalOpen(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-purple-50 hover:text-purple-900 rounded-xl transition text-left"
                  >
                    <PackagePlus className="w-4 h-4 text-purple-600" />
                    <span>Nuevo Pedido</span>
                  </button>
                  <button
                    onClick={() => setIsNewClientModalOpen(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-purple-50 hover:text-purple-900 rounded-xl transition text-left"
                  >
                    <UserPlus className="w-4 h-4 text-purple-600" />
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
                  ? 'bg-purple-100 text-purple-800'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-purple-50'
              }`}
              title="Copias de seguridad / Datos (/data)"
            >
              <Database className="w-4 h-4" />
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

      {/* Bottom Navigation Bar for Mobile: Generous touch targets spanning the full column */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-purple-100/90 shadow-lg px-2 py-1">
        <div className="flex items-stretch justify-around max-w-md mx-auto h-14">
          {/* Pedidos Tab Button */}
          <button
            onClick={() => navigateToTab('orders')}
            className={`flex-1 flex flex-col items-center justify-center rounded-2xl transition active:scale-95 ${
              activeTab === 'orders'
                ? 'bg-purple-100/70 text-purple-900 font-bold'
                : 'text-slate-600 hover:text-purple-700'
            }`}
          >
            <div className="relative">
              <Package className="w-5 h-5" />
              {pendingOrdersCount > 0 && (
                <span className="absolute -top-1.5 -right-3 px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500 text-white font-black shadow-2xs">
                  {pendingOrdersCount}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-0.5 leading-none">Pedidos</span>
          </button>

          {/* Clientes Tab Button */}
          <button
            onClick={() => navigateToTab('clients')}
            className={`flex-1 flex flex-col items-center justify-center rounded-2xl transition active:scale-95 ${
              activeTab === 'clients'
                ? 'bg-purple-100/70 text-purple-900 font-bold'
                : 'text-slate-600 hover:text-purple-700'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[11px] mt-0.5 leading-none">Clientes</span>
          </button>

          {/* Análisis Tab Button */}
          <button
            onClick={() => navigateToTab('dashboard')}
            className={`flex-1 flex flex-col items-center justify-center rounded-2xl transition active:scale-95 ${
              activeTab === 'dashboard'
                ? 'bg-purple-100/70 text-purple-900 font-bold'
                : 'text-slate-600 hover:text-purple-700'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[11px] mt-0.5 leading-none">Análisis</span>
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
