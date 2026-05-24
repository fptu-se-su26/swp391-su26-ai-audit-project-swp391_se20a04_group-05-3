'use client';

import React from 'react';
import { ShoppingBag, Eye, Calendar, User, Search, Filter } from 'lucide-react';

export default function AdminOrders() {
  const orders = [
    { id: '#ORD-001', customer: 'Nguyễn Văn A', date: '19/05/2026', total: '450.000đ', status: 'Hoàn thành', email: 'vana@gmail.com' },
    { id: '#ORD-002', customer: 'Trần Thị B', date: '18/05/2026', total: '1.200.000đ', status: 'Đang xử lý', email: 'thib@gmail.com' },
    { id: '#ORD-003', customer: 'Lê Minh C', date: '18/05/2026', total: '150.000đ', status: 'Đang giao', email: 'minhc@gmail.com' },
    { id: '#ORD-004', customer: 'Phạm Văn D', date: '17/05/2026', total: '850.000đ', status: 'Đã hủy', email: 'vand@gmail.com' },
    { id: '#ORD-005', customer: 'Hoàng Thị E', date: '17/05/2026', total: '320.000đ', status: 'Hoàn thành', email: 'thie@gmail.com' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Hoàn thành': return 'bg-emerald-100 text-emerald-700';
      case 'Đang xử lý': return 'bg-amber-100 text-amber-700';
      case 'Đang giao': return 'bg-blue-100 text-blue-700';
      case 'Đã hủy': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Quản Lý Đơn Hàng</h2>
          <p className="text-slate-500 text-sm">Xem và cập nhật trạng thái đơn hàng mua cây xanh.</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm theo khách hàng, mã đơn..." 
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700">
            <Filter size={16} /> Lọc
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-6 font-bold">Mã Đơn</th>
                <th className="p-6 font-bold">Khách Hàng</th>
                <th className="p-6 font-bold">Ngày Đặt</th>
                <th className="p-6 font-bold">Tổng Tiền</th>
                <th className="p-6 font-bold">Trạng Thái</th>
                <th className="p-6 font-bold text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {orders.map((order, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-6 font-bold text-slate-900">{order.id}</td>
                  <td className="p-6">
                    <div>
                      <div className="font-bold text-slate-800">{order.customer}</div>
                      <div className="text-xs text-slate-400">{order.email}</div>
                    </div>
                  </td>
                  <td className="p-6 text-slate-500">{order.date}</td>
                  <td className="p-6 font-bold text-slate-900">{order.total}</td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    <button className="p-2 text-primary hover:text-white hover:bg-primary transition-all rounded-xl border border-slate-100 hover:border-primary shadow-sm inline-flex items-center gap-1.5 font-bold text-xs cursor-pointer">
                      <Eye size={14} /> Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
