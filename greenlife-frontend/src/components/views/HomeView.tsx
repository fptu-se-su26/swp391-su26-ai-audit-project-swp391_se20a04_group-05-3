import React, { useState } from "react";
import { ArrowUpRight, BrainCircuit, Award, ChevronRight, Sparkles, TrendingDown, Users, Leaf, Camera } from "lucide-react";
import { Product } from "../../types";


interface HomeViewProps {
  products: Product[];
  setCurrentPage: (page: string) => void;
  onSelectProduct: (p: Product) => void;
  onSearch: (query: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  products,
  setCurrentPage,
  onSelectProduct,
  onSearch,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter products based on active search
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featured = filteredProducts.slice(0, 3);


  return (
    <div className="space-y-16 pb-20">
      {/* Hero Banner Section with Greenhouse Background */}
      <section className="relative overflow-hidden rounded-3xl min-h-[460px] flex flex-col justify-center border border-stone-850 p-8 sm:p-12 lg:p-16 shadow-2xl bg-stone-950">
        {/* Greenhouse Background Cover Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 opacity-80" 
          style={{ 
            backgroundImage: `url("https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=1600&q=80")`,
          }}
        />
        {/* Dimmed Black Premium Overlay (Nền chìm) */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]" />

        {/* content container explicitly raised to z-10 */}
        <div className="relative z-10 max-w-3xl space-y-6 mx-auto text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/30 text-emerald-400 text-xs font-mono shadow-sm">
            <Sparkles className="h-3 w-3 animate-pulse" />
            <span>GREEN LIFE • HỆ SINH THÁI NHÀ KÍNH CÔNG NGHỆ CAO</span>
          </div>
          
          <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight text-white leading-tight text-center drop-shadow-xl">
            Kiến Tạo Không Gian Sống Xanh Thượng Lưu
          </h1>

          {/* Wireframe Mockup Search & AI Scan Bar Container */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              onSearch(searchQuery);
            }}
            className="w-full max-w-lg bg-stone-950/95 border border-stone-800 rounded-full p-1.5 flex items-center shadow-xl focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all"
          >
            {/* Round Logo Icon (Left) */}
            <div className="w-9 h-9 rounded-full bg-emerald-950 border border-emerald-500/30 flex items-center justify-center shrink-0 ml-1">
              <Leaf className="h-4.5 w-4.5 text-emerald-400" />
            </div>

            {/* Input Search Field (Middle) */}
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm cây cảnh, chậu cây, phân bón..."
              className="flex-1 bg-transparent border-0 px-3.5 text-xs text-white focus:outline-none focus:ring-0 placeholder-zinc-500"
            />

            {/* Chụp ảnh Button (Right) */}
            <button
              type="button"
              onClick={() => setCurrentPage("ai-diagnosis")}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-full transition-all cursor-pointer shadow-md shrink-0 mr-1"
            >
              <Camera className="h-3.5 w-3.5" />
              Chụp ảnh
            </button>
          </form>
          
          <p className="text-zinc-200 text-xs sm:text-sm leading-relaxed max-w-2xl text-center font-sans tracking-wide">
            GreenLife kết nối công nghệ AI chẩn đoán thực vật và các sản phẩm hữu cơ sinh học cao cấp phục vụ nhà kính tự dưỡng hiện đại của bạn.
          </p>
        </div>
      </section>

      {/* Sustainable National Metrics Section with Greenhouse background */}
      <section className="relative overflow-hidden rounded-3xl border border-stone-850 p-6 sm:p-8 shadow-xl bg-stone-950">
        {/* Greenhouse Background Cover Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 opacity-60 animate-pulse" 
          style={{ 
            backgroundImage: `url("https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=1200&q=80")`,
            animationDuration: '8s'
          }}
        />
        {/* Dimmed Overlay */}
        <div className="absolute inset-0 bg-black/75 backdrop-blur-[1px]" />
        
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <div key={idx} className="bg-stone-950/40 backdrop-blur-md border border-stone-800/40 p-6 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                <div className="flex justify-between items-start">
                  <span className={`text-2xl sm:text-3xl font-display font-bold ${stat.color}`}>{stat.title}</span>
                  <Icon className="h-5 w-5 text-zinc-400" />
                </div>
                <div className="mt-4">
                  <h4 className="font-semibold text-white text-sm tracking-tight">{stat.desc}</h4>
                  <p className="text-zinc-300 font-mono text-[10px] mt-1 leading-normal opacity-85">{stat.sub}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Dual Highlights Call-to-Action (Mini Bento Grid) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Bento: AI Hospital */}
        <div className="relative overflow-hidden border border-stone-850 p-8 rounded-3xl flex flex-col justify-between min-h-[300px] bg-stone-950">
          {/* Greenhouse Background Cover Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-all duration-700 opacity-60" 
            style={{ 
              backgroundImage: `url("https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=800&q=80")`,
            }}
          />
          {/* Dimmed Overlay */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px]" />
          
          <div className="relative z-10 max-w-md space-y-3">
            <span className="text-xs text-emerald-400 font-mono tracking-widest uppercase font-semibold">CÔNG NGHỆ CHẨN ĐOÁN</span>
            <h3 className="text-2xl font-display font-medium text-white tracking-tight">Trạm Cấp Cứu Thực Vật AI</h3>
            <p className="text-zinc-300 text-sm leading-relaxed">
              Bạn băn khoăn khi chiếc lá hồng leo quý bỗng héo rụi hoặc sen đá có đốm thâm đen? Đừng lo lắng, hãy chụp và đăng tải ảnh ngay. Trí tuệ AI sẽ phân tích sinh học và gửi phác đồ phục hồi hữu cơ sau 3 giây.
            </p>
          </div>
          <div className="relative z-10 mt-8">
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
        <div className="relative overflow-hidden border border-stone-850 p-8 rounded-3xl flex flex-col justify-between min-h-[300px] bg-stone-950">
          {/* Greenhouse Background Cover Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-all duration-700 opacity-60" 
            style={{ 
              backgroundImage: `url("https://images.unsplash.com/photo-1558603668-6570496b66f8?auto=format&fit=crop&w=800&q=80")`,
            }}
          />
          {/* Dimmed Overlay */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px]" />
          
          <div className="relative z-10 max-w-md space-y-3">
            <span className="text-xs text-emerald-400 font-mono tracking-widest uppercase font-semibold">CỦA CHUYÊN GIA BẢN ĐỊA</span>
            <h3 className="text-2xl font-display font-medium text-white tracking-tight">Tư Vấn Thiết Kế Cảnh Quan</h3>
            <p className="text-zinc-300 text-sm leading-relaxed">
              Đặt lịch tham vấn trực tuyến video hoặc gặp gỡ trực tiếp các Thạc sĩ sinh học thực vật và Kiến trúc sư hàng đầu Việt Nam để kiến tạo không gian ban công, vườn tự dưỡng sang trọng tốt lành nhất.
            </p>
          </div>
          <div className="relative z-10 mt-8">
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
            <span className="text-xs text-emerald-500 font-mono tracking-widest uppercase font-semibold">DANH MỤC CURATED</span>
            <h2 className="text-3xl font-display font-bold text-stone-100 tracking-tight mt-1">Sản Phẩm Độc Bản Nổi Bật</h2>
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
                  loading="lazy"
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
          <h3 className="text-xl font-display font-bold text-stone-100 tracking-tight">Tôn chỉ canh tác không phát thải của GreenLife</h3>
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
