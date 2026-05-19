import { Leaf, Instagram, Facebook, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2 group text-white">
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-primary group-hover:rotate-12 transition-transform">
                <Leaf size={24} />
              </div>
              <span className="text-2xl font-bold tracking-tight">GreenLife</span>
            </Link>
            <p className="text-slate-400 leading-relaxed">
              Sứ mệnh của chúng tôi là mang thiên nhiên vào không gian sống của bạn, kết hợp công nghệ và tình yêu cây xanh.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-accent hover:text-primary transition-all">
                <Instagram size={20} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-accent hover:text-primary transition-all">
                <Facebook size={20} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-accent hover:text-primary transition-all">
                <Twitter size={20} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Khám Phá</h4>
            <ul className="space-y-4">
              <li><Link to="/shop" className="hover:text-accent transition-colors">Cửa Hàng</Link></li>
              <li><Link to="/services" className="hover:text-accent transition-colors">Dịch Vụ Chăm Sóc</Link></li>
              <li><Link to="/ai-diagnosis" className="hover:text-accent transition-colors">AI Chẩn Đoán</Link></li>
              <li><Link to="/blog" className="hover:text-accent transition-colors">Blog Cây Xanh</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Hỗ Trợ</h4>
            <ul className="space-y-4">
              <li><a href="#" className="hover:text-accent transition-colors">Chính Sách Giao Hàng</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Chính Sách Đổi Trả</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Hướng Dẫn Thanh Toán</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Câu Hỏi Thường Gặp</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Liên Hệ</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={20} className="text-accent shrink-0" />
                <span>123 Đường Cây Xanh, Quận 1, TP. Hồ Chí Minh</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={20} className="text-accent shrink-0" />
                <span>(028) 1234 5678</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={20} className="text-accent shrink-0" />
                <span>contact@greenlife.vn</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>© 2024 GreenLife. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-300">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
