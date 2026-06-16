import React, { useState } from "react";
import { ArrowLeft, Leaf, ShieldCheck, Heart, ShoppingBag, Landmark, MessageSquare } from "lucide-react";
import { Product } from "../types";

interface ProductDetailViewProps {
  product: Product;
  onBackToShop: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  onBackToShop,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [potOption, setPotOption] = useState("classic-clay");
  const [soilAddon, setSoilAddon] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  // Hardcoded rich localized reviewer comments to support full premium layout authenticity
  const reviews = [
    {
      author: "Nguyễn Hải Đăng",
      date: "2026-05-18",
      rating: 5,
      comment: "Tuyệt vời, shop giao đóng gói có màng mỏng bao bọc gốm rất kỹ lưỡng. Đầm rễ chất xốp ẩm hoàn hảo, bón phân trùn quế cây sực nảy chồi sau có 1 tuần!"
    },
    {
      author: "Hoàng Vy Anh",
      date: "2026-05-12",
      rating: 4,
      comment: "Đã rinh chiếc cảm biến IoT Smart-Grow về cắm ở vườn ban công chung cư. Đồng bộ app mượt mà và đo chính xác lượng ánh nắng thực tế để dời sen đá kịp thời."
    }
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* Back to Catalog trigger */}
      <button
        onClick={onBackToShop}
        className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại tất cả sản phẩm
      </button>

      {/* Main Structural Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Columns - Image Presentation */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative aspect-square bg-stone-950 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-4 left-4 bg-emerald-950/95 border border-emerald-500/30 text-emerald-400 font-mono text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <Leaf className="h-4 w-4" />
              Chỉ số Thân Thiện: {product.ecoScore}%
            </div>
          </div>

          {/* Premium Ecology Commitment Card */}
          <div className="bg-stone-900/20 border border-stone-800 p-5 rounded-2xl space-y-3">
            <h4 className="text-xs text-stone-400 font-mono uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              BẢO CHỨNG SINH THÁI CO₂
            </h4>
            <p className="text-stone-300 text-xs leading-relaxed">
              Mỗi đơn hàng sản phẩm {product.name} đã được trung hòa hoàn toàn dấu chân Carbon từ vùng nguyên liệu gieo ươm Lâm Đồng về tới nội đô nhờ quy cách đóng gói sinh học.
            </p>
          </div>
        </div>

        {/* Right Columns - Details, Pricing & Customization controls */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <span className="text-xs text-emerald-400 font-mono tracking-widest uppercase">{product.category}</span>
            <h1 className="text-3xl sm:text-4xl font-display font-medium text-white tracking-tight">{product.name}</h1>
            
            {/* Rating Stars and stock count */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <div className="flex items-center gap-1 bg-stone-900 px-3 py-1 rounded-xl text-stone-200 text-sm">
                <span>⭐</span>
                <span className="font-mono font-semibold">{product.rating}</span>
              </div>
              <span className="text-xs font-mono text-stone-500">|</span>
              <span className="text-xs font-mono text-stone-400 bg-emerald-950/30 px-3 py-1 rounded-xl border border-emerald-900/20">
                Sẵn hàng: {product.stock} sản phẩm tại kho
              </span>
            </div>
          </div>

          <div className="border-t border-b border-stone-800/60 py-4">
            <span className="text-[10px] font-mono text-stone-500 block">Đơn giá niêm yết:</span>
            <span className="text-3xl font-bold font-mono text-emerald-400 block mt-1">
              {product.price.toLocaleString("vi-VN")}₫
            </span>
          </div>

          <p className="text-stone-300 text-sm leading-relaxed">
            {product.description}
          </p>

          {/* Interactive Custom Setup: Pottery Pot & Extra Organic Addon */}
          <div className="space-y-4 pt-2">
            {/* Custom Pot Selector */}
            {product.category === "plants" && (
              <div className="space-y-2">
                <label className="text-xs text-stone-400 font-mono block">Lựa chọn chậu đất gốm tinh xảo:</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "classic-clay", label: "Đất nung bản địa (Hữu cơ)", desc: "Màu gạch đỏ tự dưỡng hơi ẩm" },
                    { id: "bat-trang-glaze", label: "Men độc bản Bát Tràng (+30k)", desc: "Gốm nung mộc cao tịnh chảy men" }
                  ].map((pot) => (
                    <div
                      key={pot.id}
                      onClick={() => setPotOption(pot.id)}
                      className={`cursor-pointer p-3 rounded-xl border-2 transition-all ${
                        potOption === pot.id
                          ? "border-emerald-500 bg-emerald-950/25"
                          : "border-stone-800 bg-stone-950"
                      }`}
                    >
                      <h5 className="text-xs font-medium text-white">{pot.label}</h5>
                      <span className="text-[10px] text-stone-500 mt-1 block">{pot.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Specialized Substrate Matching Toggle */}
            <div className="space-y-2">
              <label className="text-xs text-stone-400 font-mono block">Tiện ích tối ưu sinh thái:</label>
              <div
                onClick={() => setSoilAddon(!soilAddon)}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                  soilAddon ? "border-emerald-500 bg-emerald-900/10" : "border-stone-800 bg-stone-950"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={soilAddon}
                    onChange={() => {}} // handled by parent div click
                    className="rounded border-stone-700 bg-stone-950 text-emerald-500 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-medium text-stone-200">Bổ sung Phân Trùn Khế bón gốc (+35.000đ)</span>
                    <p className="text-[10px] text-stone-500">Giúp rễ phát triển thần tốc chống thối nhũn ban đầu</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quantity selector & Add to cart trigger */}
          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-stone-800/40">
            <div className="flex items-center bg-stone-950 border border-stone-850 rounded-xl">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3.5 py-2 hover:bg-stone-850 text-stone-400 hover:text-white"
              >
                -
              </button>
              <span className="px-4 py-2 font-mono text-white text-sm">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3.5 py-2 hover:bg-stone-850 text-stone-400 hover:text-white"
              >
                +
              </button>
            </div>

            <button
              onClick={() => {
                // Adjust price if extra features are active
                let finalProduct = { ...product };
                if (soilAddon) {
                  finalProduct.price += 35000;
                  finalProduct.name += " (Kèm Phân trùn quế)";
                }
                onAddToCart(finalProduct, quantity);
              }}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl tracking-tight transition-transform active:scale-95 cursor-pointer"
            >
              <ShoppingBag className="h-5 w-5" />
              Thêm Vào Giỏ Hàng
            </button>

            <button
              onClick={() => setIsLiked(!isLiked)}
              className={`p-3 rounded-xl border transition-all ${
                isLiked
                  ? "bg-rose-950/30 border-rose-500 text-rose-500"
                  : "bg-stone-950 border-stone-800 text-stone-500 hover:text-rose-500"
              }`}
            >
              <Heart className="h-5 w-5 fill-current" />
            </button>
          </div>

          {/* Product Specifications & Logistics FAQ Tab */}
          <div className="pt-6 space-y-4">
            <h3 className="text-sm font-semibold tracking-tight text-white border-b border-stone-800 pb-2">Thông Số Kỹ Thuật Sinh Thái</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              {Object.entries(product.specs).map(([key, value]) => (
                <div key={key} className="flex justify-between p-2.5 bg-stone-900/30 rounded-lg border border-stone-850">
                  <span className="text-stone-500">{key}:</span>
                  <span className="text-stone-300 font-medium text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* User Reviews */}
          <div className="pt-6 space-y-4">
            <h3 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-400" />
              Nhận Xét Từ Cộng Đồng Sống Xanh ({reviews.length})
            </h3>
            
            <div className="space-y-3">
              {reviews.map((rev, idx) => (
                <div key={idx} className="bg-stone-900/10 border border-stone-800 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-stone-200 font-semibold">{rev.author}</span>
                    <span className="text-stone-500">{rev.date}</span>
                  </div>
                  <p className="text-stone-400 text-xs leading-relaxed">
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
