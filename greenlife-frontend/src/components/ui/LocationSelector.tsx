import React from "react";
import { MapPin, Navigation } from "lucide-react";
import { useAppContext } from "../../context/AppContext";

const CITY_DISTRICTS: Record<string, string[]> = {
  "Đà Nẵng": ["Hải Châu", "Thanh Khê", "Sơn Trà", "Ngũ Hành Sơn", "Liên Chiểu", "Cẩm Lệ", "Hòa Vang"],
  "Hà Nội": ["Thạch Thất", "Cầu Giấy", "Hoàn Kiếm", "Đống Đa"],
  "Lâm Đồng": ["Đà Lạt", "Lạc Dương", "Bảo Lộc"]
};

export const LocationSelector: React.FC = () => {
  const { userLocation, setUserLocation } = useAppContext();

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const city = e.target.value;
    const districts = CITY_DISTRICTS[city] || [];
    const district = districts[0] || "";
    setUserLocation({
      city,
      district,
      address: `Quận ${district}, ${city}, Việt Nam`
    });
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const district = e.target.value;
    setUserLocation({
      ...userLocation,
      district,
      address: `${district}, ${userLocation.city}, Việt Nam`
    });
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserLocation({
      ...userLocation,
      address: e.target.value
    });
  };

  return (
    <div className="bg-stone-950 border border-stone-850 p-5 rounded-2xl space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-stone-850">
        <MapPin className="h-5 w-5 text-emerald-400" />
        <div>
          <h4 className="font-semibold text-xs text-stone-200 uppercase font-mono tracking-wider">
            Vị trí nhận hàng & dịch vụ
          </h4>
          <p className="text-[10px] text-stone-500">
            Hệ thống tự động lọc nhà vườn và chuyên gia gần nhất
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* City Select */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-stone-400 font-mono block">Tỉnh / Thành phố:</label>
          <select
            value={userLocation.city}
            onChange={handleCityChange}
            className="w-full bg-stone-900 text-stone-200 border border-stone-800 focus:border-emerald-500/50 rounded-xl py-2.5 px-3 text-xs focus:outline-none"
          >
            <option value="Đà Nẵng">Đà Nẵng (Mặc định)</option>
            <option value="Hà Nội">Hà Nội</option>
            <option value="Lâm Đồng">Lâm Đồng</option>
          </select>
        </div>

        {/* District Select */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-stone-400 font-mono block">Quận / Huyện:</label>
          <select
            value={userLocation.district}
            onChange={handleDistrictChange}
            className="w-full bg-stone-900 text-stone-200 border border-stone-800 focus:border-emerald-500/50 rounded-xl py-2.5 px-3 text-xs focus:outline-none"
          >
            {(CITY_DISTRICTS[userLocation.city] || []).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Street Address Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-stone-400 font-mono block">Địa chỉ chi tiết (Số nhà, tên đường):</label>
          <div className="relative">
            <input
              type="text"
              value={userLocation.address}
              onChange={handleAddressChange}
              placeholder="Ví dụ: 100 Lê Lợi"
              className="w-full bg-stone-900 text-stone-200 border border-stone-800 focus:border-emerald-500/50 rounded-xl py-2.5 pl-3 pr-10 text-xs focus:outline-none"
            />
            <Navigation className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
          </div>
        </div>
      </div>
    </div>
  );
};
