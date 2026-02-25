import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  CreditCard, 
  Calendar, 
  BarChart3, 
  LogOut, 
  Menu, 
  X,
  Wine
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Produtos', href: '/products', icon: Package },
    { name: 'PDV', href: '/pos', icon: ShoppingCart },
    { name: 'Clientes', href: '/customers', icon: Users },
    { name: 'Fiado', href: '/debts', icon: CreditCard },
    { name: 'Aluguéis', href: '/rentals', icon: Calendar },
    { name: 'Relatórios', href: '/reports', icon: BarChart3, adminOnly: true },
    { name: 'Configurações', href: '/settings', icon: Users, adminOnly: true },
  ];

  const filteredNav = navigation.filter(item => !item.adminOnly || user?.role === 'admin');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800 bg-zinc-900/50 backdrop-blur-xl fixed h-full z-10">
        <div className="p-6 flex items-center gap-3 border-b border-zinc-800">
          <div className="p-2 bg-yellow-500/10 rounded-lg">
            <Wine className="w-6 h-6 text-yellow-500" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
            Adega Premium
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {filteredNav.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                  isActive 
                    ? "bg-yellow-500/10 text-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.1)] border border-yellow-500/20" 
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-yellow-500" : "text-zinc-500 group-hover:text-zinc-300")} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-yellow-500">
              {user?.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-200 truncate">{user?.name}</p>
              <p className="text-xs text-zinc-500 truncate capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-2">
          <Wine className="w-6 h-6 text-yellow-500" />
          <span className="font-bold text-yellow-500">Adega Premium</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-zinc-400">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-zinc-950 z-10 pt-20 px-4">
          <nav className="space-y-2">
            {filteredNav.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-4 rounded-xl",
                  location.pathname === item.href 
                    ? "bg-yellow-500/10 text-yellow-500" 
                    : "text-zinc-400 hover:bg-zinc-900"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-4 text-red-400 hover:bg-zinc-900 rounded-xl mt-4"
            >
              <LogOut className="w-5 h-5" />
              Sair
            </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className={cn(
        "flex-1 min-h-screen transition-all duration-300",
        "md:ml-64", // Sidebar width
        "pt-16 md:pt-0" // Mobile header height
      )}>
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
