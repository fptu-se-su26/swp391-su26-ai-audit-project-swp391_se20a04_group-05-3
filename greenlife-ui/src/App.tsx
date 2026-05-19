/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/src/components/layout/MainLayout';
import AdminLayout from '@/src/components/layout/AdminLayout';

import Home from '@/src/pages/public/Home';
import Shop from '@/src/pages/public/Shop';
import AIDiagnosis from '@/src/pages/public/AIDiagnosis';
import Services from '@/src/pages/public/Services';
import Blog from '@/src/pages/public/Blog';
import Cart from '@/src/pages/public/Cart';
import ProductDetail from '@/src/pages/public/ProductDetail';
import Auth from '@/src/pages/auth/Auth';

// Admin views will be implemented next
import AdminDashboard from '@/src/pages/admin/AdminDashboard';
// Using placeholders for other admin routes for now
const Placeholder = ({ title }: { title: string }) => <div className="p-8 bg-white rounded-3xl shadow-sm"><h2 className="text-xl font-bold">{title}</h2></div>;

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes with MainLayout (Navbar + Footer) */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/services" element={<Services />} />
          <Route path="/ai-diagnosis" element={<AIDiagnosis />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/product/:id" element={<ProductDetail />} />
        </Route>

        {/* Standalone Routes */}
        <Route path="/login" element={<Auth initialMode="login" />} />
        <Route path="/register" element={<Auth initialMode="register" />} />
        <Route path="/auth" element={<Navigate to="/login" replace />} />

        {/* Admin Routes with AdminLayout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="orders" element={<Placeholder title="Quản lý Đơn Hàng" />} />
          <Route path="products" element={<Placeholder title="Quản lý Sản Phẩm" />} />
          <Route path="bookings" element={<Placeholder title="Quản lý Đặt Lịch" />} />
          <Route path="users" element={<Placeholder title="Quản lý Khách Hàng" />} />
        </Route>
      </Routes>
    </Router>
  );
}
