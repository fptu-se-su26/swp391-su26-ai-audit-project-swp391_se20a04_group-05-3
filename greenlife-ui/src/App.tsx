/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import AIDiagnosis from './pages/AIDiagnosis';
import Services from './pages/Services';
import Auth from './pages/Auth';

// Placeholder components for other pages
const Placeholder = ({ title }: { title: string }) => (
  <div className="pt-40 pb-20 px-6 text-center min-h-screen bg-slate-50">
    <h1 className="text-4xl font-bold mb-4">{title}</h1>
    <p className="text-slate-500 transition-opacity">Tính năng này đang được phát triển. Vui lòng quay lại sau!</p>
  </div>
);

export default function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen overflow-x-hidden">
        <Navbar />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/services" element={<Services />} />
            <Route path="/ai-diagnosis" element={<AIDiagnosis />} />
            <Route path="/blog" element={<Placeholder title="Blog Cây Xanh" />} />
            <Route path="/cart" element={<Placeholder title="Giỏ Hàng" />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/product/:id" element={<Placeholder title="Chi tiết sản phẩm" />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}


