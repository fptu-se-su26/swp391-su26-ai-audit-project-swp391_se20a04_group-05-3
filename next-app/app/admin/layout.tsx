'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Package, ShoppingBag, CalendarCheck, Settings, LogOut, Search, Bell, Leaf } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const currentPath = usePathname();

  const isActive = (path: string) => currentPath === path;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex-shrink-0 sticky top-0 h-screen overflow-y-auto hidden md:flex flex-col">
        <div className="p-6 pb-2">
          <Link href="/" className="flex items-center gap-2 group w-fit">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform">
              <span className="font-bold">GL</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-primary">GreenLife</span>
          </Link>
        </div>

        <div className="p-6 flex-1">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Quản lý</h2>
          <nav className="space-y-2">
            <Link 
              href="/admin"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${isActive('/admin') ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <LayoutDashboard size={20} /> Tổng Quan
            </Link>
            <Link 
              href="/admin/orders"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${isActive('/admin/orders') ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <ShoppingBag size={20} /> Đơn Hàng
            </Link>
            <Link 
              href="/admin/products"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${isActive('/admin/products') ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Package size={20} /> Sản Phẩm
            </Link>
            <Link 
              href="/admin/bookings"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${isActive('/admin/bookings') ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <CalendarCheck size={20} /> Đặt Lịch
            </Link>
            <Link 
              href="/admin/users"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${isActive('/admin/users') ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Users size={20} /> Khách Hàng
            </Link>
          </nav>

          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 mt-8">Hệ thống</h2>
          <nav className="space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-slate-600 hover:bg-slate-50 cursor-pointer">
              <Settings size={20} /> Cài Đặt
            </button>
            <Link href="/" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-red-500 hover:bg-red-50 mt-auto">
              <LogOut size={20} /> Đăng Xuất
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden flex flex-col h-screen overflow-y-auto">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 z-10">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Tìm kiếm..." 
                className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50 focus:bg-white transition-colors"
              />
            </div>
            <button className="p-2 relative text-slate-400 hover:text-slate-700 bg-white rounded-full border border-slate-200 shadow-sm shrink-0">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden border-2 border-white shadow-sm shrink-0">
              <img src="https://i.pravatar.cc/150?u=admin" alt="Admin" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6 md:p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
