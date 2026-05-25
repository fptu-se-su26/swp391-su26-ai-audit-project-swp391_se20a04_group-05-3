import React from "react";
import { ArrowUpRight, BrainCircuit, ShieldAlert, Award, ChevronRight, Sparkles, TrendingDown, Users } from "lucide-react";
import { Product } from "../types";

interface HomeViewProps {
  products: Product[];
  setCurrentPage: (page: string) => void;
  onSelectProduct: (p: Product) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  products,
  setCurrentPage,
  onSelectProduct,
}) => {
  const featured = products.slice(0, 3);

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden rounded-3xl bg-neutral-950 border border-stone-800 text-stone-100 p-8 sm:p-12 lg:p-16 shadow-2xl">
        {/* Background Ambient Decoratives */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-stone-900/40 rounded-full blur-2xl -z-10" />

        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <Sparkles className="h-3 w-3" />
            <span>XU THẾ ECO-TECH SANG TRỌNG 2026</span>
          </div>
          
          <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-white leading-[1.1]">
            Nâng tầm phong cách <br />
            <span className="text-emerald-400">Sống Xanh Thượng Lưu</span>
          </h1>
          
          <p className="text-stone-400 text-base sm:text-lg leading-relaxed max-w-2xl">
            GreenLife kết nối công nghệ trí tuệ nhân tạo độc bản của Google và các hợp tác xã nông nghiệp hữu cơ bản địa nhằm cung cấp giải pháp bác sĩ cây và nguồn dinh dưỡng sinh học hoàn hảo cho ngôi nhà hiện đại của bạn.
          </p>

          <div className="pt-4 flex flex-wrap gap-4">
            <button
              onClick={() => setCurrentPage("ai-diagnosis")}
              className="flex items-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl tracking-tight hover:shadow-lg hover:shadow-emerald-950/40 transition-all cursor-pointer"
            >
              <BrainCircuit className="h-5 w-5" />
              Chẩn Đoán Bệnh Lá AI Cây Trồng
            </button>
            <button
              onClick={() => setCurrentPage("shop")}
              className="flex items-center gap-2 px-6 py-3.5 bg-stone-800 hover:bg-stone-700 text-white border border-stone-700 rounded-xl font-medium transition-all cursor-pointer"
            >
              Xem Cửa Hàng Organic
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Sustainable National Metrics Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "-542,800 kg",
            desc: "Dấu chân carbon đã trung hòa",
            sub: "Đóng góp tương đương 24,000 cây xanh bản địa",
            icon: TrendingDown,
            color: "text-emerald-400"
          },
          {
            title: "28,450 Cây",
            desc: "Khám bệnh thành công qua AI",
            sub: "Tỷ lệ hồi sinh phục hồi sau 14 ngày đạt 94.2%",
            icon: BrainCircuit,
            color: "text-emerald-400"
          },
          {
            title: "18 Nhà Vườn",
            desc: "Đối tác liên kết Organic",
            sub: "Hỗ trợ thu mua bao tiêu sản lượng nông sản chất lượng",
            icon: Users,
            color: "text-emerald-400"
          },
          {
            title: "100% Sạch",
            desc: "Bao bì tự phân hủy sinh học",
            sub: "Chế tác hoàn toàn từ vật liệu cellulose tinh bột khoai",
            icon: Award,
            color: "text-emerald-400"
          }
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-stone-900/40 border border-stone-800/60 p-6 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-emerald-900/40 transition-all">
              <div className="flex justify-between items-start">
                <span className={`text-2xl sm:text-3xl font-display font-bold ${stat.color}`}>{stat.title}</span>
                <Icon className="h-5 w-5 text-stone-600" />
              </div>
              <div className="mt-4">
                <h4 className="font-semibold text-stone-200 text-sm tracking-tight">{stat.desc}</h4>
                <p className="text-stone-500 font-mono text-[10px] mt-1 leading-normal">{stat.sub}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Dual Highlights Call-to-Action (Mini Bento Grid) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Bento: AI Hospital */}
        <div className="bg-emerald-950/15 border border-emerald-900/30 p-8 rounded-3xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-emerald-500/5 rounded-full blur-2xl" />
          <div className="max-w-md space-y-3">
            <span className="text-xs text-emerald-400 font-mono tracking-widest uppercase">CÔNG NGHỆ CHẨN ĐOÁN</span>
            <h3 className="text-2xl font-display font-medium text-white tracking-tight">Trạm Cấp Cứu Thực Vật AI</h3>
            <p className="text-stone-400 text-sm leading-relaxed">
              Bạn băn khoăn khi chiếc lá hồng leo quý bỗng héo rụi hoặc sen đá có đốm thâm đen? Đừng lo lắng, hãy chụp và đăng tải ảnh ngay. Trí tuệ AI sẽ phân tích sinh học và gửi phác đồ phục hồi hữu cơ sau 3 giây.
            </p>
          </div>
          <div className="mt-8">
            <button
              onClick={() => setCurrentPage("ai-diagnosis")}
              className="inline-flex items-center gap-2 text-sm text-emerald-400 font-medium group hover:text-emerald-300 transition-colors cursor-pointer"
            >
              Chẩn đoán ngay bây giờ
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Right Bento: Expert Advisory */}
        <div className="bg-stone-900/50 border border-stone-800 p-8 rounded-3xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-stone-800 rounded-full blur-2xl" />
          <div className="max-w-md space-y-3">
            <span className="text-xs text-stone-400 font-mono tracking-widest uppercase">CỦA CHUYÊN GIA BẢN ĐỊA</span>
            <h3 className="text-2xl font-display font-medium text-white tracking-tight">Tư Vấn Thiết Kế Cảnh Quan</h3>
            <p className="text-stone-400 text-sm leading-relaxed">
              Đặt lịch tham vấn trực tuyến video hoặc gặp gỡ trực tiếp các Thạc sĩ sinh học thực vật và Kiến trúc sư hàng đầu Việt Nam để kiến tạo không gian ban công, vườn tự dưỡng sang trọng tốt lành nhất.
            </p>
          </div>
          <div className="mt-8">
            <button
              onClick={() => setCurrentPage("booking")}
              className="inline-flex items-center gap-2 text-sm text-emerald-400 font-medium group hover:text-emerald-300 transition-colors cursor-pointer"
            >
              Đặt lịch hẹn chuyên gia
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Featured Products Showcase */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-xs text-emerald-500 font-mono tracking-widest uppercase">DANH MỤC CURATED</span>
            <h2 className="text-3xl font-display font-bold text-white tracking-tight mt-1">Sản Phẩm Độc Bản Nổi Bật</h2>
          </div>
          <button
            onClick={() => setCurrentPage("shop")}
            className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
          >
            Tất cả sản phẩm <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((product) => (
            <div
              key={product.id}
              onClick={() => onSelectProduct(product)}
              className="group bg-stone-900/30 border border-stone-800 hover:border-stone-700 rounded-2xl overflow-hidden cursor-pointer transition-all hover:-translate-y-1 shadow-sm"
            >
              {/* Product Image */}
              <div className="relative h-56 bg-stone-950 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3 px-2 py-1 rounded bg-stone-900/95 border border-emerald-500/30 font-mono text-[10px] text-emerald-400">
                  ECO {product.ecoScore}%
                </div>
              </div>

              {/* Product Info */}
              <div className="p-5 space-y-3">
                <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest">{product.category}</span>
                <h3 className="font-sans font-medium text-stone-100 group-hover:text-emerald-400 transition-colors line-clamp-1">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-emerald-400 font-mono">
                    {product.price.toLocaleString("vi-VN")}₫
                  </span>
                  <span className="text-xs text-stone-400 bg-stone-800/40 px-2 py-0.5 rounded-md">
                    ⭐ {product.rating}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Brand Commitment Banner */}
      <section className="bg-stone-900/30 border border-stone-800 rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-center gap-8 justify-between">
        <div className="max-w-lg space-y-3">
          <h3 className="text-xl font-display font-bold text-white tracking-tight">Tôn chỉ canh tác không phát thải của GreenLife</h3>
          <p className="text-stone-400 text-sm leading-relaxed">
            Chúng tôi tự hào là đơn vị đầu tiên áp dụng mô hình liên minh phân hủy sinh học khép kín từ khâu thu gom, ủ trùn quế sinh học, chế biến tinh chất Neem ngừa côn trùng sâu bệnh, đóng gói trong bao màng tinh bột hữu cơ Việt Nam.
          </p>
        </div>
        <div className="flex items-center gap-6 border-l border-stone-800 md:pl-8">
          <div className="text-center">
            <span className="block text-3xl font-mono text-emerald-400 font-semibold">100%</span>
            <span className="text-xs text-stone-500">Thuần Hữu Cơ</span>
          </div>
          <div className="text-center">
            <span className="block text-3xl font-mono text-emerald-400 font-semibold">Zero</span>
            <span className="text-xs text-stone-500">Hóa chất Độc</span>
          </div>
          <div className="text-center">
            <span className="block text-3xl font-mono text-emerald-400 font-semibold">CO₂</span>
            <span className="text-xs text-stone-500">Giảm Phát Thải</span>
          </div>
        </div>
      </section>
    </div>
  );
};
