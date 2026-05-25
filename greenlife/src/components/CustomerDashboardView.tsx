import React, { useState, useMemo } from "react";
import { User, Landmark, Sun, Activity, Sparkles, Sprout, Wind, FileText, Calendar, ShieldAlert } from "lucide-react";
import { Appointment, DiagnosisLog } from "../types";

interface CustomerDashboardViewProps {
  appointments: Appointment[];
  diagnosisLogs: DiagnosisLog[];
  setCurrentPage: (page: string) => void;
}

export const CustomerDashboardView: React.FC<CustomerDashboardViewProps> = ({
  appointments,
  diagnosisLogs,
  setCurrentPage,
}) => {
  // Simulator inputs state for eco house
  const [gardenArea, setGardenArea] = useState(6); // in m2
  const [solarCapacity, setSolarCapacity] = useState(300); // in Wp
  const [compostPerWeek, setCompostPerWeek] = useState(4); // in kg

  // Live calculated metrics
  const simResults = useMemo(() => {
    // Basic ecological formulary
    const solarGen = Math.round(solarCapacity * 3.8 * 30 / 1000); // kWh approx per month
    const co2Reduced = Math.round((solarGen * 0.8) + (gardenArea * 1.5) + (compostPerWeek * 52 * 1.2 / 12)); // kg CO2 per month
    const moneySavedCompost = compostPerWeek * 15000 * 4; // organic fertilizer cost savings
    const moneySavedSolar = solarGen * 2500; // estimated EVN electricity price savings
    const moneySavedTotal = moneySavedSolar + moneySavedCompost + (gardenArea * 20000);

    return {
      solarGen,
      co2Reduced,
      moneySavedTotal,
    };
  }, [gardenArea, solarCapacity, compostPerWeek]);

  return (
    <div className="space-y-12 pb-20">
      
      {/* Profile summary banner */}
      <div className="bg-neutral-950 border border-stone-850 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/[0.03] rounded-full blur-3xl -z-10" />
        
        <div className="flex gap-4 items-center">
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/20 rounded-2xl text-emerald-400">
            <User className="h-8 w-8" />
          </div>
          <div>
            <div className="inline-flex gap-1.5 items-center px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-medium">
              ⭐ THÀNH VIÊN VIP
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-medium text-white tracking-tight mt-1.5">Nguyễn Hoàng Long</h2>
            <p className="text-xs text-stone-500 font-mono">ID: GL-CUST-83921 • Điểm Carbon: <strong className="text-emerald-400">4,250 CPT</strong></p>
          </div>
        </div>

        <div className="flex gap-4 border-t md:border-t-0 md:border-l border-stone-800 pt-4 md:pt-0 md:pl-8 text-center md:text-left">
          <div>
            <span className="text-[10px] text-stone-500 font-mono block">Carbon Tích Lũy:</span>
            <span className="text-2xl font-bold text-emerald-400 font-mono block mt-1">-342.5 kg CO2</span>
            <span className="text-[10px] text-stone-500">Đã đóng góp cho Quỹ trồng rừng miền Trung</span>
          </div>
        </div>
      </div>

      {/* Main Structural Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Dynamic Ecology Savings Simulator */}
        <div className="lg:col-span-6 bg-stone-900/20 border border-stone-850 p-6 sm:p-8 rounded-3xl space-y-6">
          <div className="space-y-1">
            <div className="inline-flex gap-2 items-center text-xs text-emerald-400 font-mono uppercase font-semibold">
              <Sun className="h-4 w-4" />
              Simulate Net-Zero Home
            </div>
            <h3 className="text-xl font-display font-bold text-white tracking-tight">Trình Giả Lập Ngôi Nhà Không Phát Thải</h3>
            <p className="text-stone-400 text-xs leading-relaxed">
              Kéo các thanh trượt bên dưới để đo lường khả năng giảm khí thải nhà kính và tiết kiệm chất xốp tiền túi lý thuyết của gia đình bạn khi áp dụng quy chuẩn xanh.
            </p>
          </div>

          <div className="space-y-6 pt-4 border-t border-stone-800">
            {/* Input Slider 1 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-300 font-mono">Dự án Vườn Ban Công Xanh rộng</span>
                <span className="text-emerald-400 font-semibold font-mono">{gardenArea} m²</span>
              </div>
              <input
                type="range"
                min={2}
                max={50}
                value={gardenArea}
                onChange={(e) => setGardenArea(Number(e.target.value))}
                className="w-full accent-emerald-500 h-1 bg-stone-950 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-stone-500 block">Lọc khí oxi, cân bằng bức xạ nhiệt bê tông</span>
            </div>

            {/* Input Slider 2 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-300 font-mono">Pin Mặt Trời Ban Công mini</span>
                <span className="text-emerald-400 font-semibold font-mono">{solarCapacity} Wp</span>
              </div>
              <input
                type="range"
                min={0}
                max={1200}
                step={50}
                value={solarCapacity}
                onChange={(e) => setSolarCapacity(Number(e.target.value))}
                className="w-full accent-emerald-500 h-1 bg-stone-950 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-stone-500 block">Tự sản xuất điện xanh sạc điện thoại & camera vườn</span>
            </div>

            {/* Input Slider 3 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-300 font-mono">Ủ rác hữu cơ bằng Trùn Quế</span>
                <span className="text-emerald-400 font-semibold font-mono">{compostPerWeek} kg/tuần</span>
              </div>
              <input
                type="range"
                min={0}
                max={20}
                value={compostPerWeek}
                onChange={(e) => setCompostPerWeek(Number(e.target.value))}
                className="w-full accent-emerald-500 h-1 bg-stone-950 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-stone-500 block">Hạn chế chôn lấp hữu cơ rác nhà bếp sinh thối rữa</span>
            </div>
          </div>

          {/* Realtime dynamic calculated results scoreboard */}
          <div className="bg-stone-950 rounded-2xl p-5 border border-stone-850 text-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center sm:text-left space-y-1">
              <span className="text-[10px] text-stone-500 block">Điện xanh sinh sản:</span>
              <span className="text-lg font-bold font-mono text-emerald-400">{simResults.solarGen} kWh/tháng</span>
            </div>
            <div className="text-center sm:text-left space-y-1">
              <span className="text-[10px] text-stone-500 block">Khí carbon giảm thiểu:</span>
              <span className="text-lg font-bold font-mono text-emerald-400">-{simResults.co2Reduced} kg CO₂/tháng</span>
            </div>
            <div className="text-center sm:text-left space-y-1">
              <span className="text-[10px] text-stone-500 block">Tiền tiết kiệm thu hồi:</span>
              <span className="text-lg font-bold font-mono text-emerald-400">{simResults.moneySavedTotal.toLocaleString("vi-VN")}đ/tháng</span>
            </div>
          </div>
        </div>

        {/* Right Side - Custom orders list & diagnoses reminders */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-stone-900/10 border border-stone-800 p-6 rounded-3xl space-y-4">
            <h3 className="font-display font-semibold text-white text-sm flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-emerald-400" />
              Lịch Hẹn Hội Chẩn Đã Đặt Đăng Ký
            </h3>

            {appointments.length === 0 ? (
              <div className="py-8 text-center text-stone-500 text-xs">
                Chưa có cuộc hẹn khảo sát ban công nào được ký nhận.
                <button 
                  onClick={() => setCurrentPage("booking")}
                  className="block mt-2 text-emerald-400 text-xs hover:underline mx-auto font-medium"
                >
                  Tìm đặt cuộc hẹn cùng kỹ sư
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.slice(0, 2).map((apt) => (
                  <div key={apt.id} className="p-4 bg-stone-950/80 rounded-2xl border border-stone-850 flex justify-between items-center text-xs">
                    <div>
                      <h4 className="font-semibold text-stone-200">{apt.expertName}</h4>
                      <p className="text-[10px] text-stone-500 mt-1 font-mono">🗓️ {apt.date} lúc {apt.time}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-500/20">
                      Xác nhận
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-stone-900/10 border border-stone-800 p-6 rounded-3xl space-y-4">
            <h3 className="font-display font-semibold text-white text-sm flex items-center gap-2">
              <Activity className="h-4.5 w-4.5 text-emerald-400" />
              Lịch Sử Chẩn Đoán Bác Sĩ Lá AI Gần Đây
            </h3>

            {diagnosisLogs.length === 0 ? (
              <div className="py-8 text-center text-stone-500 text-xs">
                Bạn chưa kiểm tra bệnh đốm vàng lá cây nào bằng camera AI.
                <button 
                  onClick={() => setCurrentPage("ai-diagnosis")}
                  className="block mt-2 text-emerald-400 text-xs hover:underline mx-auto font-medium"
                >
                  Chụp ảnh chẩn đoán thử ngay
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {diagnosisLogs.slice(0, 2).map((log) => (
                  <div key={log.id} className="p-4 bg-stone-950/80 rounded-2xl border border-stone-850 flex justify-between items-center text-xs">
                    <div>
                      <h4 className="font-semibold text-stone-200 line-clamp-1">{log.diseaseName}</h4>
                      <p className="text-[10px] text-stone-500 mt-1">Đối tượng: {log.plantName}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] bg-rose-950 text-rose-400 border border-rose-500/10 shrink-0 font-mono">
                      {log.severity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
