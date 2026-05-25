import React, { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Landmark, ShoppingBag, Sprout, TrendingUp, Inbox, ShieldAlert, PlusCircle } from "lucide-react";
import { StoreOrder, Product } from "../types";
import { INITIAL_ORDERS } from "../data";

interface StoreDashboardViewProps {
  products: Product[];
  onAddProduct: (p: Product) => void;
}

export const StoreDashboardView: React.FC<StoreDashboardViewProps> = ({
  products,
  onAddProduct,
}) => {
  const [orders, setOrders] = useState<StoreOrder[]>(INITIAL_ORDERS);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState(150000);
  const [productCategory, setProductCategory] = useState<"plants" | "care" | "nutrients" | "smarthome">("plants");
  const [success, setSuccess] = useState(false);

  // Recharts Sales performance weekly dataset
  const chartData = [
    { name: "Thứ 2", DoanhThuVnd: 1200000, CarbonOffsetKg: 45 },
    { name: "Thứ 3", DoanhThuVnd: 1850000, CarbonOffsetKg: 60 },
    { name: "Thứ 4", DoanhThuVnd: 2400000, CarbonOffsetKg: 85 },
    { name: "Thứ 5", DoanhThuVnd: 1500000, CarbonOffsetKg: 50 },
    { name: "Thứ 6", DoanhThuVnd: 3800000, CarbonOffsetKg: 120 },
    { name: "Thứ 7", DoanhThuVnd: 4200000, CarbonOffsetKg: 150 },
    { name: "Chủ Nhật", DoanhThuVnd: 5120000, CarbonOffsetKg: 195 }
  ];

  const handleAddNewProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) return;

    const newProd: Product = {
      id: `prod-${Date.now()}`,
      name: productName,
      category: productCategory,
      price: productPrice,
      rating: 5.0,
      image: "https://images.unsplash.com/photo-1545241047-6083a3684587?w=600&auto=format&fit=crop&q=80",
      description: "Sản phẩm do nhà vườn đối tác chịu trách nhiệm chế tác sinh học, đã thông qua giám định hàm lượng carbon.",
      ecoScore: 90,
      details: ["Nguồn tự nhiên gieo trồng bản địa", "Bao bì hữu cơ tự hoại màng gạo"],
      specs: {
        "Nguồn gốc": "Liên minh Nông trại Ba Vì",
        "Dấu chân carbon": "-18kg CO2eq"
      },
      stock: 50
    };

    onAddProduct(newProd);
    setProductName("");
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "processing":
        return "bg-amber-950 text-amber-400 border border-amber-500/20";
      case "shipped":
        return "bg-indigo-950 text-indigo-400 border border-indigo-500/20";
      case "completed":
        return "bg-emerald-950 text-emerald-400 border border-emerald-500/20";
      default:
        return "bg-stone-900 text-stone-300 border border-stone-800";
    }
  };

  return (
    <div className="space-y-12 pb-20">
      
      {/* Intro Portal header */}
      <div className="space-y-2">
        <span className="text-xs text-emerald-500 font-mono tracking-widest uppercase">CỔNG THÔNG TIN ĐỐI TÁC</span>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight flex items-center gap-2">
          <Landmark className="h-8 w-8 text-emerald-400" />
          Kênh Quản Lý Nhà Vườn GreenPartner
        </h1>
        <p className="text-stone-400 text-sm max-w-2xl leading-relaxed">
          Quản trị lượng đặt đơn hàng hữu cơ, thống kê lượng carbon thải giảm quy đổi, và niêm yết thêm các dòng chế phẩm nông học tự nhiên lên sàn GreenLife.
        </p>
      </div>

      {/* Metrics Row */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { title: "20,070,000₫", desc: "Tổng Doanh Thu Tuần", icon: Landmark, sub: "+15.2% so với tháng trước" },
          { title: "705 kg CO₂", desc: "Carbon Đã Tích Lũy Bù Đắp", icon: Sprout, sub: "Được ghi nhận tại hệ thống Carbon Credit Việt Nam" },
          { title: products.length.toString(), desc: "Dòng Sản Phẩm Đang Bán", icon: ShoppingBag, sub: "100% đạt chuẩn Eco-Score > 85%" }
        ].map((met, idx) => {
          return (
            <div key={idx} className="bg-stone-900/45 p-6 rounded-2xl border border-stone-800 shadow-sm flex flex-col justify-between">
              <span className="text-stone-500 text-xs font-mono uppercase tracking-wider">{met.desc}</span>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-white tracking-tight">{met.title}</span>
              </div>
              <p className="text-[10px] text-emerald-400 font-mono mt-1">{met.sub}</p>
            </div>
          );
        })}
      </section>

      {/* Analytics Chart Block using recharts */}
      <div className="bg-stone-900/20 p-6 sm:p-8 rounded-3xl border border-stone-850 space-y-4">
        <h3 className="font-display font-semibold text-white text-sm tracking-wider uppercase flex items-center gap-2">
          <TrendingUp className="h-4.5 w-4.5 text-emerald-400" />
          Biểu Đồ Sức Bật Doanh Thu & Hệ Số Hấp Thụ Carbon Theo Tuần
        </h3>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#2e2e2e" strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#78716c" fontSize={11} tickLine={false} />
              <YAxis stroke="#78716c" fontSize={11} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#171717", borderColor: "#2e2e2e", borderRadius: "10px" }}
                labelStyle={{ color: "#a8a29e", fontSize: "11px", fontWeight: "bold" }}
                itemStyle={{ color: "#10b981", fontSize: "12px" }}
              />
              <Area type="monotone" dataKey="DoanhThuVnd" stroke="#10b981" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} name="Doanh Thu (VND)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Table of current orders */}
        <div className="lg:col-span-7 bg-[#141414] border border-[#242424] p-5 sm:p-6 rounded-3xl space-y-4">
          <h3 className="font-display font-semibold text-white text-sm tracking-wider uppercase flex items-center gap-2">
            <Inbox className="h-4.5 w-4.5 text-emerald-400" />
            Nhật Ký Giao Hàng & Đơn Mua
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-[#1b1b1b] border-b border-stone-800 text-stone-500 uppercase font-mono text-[9px] tracking-wider">
                <tr>
                  <th className="p-3">Mã Đơn</th>
                  <th className="p-3">Khách Hàng</th>
                  <th className="p-3">Tổng giá</th>
                  <th className="p-3 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/40">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-stone-900/20">
                    <td className="p-3 font-mono font-medium text-white">{ord.id}</td>
                    <td className="p-3">{ord.customerName}</td>
                    <td className="p-3 font-mono text-emerald-400">{ord.total.toLocaleString("vi-VN")}₫</td>
                    <td className="p-3 text-right">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-semibold text-right ${getStatusColor(ord.status)}`}>
                        {ord.status === "processing" ? "Đang Gói" : ord.status === "shipped" ? "Đang Giao" : "Hoàn Tất"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Add new product to GreenLife catalog sandbox */}
        <div className="lg:col-span-5 bg-stone-900/25 border border-stone-800 p-6 rounded-3xl space-y-4">
          <h3 className="font-display font-semibold text-white text-sm tracking-widest uppercase flex items-center gap-1.5">
            <PlusCircle className="h-4.5 w-4.5 text-emerald-400" />
            Niêm Yết Sản Phẩm Sinh Học Mới
          </h3>

          {success && (
            <div className="p-3 bg-emerald-950 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs">
              Đăng sản phẩm thành công! Đã qua kiểm định LCA và đưa lên sàn GreenMarket.
            </div>
          )}

          <form onSubmit={handleAddNewProductSubmit} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-stone-400 font-mono block">Tên mặt hàng hữu cơ:</label>
              <input
                type="text"
                placeholder="Ví dụ: Đất Sét Nung Sông Hồng vi sinh"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full bg-stone-950 text-stone-200 border border-stone-800 focus:border-emerald-500/50 rounded-xl py-2 px-3 text-xs focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-stone-400 font-mono block">Đơn giá VND:</label>
                <input
                  type="number"
                  value={productPrice}
                  onChange={(e) => setProductPrice(Number(e.target.value))}
                  className="w-full bg-stone-950 text-stone-200 border border-stone-800 focus:border-emerald-500/50 rounded-xl py-2 px-3 text-xs focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-stone-400 font-mono block">Nhóm ngành:</label>
                <select
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value as any)}
                  className="w-full bg-stone-950 text-stone-200 border border-stone-800 focus:border-emerald-500/50 rounded-xl py-2 px-3 text-xs focus:outline-none"
                >
                  <option value="plants">Cây Xanh</option>
                  <option value="care">Chăm Sóc</option>
                  <option value="nutrients">Dinh Dưỡng</option>
                  <option value="smarthome">Thiết Bị IoT</option>
                </select>
              </div>
            </div>

            <p className="text-[10px] text-stone-500 leading-normal">
              (*) Tất cả sản phẩm tải lên bắt buộc phải cam kết quy cách gieo trồng sạch tự nhiên và sử dụng màng đựng bằng bột ngô phân hủy sinh học của Hợp tác xã GreenLife.
            </p>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl text-xs cursor-pointer transition-all uppercase"
            >
              Phê Duyệt Niêm Yết Lên Sàn
            </button>
          </form>
        </div>
      </div>

    </div>
  );
};
