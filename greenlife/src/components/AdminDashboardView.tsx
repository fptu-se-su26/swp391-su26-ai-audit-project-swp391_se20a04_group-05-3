import React, { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ShieldCheck, Trees, Sprout, Landmark, Users, CheckCircle2, AlertOctagon, Cpu } from "lucide-react";

export const AdminDashboardView: React.FC = () => {
  const [cleaningStatus, setCleaningStatus] = useState(false);

  // Carbon credits offset reduction across Vietnamese provinces
  const offsetHistory = [
    { year: "2021", LamDong: 80, HaNoi: 20, DaNang: 12 },
    { year: "2022", LamDong: 150, HaNoi: 45, DaNang: 30 },
    { year: "2023", LamDong: 220, HaNoi: 95, DaNang: 65 },
    { year: "2024", LamDong: 380, HaNoi: 160, DaNang: 110 },
    { year: "2025", LamDong: 540, HaNoi: 280, DaNang: 190 },
    { year: "2026", LamDong: 720, HaNoi: 450, DaNang: 320 }
  ];

  // Active leaf sickness cases requiring expert agrologist dispatching
  const systemCheckcases = [
    { id: "CASE-921", patient: "Phong Lan Phi Điệp Đột Biến", disease: "Thối búp rữa nhũn vi khuẩn khẩn", assigned: "KTS. Lê Thị Mai Chi", status: "reviewing" },
    { id: "CASE-920", patient: "Hồ Điệp Phú Quý Chậu Lớn", disease: "Nhện phấn trắng rệp phấn vàng hại gốc", assigned: "ThS. Nguyễn Thành Trung", status: "reviewed" }
  ];

  const triggerCleanLogs = () => {
    setCleaningStatus(true);
    setTimeout(() => {
      setCleaningStatus(false);
      alert("Đã tinh dọn bộ nhớ cache chẩn đoán thừa thành công. Giải phóng 12.4 MB dung lượng lưu trữ đám mây.");
    }, 1500);
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Page Title Header */}
      <div className="space-y-2">
        <span className="text-xs text-emerald-500 font-mono tracking-widest uppercase">BẢNG TỔNG QUY CHUẨN</span>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="h-8 w-8 text-emerald-400" />
          Hệ Thống Quản Trị Hệ Sinh Thái Quốc Gia
        </h1>
        <p className="text-stone-400 text-sm max-w-2xl leading-relaxed">
          Bảng tuần hoàn sinh thái theo dõi mức độ đóng góp phủ xanh rừng Việt Nam, giám sát các ca bệnh cây nghiêm trọng và bảo dưỡng tài nguyên cơ sở dữ liệu.
        </p>
      </div>

      {/* Sustainable Scoreboard */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "-1,490 Tấn", desc: "Tổng CO₂ Đã Khử Toàn Quốc", icon: Sprout, sub: "Đạt 115% chỉ tiêu năm đề ra" },
          { title: "8,420 Cây", desc: "Cây Giống Đã Trồng Thực Địa", icon: Trees, sub: "Tập trung tại Lạng Sơn & Đắk Lắk" },
          { title: "105 Xã", desc: "Liên minh Canh tác Hợp tác", icon: Landmark, sub: "Kinh tế tuần hoàn bền vững" },
          { title: "99.8%", desc: "Hệ số Uptime Mạng Chẩn Đoán AI", icon: Cpu, sub: "Đồng bộ hóa đám mây Google Cloud" }
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-stone-900/40 border border-stone-850 p-5 rounded-2xl flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-stone-500 font-mono text-[10px] uppercase tracking-wider">{stat.desc}</span>
                <Icon className="h-4.5 w-4.5 text-stone-500" />
              </div>
              <span className="text-2xl font-bold font-mono text-white mt-3 block tracking-tight">{stat.title}</span>
              <span className="text-[10px] text-emerald-400 font-mono mt-1 block">{stat.sub}</span>
            </div>
          );
        })}
      </section>

      {/* Carbon Offset Growth visual chart */}
      <div className="bg-[#141414] border border-[#242424] p-6 sm:p-8 rounded-3xl space-y-4">
        <h3 className="font-display font-semibold text-white text-sm tracking-wider uppercase">
          Biểu Đồ Xu Hướng Giảm Thiểu CO₂ Tích Lũy Qua Các Năm Địa Phương (Tấn CO2)
        </h3>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={offsetHistory} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid stroke="#222" strokeDasharray="3 3" />
              <XAxis dataKey="year" stroke="#666" fontSize={11} />
              <YAxis stroke="#666" fontSize={11} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#141414", borderColor: "#2c2c2c" }}
                itemStyle={{ fontSize: "12px" }}
              />
              <Area type="monotone" dataKey="LamDong" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2.5} name="Lâm Đồng" />
              <Area type="monotone" dataKey="HaNoi" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.05} strokeWidth={1.5} name="Ban Công Hà Nội" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sickness tickets dispatch tables */}
        <div className="lg:col-span-8 bg-[#141414] border border-[#242424] p-5 sm:p-6 rounded-3xl space-y-4">
          <h3 className="font-display font-semibold text-white text-sm tracking-wider uppercase flex items-center gap-2">
            <AlertOctagon className="h-4.5 w-4.5 text-amber-500" />
            Vé Khẩn: Ca bệnh nặng cần điều động kỹ sư nông học
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-[#1b1b1b] border-b border-stone-800 text-stone-550 uppercase font-mono text-[9px] tracking-wider">
                <tr>
                  <th className="p-3">Mã Bệnh</th>
                  <th className="p-3">Tên Cây</th>
                  <th className="p-3">Chuẩn Đoán Đám Mây</th>
                  <th className="p-3 text-right font-mono">Chuyên Gia Giao Đi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/40">
                {systemCheckcases.map((cs) => (
                  <tr key={cs.id} className="hover:bg-stone-900/20">
                    <td className="p-3 font-mono font-medium text-white">{cs.id}</td>
                    <td className="p-3">{cs.patient}</td>
                    <td className="p-3 text-stone-400">{cs.disease}</td>
                    <td className="p-3 text-right">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-semibold ${
                        cs.status === "reviewing"
                          ? "bg-amber-950 text-amber-400 border border-amber-500/25"
                          : "bg-emerald-950 text-emerald-400 border border-emerald-500/25"
                      }`}>
                        {cs.assigned}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Maintenance Box */}
        <div className="lg:col-span-4 bg-stone-900/25 border border-stone-800 p-6 rounded-3xl space-y-4">
          <h3 className="font-display font-semibold text-white text-sm tracking-wider uppercase">Cách Hành Động Hệ Thống</h3>

          <div className="space-y-4 text-xs leading-relaxed text-stone-400">
            <p>
              Nhân viên quản trị hệ thống có thể dọn dẹp dung lượng dữ liệu và khởi tạo làm sạch bẫy dữ liệu rác, tối ưu hiệu suất nén ảnh chẩn đoán bệnh lý của khách hàng lên Firebase hay Google Cloud Storage.
            </p>

            <button
              onClick={triggerCleanLogs}
              disabled={cleaningStatus}
              className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 hover:text-white rounded-xl text-stone-300 border border-stone-700 cursor-pointer font-semibold uppercase tracking-wider text-[11px] transition-all"
            >
              {cleaningStatus ? "Đang tiến hành dọn..." : "Quét sạch cache ảnh & logs thừa"}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
