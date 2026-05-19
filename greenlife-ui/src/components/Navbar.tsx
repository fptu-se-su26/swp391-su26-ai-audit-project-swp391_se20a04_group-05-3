import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Leaf, ShoppingCart, User, Menu, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Trang Chủ', path: '/' },
    { name: 'Cửa Hàng', path: '/shop' },
    { name: 'Dịch Vụ', path: '/services' },
    { name: 'AI Chẩn Đoán', path: '/ai-diagnosis' },
    { name: 'Blog', path: '/blog' },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4',
        isScrolled ? 'glass py-3' : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform">
            <Leaf size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight text-primary">GreenLife</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                'nav-link',
                location.pathname === link.path && 'text-primary after:w-full'
              )}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-4">
          <button className="p-2 text-slate-600 hover:text-primary transition-colors">
            <Search size={20} />
          </button>
          <Link to="/cart" className="p-2 text-slate-600 hover:text-primary transition-colors relative">
            <ShoppingCart size={20} />
            <span className="absolute top-0 right-0 w-4 h-4 bg-accent text-[10px] font-bold text-primary flex items-center justify-center rounded-full">3</span>
          </Link>
          <Link to="/auth" className="btn-primary flex items-center gap-2 !px-5 !py-2">
            <User size={18} />
            <span>Đăng Nhập</span>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-primary"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-slate-100 overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'text-lg font-medium py-2',
                    location.pathname === link.path ? 'text-primary' : 'text-slate-600'
                  )}
                >
                  {link.name}
                </Link>
              ))}
              <hr className="border-slate-100 my-2" />
              <div className="flex gap-4">
                <Link to="/auth" className="btn-primary flex-1 text-center">Đăng Nhập</Link>
                <Link to="/cart" className="btn-secondary flex-1 text-center">Giỏ Hàng</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
