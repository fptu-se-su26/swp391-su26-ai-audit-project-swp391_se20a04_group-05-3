import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Leaf, Mail, Lock, User, ArrowRight, Github, Facebook } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface AuthProps {
  initialMode?: 'login' | 'register';
}

export default function Auth({ initialMode = 'login' }: AuthProps) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const navigate = useNavigate();

  useEffect(() => {
    setIsLogin(initialMode === 'login');
  }, [initialMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login/register
    setTimeout(() => {
      navigate('/');
    }, 1000);
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-center py-20 px-6 sm:px-10 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-72 h-72 bg-accent/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto w-full relative z-10 flex bg-white rounded-[40px] shadow-2xl overflow-hidden">
        
        {/* Left Form Section */}
        <div className="w-full lg:w-1/2 p-8 sm:p-12">
          <Link to="/" className="flex items-center gap-2 mb-12 group w-fit">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform">
              <Leaf size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight text-primary">GreenLife</span>
          </Link>

          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? 'login' : 'register'}
              initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                {isLogin ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}
              </h2>
              <p className="text-slate-500 mb-8">
                {isLogin 
                  ? 'Vui lòng đăng nhập để tiếp tục trải nghiệm mua sắm và các dịch vụ của GreenLife.'
                  : 'Tham gia cộng đồng GreenLife để nhận nhiều ưu đãi và kiến thức chăm sóc cây độc quyền.'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Họ và tên</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input 
                        type="text" 
                        required
                        placeholder="Nguyễn Văn A"
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                      type="email" 
                      required
                      placeholder="hello@greenlife.vn"
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Mật khẩu</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                {isLogin && (
                  <div className="flex justify-end">
                    <a href="#" className="text-sm font-bold text-primary hover:underline">Quên mật khẩu?</a>
                  </div>
                )}

                <button type="submit" className="w-full btn-primary !py-4 flex justify-center items-center gap-2 text-lg">
                  {isLogin ? 'Đăng Nhập' : 'Đăng Ký'} <ArrowRight size={20} />
                </button>
              </form>

              <div className="mt-8">
                <div className="relative flex items-center justify-center">
                  <div className="absolute border-t border-slate-200 w-full" />
                  <span className="bg-white px-4 text-sm text-slate-400 relative z-10">Hoặc tiếp tục với</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <button className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors font-medium text-slate-700">
                    <Github size={20} /> Github
                  </button>
                  <button className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors font-medium text-slate-700">
                    <Facebook size={20} className="text-blue-600" /> Facebook
                  </button>
                </div>
              </div>

              <div className="mt-10 text-center">
                <p className="text-slate-600">
                  {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
                  <button 
                    onClick={() => {
                      setIsLogin(!isLogin);
                      // Update URL implicitly without full reload
                      window.history.pushState({}, '', isLogin ? '/register' : '/login');
                    }} 
                    className="font-bold text-primary hover:underline"
                  >
                    {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
                  </button>
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Image Section */}
        <div className="hidden lg:block lg:w-1/2 relative bg-nature-50">
          <img 
            src="https://images.unsplash.com/photo-1416879598555-2d6d1d2b866c?auto=format&fit=crop&q=80&w=1200" 
            alt="Green leaves" 
            className="w-full h-full object-cover rounded-l-[80px]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-transparent flex flex-col justify-end p-12 rounded-l-[80px]">
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20">
              <h3 className="text-white text-2xl font-bold mb-4">Mỗi Cây Xanh Là Một Món Quà</h3>
              <p className="text-white/80 leading-relaxed">"Người trồng một cái cây là người biết yêu thương người khác." - Đăng ký tài khoản để bắt đầu hành trình xanh cùng chúng tôi.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
