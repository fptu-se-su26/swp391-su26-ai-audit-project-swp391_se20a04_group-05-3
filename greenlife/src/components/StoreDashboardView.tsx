import React, { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Landmark, ShoppingBag, Sprout, TrendingUp, Inbox, ShieldAlert, PlusCircle, MapPin, Save, Settings } from "lucide-react";
import { StoreOrder, Product } from "../types";
import { INITIAL_ORDERS } from "../data";
import { useAppContext } from "../context/AppContext";

interface StoreDashboardViewProps {
  products: Product[];
  onAddProduct: (p: Product) => void;
}

export const StoreDashboardView: React.FC<StoreDashboardViewProps> = ({
  products,
  onAddProduct,
}) => {
  const { stores, updateStoreInfo } = useAppContext();
  const [orders, setOrders] = useState<StoreOrder[]>(INITIAL_ORDERS);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState(150000);
  const [productCategory, setProductCategory] = useState<"plants" | "care" | "nutrients" | "smarthome">("plants");
  const [success, setSuccess] = useState(false);

  // Store Management Settings
  const [selectedManageStoreId, setSelectedManageStoreId] = useState(stores[0]?.id || "store-3");
  const managedStore = useMemo(() => {
    return stores.find((s) => s.id === selectedManageStoreId) || stores[0];
  }, [stores, selectedManageStoreId]);

  // Form states for Store settings
  const [storeName, setStoreName] = useState(managedStore?.name || "");
  const [storeCity, setStoreCity] = useState(managedStore?.city || "");
  const [storeDistrict, setStoreDistrict] = useState(managedStore?.district || "");
  const [storeAddress, setStoreAddress] = useState(managedStore?.address || "");
  const [storeServiceArea, setStoreServiceArea] = useState(managedStore?.serviceArea || "");
  const [storeLat, setStoreLat] = useState(managedStore?.latitude || 16.0);
  const [storeLng, setStoreLng] = useState(managedStore?.longitude || 108.0);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Sync form states when managed store selection changes
  React.useEffect(() => {
    if (managedStore) {
      setStoreName(managedStore.name);
      setStoreCity(managedStore.city);
      setStoreDistrict(managedStore.district);
      setStoreAddress(managedStore.address);
      setStoreServiceArea(managedStore.serviceArea || "Bán kính 10km");
      setStoreLat(managedStore.latitude || 16.0);
      setStoreLng(managedStore.longitude || 108.0);
    }
  }, [managedStore]);

  const handleStoreSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managedStore) return;

    updateStoreInfo(managedStore.id, {
      name: storeName,
      city: storeCity,
      district: storeDistrict,
      address: storeAddress,
      serviceArea: storeServiceArea,
      latitude: Number(storeLat),
      longitude: Number(storeLng)
    });

    setSettingsSuccess(true);
    setTimeout(() => setSettingsSuccess(false), 3000);
  };

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
        "Nguồn gốc": "Liên minh Nông trại Ba Ba",
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
    <div className="space-y-12 pb-20 text-stone-100">
      
      {/* Intro Portal header */}
      <div className="space-y-2">
        <span className="text-xs text-emerald-500 font-mono tracking-widest uppercase font-semibold">CỔNG THÔNG TIN ĐỐI TÁC</span>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-stone-100 tracking-tight flex items-center gap-2">
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
            <div key={idx} className="bg-stone-950 p-6 rounded-2xl border border-stone-850 shadow-sm flex flex-col justify-between">
              <span className="text-stone-500 text-xs font-mono uppercase tracking-wider">{met.desc}</span>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-stone-100 tracking-tight">{met.title}</span>
              </div>
              <p className="text-[10px] text-emerald-400 font-mono mt-1">{met.sub}</p>
            </div>
          );
        })}
      </section>

      {/* Analytics Chart Block using recharts */}
      <div className="bg-stone-950 p-6 sm:p-8 rounded-3xl border border-stone-850 space-y-4">
        <h3 className="font-display font-semibold text-stone-100 text-sm tracking-wider uppercase flex items-center gap-2">
          <TrendingUp className="h-4.5 w-4.5 text-emerald-400" />
          Biểu Đồ Sức Bật Doanh Thu & Hệ Số Hấp Thụ Carbon Theo Tuần
        </h3>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--emerald-500)" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="var(--emerald-500)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--stone-850)" strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="var(--stone-500)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--stone-500)" fontSize={11} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: "var(--stone-950)", borderColor: "var(--stone-850)", borderRadius: "12px" }}
                labelStyle={{ color: "var(--stone-400)", fontSize: "11px", fontWeight: "bold" }}
                itemStyle={{ color: "var(--emerald-400)", fontSize: "12px" }}
              />
              <Area type="monotone" dataKey="DoanhThuVnd" stroke="var(--emerald-500)" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2.5} name="Doanh Thu (VND)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Table of current orders */}
        <div className="lg:col-span-7 bg-stone-950 border border-stone-850 p-5 sm:p-6 rounded-3xl space-y-4">
          <h3 className="font-display font-semibold text-stone-100 text-sm tracking-wider uppercase flex items-center gap-2">
            <Inbox className="h-4.5 w-4.5 text-emerald-400" />
            Nhật Ký Giao Hàng & Đơn Mua
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-900 border-b border-stone-850 text-stone-500 uppercase font-mono text-[9px] tracking-wider">
                <tr>
                  <th className="p-3">Mã Đơn</th>
                  <th className="p-3">Khách Hàng</th>
                  <th className="p-3">Tổng giá</th>
                  <th className="p-3 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-850">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-stone-900/40">
                    <td className="p-3 font-mono font-medium text-stone-100">{ord.id}</td>
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

        {/* Right: Forms Stack */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Form 1: Niêm Yết sản phẩm */}
          <div className="bg-stone-950 border border-stone-850 p-6 rounded-3xl space-y-4">
            <h3 className="font-display font-semibold text-stone-100 text-sm tracking-widest uppercase flex items-center gap-1.5">
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
                  className="w-full bg-stone-900 text-stone-200 border border-stone-800 focus:border-emerald-500/50 rounded-xl py-2 px-3 text-xs focus:outline-none"
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
                    className="w-full bg-stone-900 text-stone-200 border border-stone-800 focus:border-emerald-500/50 rounded-xl py-2 px-3 text-xs focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-stone-400 font-mono block">Nhóm ngành:</label>
                  <select
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value as any)}
                    className="w-full bg-stone-900 text-stone-200 border border-stone-800 focus:border-emerald-500/50 rounded-xl py-2 px-3 text-xs focus:outline-none"
                  >
                    <option value="plants">Cây Xanh</option>
                    <option value="care">Chăm Sóc</option>
                    <option value="nutrients">Dinh Dưỡng</option>
                    <option value="smarthome">Thiết Bị IoT</option>
                  </select>
                </div>
              </div>

              <p className="text-[10px] text-stone-500 leading-normal">
                (*) Tất cả sản phẩm tải lên bắt buộc phải cam kết quy cách gieo trồng sạch tự nhiên và sử dụng bao bì bằng bột ngô tự phân hủy.
              </p>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl text-xs cursor-pointer transition-all uppercase"
              >
                Phê Duyệt Niêm Yết Lên Sàn
              </button>
            </form>
          </div>

          {/* Form 2: Store coordinates & address settings */}
          <div className="bg-stone-950 border border-stone-850 p-6 rounded-3xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-semibold text-stone-100 text-sm tracking-widest uppercase flex items-center gap-1.5">
                <Settings className="h-4.5 w-4.5 text-emerald-400" />
                Vị Trí & Khu Vực Giao Hàng
              </h3>
              
              <select
                value={selectedManageStoreId}
                onChange={(e) => setSelectedManageStoreId(e.target.value)}
                className="bg-stone-900 text-[10px] text-stone-300 border border-stone-800 py-1 px-2 rounded focus:outline-none"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name.replace("Nhà Vườn ", "")}</option>
                ))}
              </select>
            </div>

            {settingsSuccess && (
              <div className="p-3 bg-emerald-950 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs">
                Cập nhật thông tin định vị nhà vườn thành công!
              </div>
            )}

            <form onSubmit={handleStoreSettingsSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-stone-400 font-mono block">Tên Nhà Vườn Partner:</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full bg-stone-900 text-stone-200 border border-stone-800 focus:border-emerald-500/50 rounded-xl py-2 px-3 text-xs focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-stone-400 font-mono block">Thành phố:</label>
                  <select
                    value={storeCity}
                    onChange={(e) => setStoreCity(e.target.value)}
                    className="w-full bg-stone-900 text-stone-200 border border-stone-800 focus:border-emerald-500/50 rounded-xl py-2 px-3 text-xs focus:outline-none"
                  >
                    <option value="Đà Nẵng">Đà Nẵng</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="Lâm Đồng">Lâm Đồng</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-stone-400 font-mono block">Quận / Huyện:</label>
                  <input
                    type="text"
                    value={storeDistrict}
                    onChange={(e) => setStoreDistrict(e.target.value)}
                    className="w-full bg-stone-900 text-stone-200 border border-stone-800 focus:border-emerald-500/50 rounded-xl py-2 px-3 text-xs focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-stone-400 font-mono block">Địa chỉ kho chi tiết:</label>
                <input
                  type="text"
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  className="w-full bg-stone-900 text-stone-200 border border-stone-800 focus:border-emerald-500/50 rounded-xl py-2 px-3 text-xs focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-stone-400 font-mono block">Khu vực phục vụ (Service Area):</label>
                  <input
                    type="text"
                    value={storeServiceArea}
                    onChange={(e) => setStoreServiceArea(e.target.value)}
                    className="w-full bg-stone-900 text-stone-200 border border-stone-800 focus:border-emerald-500/50 rounded-xl py-2 px-3 text-xs focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-stone-400 font-mono block">Kinh độ (Lng):</label>
                    <input
                      type="number"
                      step="any"
                      value={storeLng}
                      onChange={(e) => setStoreLng(Number(e.target.value))}
                      className="w-full bg-stone-900 text-stone-200 border border-stone-800 focus:border-emerald-500/50 rounded-xl py-2 px-1 text-xs focus:outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-stone-400 font-mono block">Vĩ độ (Lat):</label>
                    <input
                      type="number"
                      step="any"
                      value={storeLat}
                      onChange={(e) => setStoreLat(Number(e.target.value))}
                      className="w-full bg-stone-900 text-stone-200 border border-stone-800 focus:border-emerald-500/50 rounded-xl py-2 px-1 text-xs focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl text-xs cursor-pointer transition-all uppercase flex items-center justify-center gap-1.5"
              >
                <Save className="h-4 w-4" />
                Cập Nhật Định Vị Nhà Vườn
              </button>
            </form>
          </div>

        </div>
      </div>

    </div>
  );
};
