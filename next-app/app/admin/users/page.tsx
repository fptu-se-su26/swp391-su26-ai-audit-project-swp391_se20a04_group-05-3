'use client';

import React from 'react';
import { Mail, Phone, MapPin, User, Search, Filter } from 'lucide-react';

export default function AdminUsers() {
  const users = [
    { name: 'Nguyễn Văn Hải', email: 'hai.nguyen@gmail.com', phone: '0905123456', ordersCount: 12, spent: '4.500.000đ', avatar: 'https://i.pravatar.cc/150?u=hai' },
    { name: 'Trần Thị Thúy', email: 'thuy.tran@gmail.com', phone: '0935987654', ordersCount: 8, spent: '2.800.000đ', avatar: 'https://i.pravatar.cc/150?u=thuy' },
    { name: 'Lê Minh Thành', email: 'thanh.le@gmail.com', phone: '0983111222', ordersCount: 5, spent: '1.250.000đ', avatar: 'https://i.pravatar.cc/150?u=thanh' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Quản Lý Khách Hàng</h2>
        <p className="text-slate-500 text-sm">Xem thông tin chi tiết và hành vi mua sắm của khách hàng.</p>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm theo họ tên, email, sđt..." 
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
          />
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-primary/10 border-4 border-slate-50 shadow-md mb-4 shrink-0">
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-1 group-hover:text-primary transition-colors">{user.name}</h3>
            <p className="text-sm text-slate-400 mb-6">{user.email}</p>

            <div className="w-full grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-sm">
              <div className="text-left">
                <span className="text-xs text-slate-400 block mb-0.5">Số đơn hàng</span>
                <span className="font-bold text-slate-900">{user.ordersCount} đơn</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block mb-0.5">Đã mua sắm</span>
                <span className="font-bold text-primary">{user.spent}</span>
              </div>
            </div>

            <div className="w-full mt-6 pt-4 border-t border-slate-50 flex flex-col gap-2 text-xs text-slate-500 text-left">
              <div className="flex items-center gap-2"><Phone size={14} className="text-slate-400 shrink-0" /> {user.phone}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
