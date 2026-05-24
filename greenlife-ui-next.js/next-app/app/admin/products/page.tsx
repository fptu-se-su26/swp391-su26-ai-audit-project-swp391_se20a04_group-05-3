'use client';

import React from 'react';
import { plants } from '@/lib/mockData';
import { Plus, Edit2, Trash2, Image as ImageIcon, Search } from 'lucide-react';

export default function AdminProducts() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Quản Lý Sản Phẩm</h2>
          <p className="text-slate-500 text-sm">Quản lý kho hàng cây cảnh và sen đá của hệ thống.</p>
        </div>
        <button className="btn-primary !py-2.5 !px-5 flex items-center gap-2 text-sm cursor-pointer shrink-0">
          <Plus size={16} /> Thêm sản phẩm mới
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm tên cây xanh..." 
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-6 font-bold">Hình ảnh</th>
                <th className="p-6 font-bold">Tên Cây</th>
                <th className="p-6 font-bold">Tên khoa học</th>
                <th className="p-6 font-bold">Phân Loại</th>
                <th className="p-6 font-bold">Đơn Giá</th>
                <th className="p-6 font-bold text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {plants.map((plant) => (
                <tr key={plant.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-6">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner shrink-0">
                      <img src={plant.image} alt={plant.name} className="w-full h-full object-cover" />
                    </div>
                  </td>
                  <td className="p-6 font-bold text-slate-900">{plant.name}</td>
                  <td className="p-6 text-slate-500 italic font-serif">{plant.scientificName}</td>
                  <td className="p-6">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                      {plant.category === 'indoor' ? 'Trong nhà' : plant.category === 'outdoor' ? 'Ngoài trời' : plant.category === 'succulent' ? 'Sen đá' : 'Văn phòng'}
                    </span>
                  </td>
                  <td className="p-6 font-black text-slate-900">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(plant.price)}
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 transition-colors rounded-xl border border-slate-200 shadow-sm cursor-pointer">
                        <Edit2 size={14} />
                      </button>
                      <button className="p-2 text-red-500 hover:text-white hover:bg-red-500 hover:border-red-500 transition-colors rounded-xl border border-slate-200 shadow-sm cursor-pointer">
                        <Trash2 size={14} />
                      </button>
                    </div>
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
