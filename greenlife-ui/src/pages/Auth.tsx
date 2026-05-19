import { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Github, Chrome as Google } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <main className="min-h-screen pt-20 flex items-center justify-center px-6 bg-nature-50 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-accent/20 rounded-full blur-[100px]" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl grid lg:grid-cols-2 bg-white rounded-[40px] shadow-2xl overflow-hidden relative z-10"
      >
        {/* Left Side: Content/Image */}
        <div className="hidden lg:flex flex-col justify-between p-16 bg-primary text-white relative">
          <div className="relative z-10">
            <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-primary mb-12 shadow-lg">
              <User size={28} />
            </div>
            <h1 className="text-4xl font-bold mb-6">Trải nghiệm không gian sống xanh cùng <span className="text-accent underline">GreenLife</span></h1>
            <p className="text-lg opacity-80 leading-relaxed mb-12">
              Gia nhập cộng đồng yêu cây xanh lớn nhất Việt Nam, nơi công nghệ và thiên nhiên hòa làm một.
            </p>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-accent">✓</div>
                <span className="font-medium">Chẩn đoán sức khỏe cây miễn phí bằng AI</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-accent">✓</div>
                <span className="font-medium">Ưu đãi lên tới 30% cho khách hàng mới</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-accent">✓</div>
                <span className="font-medium">Theo dõi lịch trình chăm sóc cá nhân hóa</span>
              </div>
            </div>
          </div>
          
          <div className="relative z-10 pt-12 flex items-center gap-4 opacity-50 text-sm">
            <p>© 2024 GreenLife Platform</p>
            <span>•</span>
            <p>Privacy Policy</p>
          </div>

          <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white rounded-full flex items-center justify-center">
                <div className="w-[600px] h-[600px] border border-white rounded-full flex items-center justify-center">
                  <div className="w-[400px] h-[400px] border border-white rounded-full" />
                </div>
             </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 lg:p-16 flex flex-col justify-center bg-white">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              {isLogin ? 'Chào mừng trở lại!' : 'Tạo tài khoản mới'}
            </h2>
            <p className="text-slate-500">
              {isLogin ? 'Vui lòng nhập thông tin để truy cập hệ thống.' : 'Bắt đầu hành trình xanh cùng chúng tôi hôm nay.'}
            </p>
          </div>

          <div className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? 'login' : 'register'}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {!isLogin && (
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="text"
                      placeholder="Họ và tên của bạn"
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-slate-50"
                    />
                  </div>
                )}
                
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="email"
                    placeholder="Địa chỉ Email"
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-slate-50"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="password"
                    placeholder="Mật khẩu"
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-slate-50"
                  />
                </div>

                {isLogin && (
                  <div className="flex justify-end">
                    <button className="text-sm font-bold text-primary hover:underline">Quên mật khẩu?</button>
                  </div>
                )}

                <button className="w-full btn-primary !py-4 !rounded-2xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group">
                  <span>{isLogin ? 'Đăng Nhập' : 'Tham Gia Ngay'}</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            </AnimatePresence>

            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Hoặc đăng nhập qua</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all font-bold text-slate-700">
                <Google size={20} className="text-red-500" />
                <span>Google</span>
              </button>
              <button className="flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all font-bold text-slate-700">
                <Github size={20} />
                <span>Github</span>
              </button>
            </div>
          </div>

          <p className="mt-10 text-center text-slate-500">
            {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 font-bold text-primary hover:underline"
            >
              {isLogin ? 'Đăng ký ngay' : 'Đăng nhập tại đây'}
            </button>
          </p>
        </div>
      </motion.div>
    </main>
  );
}
