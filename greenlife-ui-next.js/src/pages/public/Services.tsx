import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, Droplets, Stethoscope, Scissors, TreeDeciduous, GraduationCap, ArrowRight, Calendar, Clock, User, Phone, MapPin, CheckCircle, X } from 'lucide-react';
import { experts } from '@/src/services/mockData';

export default function Services() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: Select Service & Expert, 2: Time & Info, 3: Confirmation
  
  // Form State
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedExpert, setSelectedExpert] = useState<string | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const serviceCategories = [
    {
      id: 1,
      title: 'Thiết Kế Cảnh Quan',
      icon: <Palette size={32} />,
      price: 'Từ 2.000.000đ',
      description: 'Chúng tôi giúp bạn lên ý tưởng và thiết kế không gian xanh tối ưu.',
      features: ['Khảo sát hiện trạng', 'Bản vẽ 3D chi tiết', 'Tư vấn chọn cây phù hợp', 'Dự toán chi phí chính xác']
    },
    {
      id: 2,
      title: 'Dịch Vụ Chăm Sóc Định Kỳ',
      icon: <Droplets size={32} />,
      price: 'Từ 500.000đ/tháng',
      description: 'Gói chăm sóc chuyên nghiệp định kỳ hàng tuần/tháng giúp cây luôn xanh tốt.',
      features: ['Tưới nước & Bón phân', 'Tỉa cành & Nhổ cỏ', 'Phòng ngừa sâu bệnh', 'Vệ sinh khu vực trồng']
    },
    {
      id: 3,
      title: 'Bệnh Viện Cây Xanh',
      icon: <Stethoscope size={32} />,
      price: 'Tư vấn miễn phí AI',
      description: 'Dịch vụ cấp cứu và điều trị đặc biệt cho những cây đang gặp vấn đề nghiêm trọng.',
      features: ['Chẩn đoán chuyên gia', 'Phác đồ điều trị riêng', 'Thay đất & Hồi phục rễ', 'Hướng dẫn phục hồi tại nhà']
    },
    {
      id: 4,
      title: 'Cắt Tỉa & Tạo Dáng',
      icon: <Scissors size={32} />,
      price: 'Theo yêu cầu',
      description: 'Dịch vụ cắt tỉa chuyên nghiệp cho cây cảnh, bonsai và thảm cỏ.',
      features: ['Tạo dáng Bonsai', 'Tỉa hàng rào chỉn chu', 'Vệ sinh tán cây', 'Kiểm soát chiều cao']
    }
  ];

  const handleOpenBooking = (serviceId: number) => {
    setSelectedService(serviceId);
    setStep(1);
    setIsBookingModalOpen(true);
    // Reset form
    setSelectedExpert(null);
    setBookingDate('');
    setBookingTime('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setErrors({});
  };

  const validateStep1 = () => {
    if (!selectedService) return false;
    if (!selectedExpert) {
      setErrors({ expert: 'Vui lòng chọn một chuyên gia' });
      return false;
    }
    setErrors({});
    return true;
  };

  const validateStep2 = () => {
    const newErrors: { [key: string]: string } = {};
    if (!bookingDate) newErrors.date = 'Vui lòng chọn ngày';
    if (!bookingTime) newErrors.time = 'Vui lòng chọn giờ';
    if (!customerName.trim()) newErrors.name = 'Vui lòng nhập họ tên';
    if (!customerPhone.trim()) newErrors.phone = 'Vui lòng nhập số điện thoại';
    if (!customerAddress.trim()) newErrors.address = 'Vui lòng nhập địa chỉ';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3); // Go to confirmation
    }
  };

  return (
    <main className="pt-32 pb-24 px-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Intro Section */}
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

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
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
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-bold text-slate-900 group-hover:text-primary transition-colors">{service.title}</h3>
                  <span className="text-sm font-bold text-accent bg-emerald-50 px-3 py-1 rounded-full">{service.price}</span>
                </div>
                <p className="text-slate-600 mb-6 leading-relaxed flex-1">
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
                <button 
                  onClick={() => handleOpenBooking(service.id)}
                  className="flex items-center gap-2 font-bold text-primary group-hover:gap-3 transition-all mt-auto"
                >
                  Đặt lịch ngay <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <section className="p-12 lg:p-20 bg-slate-900 rounded-[50px] relative overflow-hidden text-center text-white">
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-6">Sẵn sàng để đưa thiên nhiên vào không gian của bạn?</h2>
            <p className="text-slate-400 max-w-2xl mx-auto mb-10">Liên hệ ngay để nhận được tư vấn chi tiết từ các chuyên gia cảnh quan của GreenLife.</p>
            <button onClick={() => handleOpenBooking(1)} className="btn-primary !bg-accent !text-primary !px-12 !py-4 text-lg">
              Đặt Lịch Dịch Vụ
            </button>
          </div>
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
              <path d="M0,50 Q25,0 50,50 T100,50 V100 H0 Z" />
            </svg>
          </div>
        </section>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {isBookingModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsBookingModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-2xl font-bold text-slate-900">
                  {step === 3 ? 'Hoàn tất đặt lịch' : 'Đặt Lịch Dịch Vụ'}
                </h2>
                <button onClick={() => setIsBookingModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 bg-white rounded-full shadow-sm">
                  <X size={20} />
                </button>
              </div>

              {/* Progress Bar */}
              {step < 3 && (
                <div className="px-6 pt-6 flex gap-2">
                  <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-slate-100'}`} />
                  <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-slate-100'}`} />
                  <div className="h-1.5 flex-1 rounded-full bg-slate-100" />
                </div>
              )}

              {/* Body */}
              <div className="p-6 sm:p-8 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                      <div>
                        <label className="block font-bold text-slate-900 mb-4">1. Dịch vụ được chọn</label>
                        <div className="grid sm:grid-cols-2 gap-4">
                          {serviceCategories.map(s => (
                            <button
                              key={s.id}
                              onClick={() => setSelectedService(s.id)}
                              className={`p-4 rounded-2xl border-2 text-left transition-all ${selectedService === s.id ? 'border-primary bg-emerald-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                            >
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${selectedService === s.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                                {s.icon}
                              </div>
                              <h4 className={`font-bold ${selectedService === s.id ? 'text-primary' : 'text-slate-700'}`}>{s.title}</h4>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-900 mb-4 flex justify-between items-end">
                          <span>2. Chọn chuyên gia</span>
                          {errors.expert && <span className="text-red-500 text-xs font-normal">{errors.expert}</span>}
                        </label>
                        <div className="space-y-3">
                          {experts.map(expert => (
                            <button
                              key={expert.id}
                              onClick={() => { setSelectedExpert(expert.id); setErrors({}); }}
                              className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${selectedExpert === expert.id ? 'border-primary bg-emerald-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                            >
                              <img src={expert.avatar} alt={expert.name} className="w-12 h-12 rounded-full object-cover" />
                              <div className="text-left flex-1">
                                <h4 className="font-bold text-slate-900">{expert.name}</h4>
                                <p className="text-sm text-slate-500">{expert.specialty}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-amber-500 flex items-center gap-1">★ {expert.rating}</div>
                                <div className="text-xs text-slate-400">{expert.reviews} đánh giá</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Ngày hẹn *</label>
                          <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                              type="date" 
                              value={bookingDate}
                              onChange={(e) => setBookingDate(e.target.value)}
                              className={`w-full pl-12 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.date ? 'border-red-300' : 'border-slate-200'}`}
                            />
                          </div>
                          {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Giờ hẹn *</label>
                          <div className="relative">
                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                              type="time" 
                              value={bookingTime}
                              onChange={(e) => setBookingTime(e.target.value)}
                              className={`w-full pl-12 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.time ? 'border-red-300' : 'border-slate-200'}`}
                            />
                          </div>
                          {errors.time && <p className="text-red-500 text-xs mt-1">{errors.time}</p>}
                        </div>
                      </div>

                      <hr className="border-slate-100" />

                      <div className="space-y-4">
                        <h3 className="font-bold text-slate-900">Thông tin liên hệ</h3>
                        
                        <div>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                              type="text" 
                              placeholder="Họ và tên *"
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              className={`w-full pl-12 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.name ? 'border-red-300' : 'border-slate-200'}`}
                            />
                          </div>
                          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                        </div>

                        <div>
                          <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                              type="tel" 
                              placeholder="Số điện thoại *"
                              value={customerPhone}
                              onChange={(e) => setCustomerPhone(e.target.value)}
                              className={`w-full pl-12 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.phone ? 'border-red-300' : 'border-slate-200'}`}
                            />
                          </div>
                          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                        </div>

                        <div>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-[22px] -translate-y-1/2 text-slate-400" size={20} />
                            <textarea 
                              placeholder="Địa chỉ chi tiết *"
                              rows={3}
                              value={customerAddress}
                              onChange={(e) => setCustomerAddress(e.target.value)}
                              className={`w-full pl-12 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none ${errors.address ? 'border-red-300' : 'border-slate-200'}`}
                            />
                          </div>
                          {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
                      <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={48} />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">Đặt lịch thành công!</h3>
                      <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                        Cảm ơn bạn, {customerName}. Chúng tôi đã nhận được yêu cầu đặt lịch của bạn vào lúc {bookingTime} ngày {bookingDate}. Chuyên gia sẽ sớm liên hệ để xác nhận.
                      </p>
                      <button 
                        onClick={() => setIsBookingModalOpen(false)}
                        className="btn-primary"
                      >
                        Đóng cửa sổ
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer Actions */}
              {step < 3 && (
                <div className="p-6 border-t border-slate-100 flex gap-4 bg-slate-50">
                  {step > 1 && (
                    <button 
                      onClick={() => setStep(step - 1)}
                      className="px-6 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-white transition-colors"
                    >
                      Quay lại
                    </button>
                  )}
                  <button 
                    onClick={handleNextStep}
                    className="flex-1 btn-primary flex justify-center items-center gap-2"
                  >
                    <span>Tiếp tục</span>
                    <ArrowRight size={20} />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
