'use client';

import React from 'react';
import { Calendar, User, Phone, MapPin, CheckCircle, Clock } from 'lucide-react';

export default function AdminBookings() {
  const bookings = [
    {
      id: 'BK-1002',
      customerName: 'Nguyễn Văn Hải',
      customerPhone: '0905123456',
      customerAddress: '123 Hùng Vương, Hải Châu, Đà Nẵng',
      serviceName: 'Thiết Kế Cảnh Quan',
      expertName: 'Nguyễn Văn A',
      date: '25/05/2026',
      time: '09:00',
      status: 'Chờ xác nhận',
    },
    {
      id: 'BK-1001',
      customerName: 'Trần Thị Thúy',
      customerPhone: '0935987654',
      customerAddress: '45 Lê Lợi, Hải Châu, Đà Nẵng',
      serviceName: 'Dịch Vụ Chăm Sóc Định Kỳ',
      expertName: 'Trần Thị B',
      date: '24/05/2026',
      time: '14:30',
      status: 'Đã xác nhận',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Quản Lý Đặt Lịch</h2>
        <p className="text-slate-500 text-sm">Quản lý lịch hẹn tư vấn và chăm sóc cây của khách hàng.</p>
      </div>

      {/* Bookings List */}
      <div className="grid gap-6">
        {bookings.map((booking) => (
          <div key={booking.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">{booking.id}</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${booking.status === 'Đã xác nhận' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {booking.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{booking.serviceName}</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2"><User size={16} className="text-slate-400" /> <span className="font-medium text-slate-900">{booking.customerName}</span></div>
                <div className="flex items-center gap-2"><Phone size={16} className="text-slate-400" /> {booking.customerPhone}</div>
                <div className="flex items-center gap-2 col-span-2 sm:col-span-1 lg:col-span-2"><MapPin size={16} className="text-slate-400" /> {booking.customerAddress}</div>
              </div>
            </div>

            <div className="lg:border-l border-slate-100 lg:pl-8 flex flex-col justify-center gap-3 shrink-0 lg:w-80">
              <div className="flex items-center gap-2 text-sm text-slate-600"><Calendar size={16} className="text-primary" /> Ngày hẹn: <span className="font-bold text-slate-900">{booking.date}</span></div>
              <div className="flex items-center gap-2 text-sm text-slate-600"><Clock size={16} className="text-primary" /> Giờ hẹn: <span className="font-bold text-slate-900">{booking.time}</span></div>
              <div className="text-sm text-slate-600">Chuyên gia: <span className="font-bold text-slate-900">{booking.expertName}</span></div>
              {booking.status === 'Chờ xác nhận' && (
                <button className="w-full mt-2 py-2.5 bg-primary hover:bg-emerald-600 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-primary/10 flex justify-center items-center gap-2 cursor-pointer">
                  <CheckCircle size={16} /> Xác nhận lịch hẹn
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
