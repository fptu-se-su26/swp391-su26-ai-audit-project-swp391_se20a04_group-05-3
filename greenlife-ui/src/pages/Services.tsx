import { motion } from 'motion/react';
import { Palette, Droplets, Stethoscope, Scissors, TreeDeciduous, GraduationCap, ArrowRight } from 'lucide-react';

export default function Services() {
  const serviceCategories = [
    {
      id: 1,
      title: 'Thiết Kế Cảnh Quan',
      icon: <Palette size={32} />,
      price: 'Từ 2.000.000đ',
      description: 'Chúng tôi giúp bạn lên ý tưởng và thiết kế không gian xanh tối ưu cho ngôi nhà hoặc văn phòng, cân bằng giữa thẩm mỹ và phong thủy.',
      features: ['Khảo sát hiện trạng', 'Bản vẽ 3D chi tiết', 'Tư vấn chọn cây phù hợp', 'Dự toán chi phí chính xác']
    },
    {
      id: 2,
      title: 'Dịch Vụ Chăm Sóc Định Kỳ',
      icon: <Droplets size={32} />,
      price: 'Từ 500.000đ/tháng',
      description: 'Gói chăm sóc chuyên nghiệp định kỳ hàng tuần/tháng giúp cây luôn xanh tốt mà bạn không phải lo lắng về việc chăm bón.',
      features: ['Tưới nước & Bón phân', 'Tỉa cành & Nhổ cỏ', 'Phòng ngừa sâu bệnh', 'Vệ sinh khu vực trồng']
    },
    {
      id: 3,
      title: 'Bệnh Viện Cây Xanh',
      icon: <Stethoscope size={32} />,
      price: 'Tư vấn miễn phí AI',
      description: 'Dịch vụ cấp cứu và điều trị đặc biệt cho những cây đang gặp vấn đề nghiêm trọng: héo úa, sâu bệnh nặng, suy dinh dưỡng.',
      features: ['Chẩn đoán chuyên gia', 'Phác đồ điều trị riêng', 'Thay đất & Hồi phục rễ', 'Hướng dẫn phục hồi tại nhà']
    },
    {
      id: 4,
      title: 'Cắt Tỉa & Tạo Dáng',
      icon: <Scissors size={32} />,
      price: 'Theo yêu cầu',
      description: 'Dịch vụ cắt tỉa chuyên nghiệp cho cây cảnh, bonsai và thảm cỏ, đảm bảo tính nghệ thuật và sự phát triển của cây.',
      features: ['Tạo dáng Bonsai', 'Tỉa hàng rào chỉn chu', 'Vệ sinh tán cây', 'Kiểm soát chiều cao']
    }
  ];

  return (
    <main className="pt-32 pb-24 px-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 items-center mb-20">
          <div className="lg:w-1/2">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-primary/20"
            >
              <TreeDeciduous size={32} />
            </motion.div>
            <h1 className="text-5xl font-bold mb-6 text-slate-900 leading-tight">Dịch vụ chăm sóc chuyên nghiệp</h1>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Chúng tôi mang đến các giải pháp chăm sóc cây xanh toàn diện, giúp không gian của bạn luôn tràn đầy sức sống và năng lượng tích cực.
            </p>
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-primary">500+</span>
                <span className="text-sm text-slate-500">Dự án hoàn thành</span>
              </div>
              <div className="w-[1px] h-10 bg-slate-200" />
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-primary">15+</span>
                <span className="text-sm text-slate-500">Năm kinh nghiệm</span>
              </div>
            </div>
          </div>
          <div className="lg:w-1/2 relative">
            <div className="rounded-[40px] overflow-hidden shadow-2xl border-8 border-white">
              <img 
                src="https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=1200" 
                alt="Gardening Service" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-10 -left-10 glass p-8 rounded-3xl shadow-xl max-w-xs hidden md:block">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                  <GraduationCap size={24} />
                </div>
                <h4 className="font-bold">Đội ngũ chuyên gia</h4>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed italic">
                "Kỹ thuật viên của chúng tôi đều tốt nghiệp các chuyên ngành nông học và cảnh quan."
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {serviceCategories.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col md:flex-row gap-8"
            >
              <div className="w-16 h-16 bg-nature-50 rounded-2xl flex items-center justify-center text-primary shrink-0 transition-transform group-hover:scale-110">
                {service.icon}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-bold text-slate-900 group-hover:text-primary transition-colors">{service.title}</h3>
                  <span className="text-sm font-bold text-accent bg-emerald-50 px-3 py-1 rounded-full">{service.price}</span>
                </div>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  {service.description}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                  {service.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-500">
                      <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <button className="flex items-center gap-2 font-bold text-primary group-hover:gap-3 transition-all">
                  Nhận báo giá <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <section className="mt-20 p-12 lg:p-20 bg-slate-900 rounded-[50px] relative overflow-hidden text-center text-white">
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-6">Sẵn sàng để đưa thiên nhiên vào không gian của bạn?</h2>
            <p className="text-slate-400 max-w-2xl mx-auto mb-10">Liên hệ ngay để nhận được tư vấn chi tiết từ các chuyên gia cảnh quan của GreenLife.</p>
            <button className="btn-primary !bg-accent !text-primary !px-12 !py-4 text-lg">
              Liên Hệ Ngay
            </button>
          </div>
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
              <path d="M0,50 Q25,0 50,50 T100,50 V100 H0 Z" />
            </svg>
          </div>
        </section>
      </div>
    </main>
  );
}
