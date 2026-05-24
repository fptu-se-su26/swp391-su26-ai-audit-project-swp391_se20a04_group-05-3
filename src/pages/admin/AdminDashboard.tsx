import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, MoreVertical } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function AdminDashboard() {
  const stats = [
    { title: 'Tổng Doanh Thu', value: '124.500.000đ', trend: '+15%', isUp: true },
    { title: 'Đơn Hàng Mới', value: '45', trend: '+5%', isUp: true },
    { title: 'Khách Hàng', value: '1,204', trend: '-2%', isUp: false },
    { title: 'Sản Phẩm Tồn', value: '342', trend: '+1%', isUp: true },
  ];

  const recentOrders = [
    { id: '#ORD-001', customer: 'Nguyễn Văn A', date: '19/05/2026', total: '450.000đ', status: 'Hoàn thành' },
    { id: '#ORD-002', customer: 'Trần Thị B', date: '18/05/2026', total: '1.200.000đ', status: 'Đang xử lý' },
    { id: '#ORD-003', customer: 'Lê Minh C', date: '18/05/2026', total: '150.000đ', status: 'Đang giao' },
    { id: '#ORD-004', customer: 'Phạm Văn D', date: '17/05/2026', total: '850.000đ', status: 'Đã hủy' },
    { id: '#ORD-005', customer: 'Hoàng Thị E', date: '17/05/2026', total: '320.000đ', status: 'Hoàn thành' },
  ];

  const revenueData = [
    { name: 'T1', total: 45 },
    { name: 'T2', total: 52 },
    { name: 'T3', total: 38 },
    { name: 'T4', total: 65 },
    { name: 'T5', total: 84 },
    { name: 'T6', total: 70 },
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
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Tổng Quan Hệ Thống</h2>
        <p className="text-slate-500 text-sm">Theo dõi các chỉ số quan trọng của nền tảng GreenLife.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
          >
            <h3 className="text-sm font-bold text-slate-500 mb-2">{stat.title}</h3>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-black text-slate-900">{stat.value}</span>
              <span className={`flex items-center text-sm font-bold ${stat.isUp ? 'text-emerald-500' : 'text-red-500'}`}>
                {stat.isUp ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
                {stat.trend}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Doanh Thu 6 Tháng Gần Nhất (Triệu VNĐ)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="total" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Đơn Hàng Theo Nguồn</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Website', value: 65 },
                { name: 'App', value: 45 },
                { name: 'Cửa hàng', value: 30 }
              ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" fill="#22c55e" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">Đơn hàng gần đây</h2>
          <button className="text-primary font-bold text-sm hover:underline">Xem tất cả</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-6 font-bold">Mã Đơn</th>
                <th className="p-6 font-bold">Khách Hàng</th>
                <th className="p-6 font-bold">Ngày Đặt</th>
                <th className="p-6 font-bold">Tổng Tiền</th>
                <th className="p-6 font-bold">Trạng Thái</th>
                <th className="p-6 font-bold text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {recentOrders.map((order, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-6 font-bold text-slate-900">{order.id}</td>
                  <td className="p-6 text-slate-600">{order.customer}</td>
                  <td className="p-6 text-slate-500">{order.date}</td>
                  <td className="p-6 font-bold text-slate-900">{order.total}</td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-100">
                      <MoreVertical size={16} />
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
