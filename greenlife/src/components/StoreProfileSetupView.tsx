import React, { useState } from "react";
import { Store, Phone, MapPin, Image, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { EcoStore } from "../types";

export const StoreProfileSetupView: React.FC = () => {
  const { currentUser, stores, addStore } = useAppContext();

  // Find if user already registered a store
  const myStore = stores.find((s) => s.ownerEmail === currentUser?.email);

  // Form states
  const [storeName, setStoreName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Đà Nẵng");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=500&auto=format&fit=crop&q=80");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSubmitting(true);

    setTimeout(() => {
      const newStore: EcoStore = {
        id: `store-${Date.now()}`,
        name: storeName,
        ownerName: currentUser.name,
        ownerEmail: currentUser.email,
        rating: 5.0,
        avatar: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=150&auto=format&fit=crop&q=80",
        bannerImage: imageUrl,
        address: `${address}, ${district}, ${city}, Việt Nam`,
        workingHours: "08:00 - 18:00 (Hằng ngày)",
        carbonOffsetKg: 0,
        productsCount: 0,
        verified: false, // Wait for admin review
        city: city,
        district: district,
        serviceArea: `${district}, ${city}`
      };

      addStore(newStore);
      setSubmitting(false);
    }, 1000);
  };

  // If already registered and waiting for approval
  if (myStore && !myStore.verified) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center text-stone-850 dark:text-stone-100">
        <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-8 sm:p-10 rounded-3xl space-y-6 shadow-md relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-amber-500" />
          
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-500 rounded-full flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-900/30">
            <AlertCircle className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-stone-900 dark:text-stone-100">Cửa hàng của bạn đang chờ Admin duyệt</h2>
            <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
              Hệ thống đã nhận hồ sơ đăng ký đối tác nhà vườn của bạn. Quy trình xác thực thông tin thực tế thường mất từ 12-24 giờ làm việc.
            </p>
          </div>

          <div className="bg-stone-100 dark:bg-stone-900/50 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 text-left space-y-3 text-xs">
            <h4 className="font-semibold text-stone-800 dark:text-stone-200 border-b border-stone-200 dark:border-stone-800 pb-2">Thông tin đăng ký của bạn:</h4>
            <div>
              <span className="text-stone-400 font-mono block text-[10px]">Tên cửa hàng:</span>
              <span className="font-bold text-stone-700 dark:text-stone-300">{myStore.name}</span>
            </div>
            <div>
              <span className="text-stone-400 font-mono block text-[10px]">Địa chỉ đăng ký:</span>
              <span className="text-stone-600 dark:text-stone-400">{myStore.address}</span>
            </div>
            <div>
              <span className="text-stone-400 font-mono block text-[10px]">Trạng thái kiểm duyệt:</span>
              <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded text-[10px] bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 font-bold font-mono">
                🟡 ĐANG CHỜ DUYỆT (PENDING)
              </span>
            </div>
          </div>

          <p className="text-[10px] text-stone-500 italic leading-normal">
            (*) Bạn tạm thời chưa thể niêm yết thêm sản phẩm mới hoặc thiết lập lịch đặt dịch vụ khảo sát cho đến khi được Ban quản lý phê duyệt chính thức.
          </p>
        </div>
      </div>
    );
  }

  // If already registered and verified (should go to dashboard, but just in case fallback rendering)
  if (myStore && myStore.verified) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-8 rounded-3xl space-y-6 shadow-sm">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-650 dark:text-emerald-450 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">Cửa hàng của bạn đã hoạt động</h2>
          <p className="text-xs text-stone-500">Đối tác GreenLife đã được phê duyệt. Hãy quay lại dashboard đối tác để bắt đầu đăng sản phẩm.</p>
        </div>
      </div>
    );
  }

  // Verification Form
  return (
    <div className="max-w-3xl mx-auto py-10 px-4 text-stone-800 dark:text-stone-100">
      <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-6 sm:p-8 rounded-3xl space-y-6 shadow-sm">
        
        {/* Form Intro Header */}
        <div className="border-b border-stone-200 dark:border-stone-850 pb-5">
          <span className="text-xs text-emerald-600 dark:text-emerald-500 font-mono tracking-wider uppercase font-semibold">BƯỚC 2: THIẾT LẬP THÔNG TIN KINH DOANH</span>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-stone-900 dark:text-stone-100 tracking-tight mt-1">
            Đăng Ký Xác Thực Cửa Hàng GreenLife
          </h1>
          <p className="text-xs text-stone-500 mt-2 leading-relaxed">
            Để bảo vệ cộng đồng và đảm bảo chất lượng, GreenLife yêu cầu đối tác xác minh nguồn gốc nhà vườn và thông tin định vị chi tiết trước khi bán hàng.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          
          {/* Tên cửa hàng */}
          <div className="space-y-1.5">
            <label className="text-stone-500 dark:text-stone-400 font-mono flex items-center gap-1.5 font-semibold">
              <Store className="h-4 w-4 text-stone-400" />
              Tên cửa hàng / Nhà vườn:
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Nhà Vườn Thảo Mộc Đô Thị GreenLife Sơn Trà"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full bg-stone-100 dark:bg-stone-900 text-stone-800 dark:text-stone-200 border border-stone-250 dark:border-stone-800 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-xs focus:outline-none"
              required
            />
          </div>

          {/* Điện thoại liên hệ */}
          <div className="space-y-1.5">
            <label className="text-stone-500 dark:text-stone-400 font-mono flex items-center gap-1.5 font-semibold">
              <Phone className="h-4 w-4 text-stone-400" />
              Số điện thoại chủ vườn:
            </label>
            <input
              type="tel"
              placeholder="Ví dụ: 0905123456"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-stone-100 dark:bg-stone-900 text-stone-800 dark:text-stone-200 border border-stone-250 dark:border-stone-800 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-xs focus:outline-none"
              required
            />
          </div>

          {/* Địa chỉ vị trí */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-stone-500 dark:text-stone-400 font-mono flex items-center gap-1.5 font-semibold">
                <MapPin className="h-4 w-4 text-stone-400" />
                Tỉnh / Thành phố:
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-stone-100 dark:bg-stone-900 text-stone-800 dark:text-stone-200 border border-stone-250 dark:border-stone-800 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-xs focus:outline-none"
              >
                <option value="Đà Nẵng">Đà Nẵng</option>
                <option value="Hà Nội">Hà Nội</option>
                <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                <option value="Lâm Đồng">Lâm Đồng</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-stone-500 dark:text-stone-400 font-mono flex items-center gap-1.5 font-semibold">
                <MapPin className="h-4 w-4 text-stone-400" />
                Quận / Huyện:
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Hải Châu"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-stone-100 dark:bg-stone-900 text-stone-800 dark:text-stone-200 border border-stone-250 dark:border-stone-800 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-xs focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Địa chỉ chi tiết */}
          <div className="space-y-1.5">
            <label className="text-stone-500 dark:text-stone-400 font-mono flex items-center gap-1.5 font-semibold">
              <MapPin className="h-4 w-4 text-stone-400" />
              Địa chỉ vườn chi tiết:
            </label>
            <input
              type="text"
              placeholder="Ví dụ: 120 Hoàng Diệu"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-stone-100 dark:bg-stone-900 text-stone-800 dark:text-stone-200 border border-stone-250 dark:border-stone-800 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-xs focus:outline-none"
              required
            />
          </div>

          {/* Mô tả cửa hàng */}
          <div className="space-y-1.5">
            <label className="text-stone-500 dark:text-stone-400 font-mono flex items-center gap-1.5 font-semibold">
              <FileText className="h-4 w-4 text-stone-400" />
              Mô tả nhà vườn & Nguồn gốc sản phẩm:
            </label>
            <textarea
              placeholder="Mô tả kỹ cách canh tác (ví dụ: gieo mầm hữu cơ tự nhiên, không hóa chất độc hại, cam kết túi đóng gói sinh học...)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-stone-100 dark:bg-stone-900 text-stone-800 dark:text-stone-200 border border-stone-250 dark:border-stone-800 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-xs focus:outline-none resize-none leading-relaxed"
              required
            />
          </div>

          {/* Ảnh cửa hàng */}
          <div className="space-y-1.5">
            <label className="text-stone-500 dark:text-stone-400 font-mono flex items-center gap-1.5 font-semibold">
              <Image className="h-4 w-4 text-stone-400" />
              Đường dẫn ảnh đại diện vườn (Mock Image URL):
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full bg-stone-100 dark:bg-stone-900 text-stone-800 dark:text-stone-200 border border-stone-250 dark:border-stone-800 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-xs focus:outline-none"
              required
            />
          </div>

          {/* Alert check */}
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900/10 rounded-xl text-[10px] text-stone-500 dark:text-stone-400 leading-normal">
            ⚠️ Bằng việc gửi yêu cầu xác thực, chủ vườn cam kết chịu trách nhiệm pháp lý về nguồn cung thực vật và phương thức gieo trồng sạch, sử dụng bao bì sinh học tự phân hủy.
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-stone-750 disabled:text-stone-500 text-black font-bold uppercase rounded-xl cursor-pointer transition-all tracking-wider text-xs"
          >
            {submitting ? "Đang gửi hồ sơ..." : "Gửi yêu cầu xác thực hồ sơ"}
          </button>

        </form>

      </div>
    </div>
  );
};
