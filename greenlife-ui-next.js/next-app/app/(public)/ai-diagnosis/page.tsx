"use client";

import React, { useState, useRef, ChangeEvent } from 'react';
import { Camera, Upload, AlertCircle, CheckCircle2, Loader2, Sparkles, Activity, ShieldAlert, ArrowRight, Stethoscope } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';

export default function AIDiagnosis() {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const startAnalysis = () => {
    setIsAnalyzing(true);
    setProgress(0);
    
    // Simulate AI thinking with progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 150);

    // Call mock API for diagnosis or simulate
    setTimeout(() => {
      fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image })
      })
      .then(res => res.json())
      .then(data => {
        setIsAnalyzing(false);
        setResult(data);
      })
      .catch(() => {
        setIsAnalyzing(false);
        // Fallback static mock data
        setResult({
          plantName: 'Monstera Deliciosa (Trầu Bà Nam Mỹ)',
          healthStatus: 'Bệnh đốm lá rỉ sắt',
          diagnosis: 'Dựa trên hình ảnh phân tích, phát hiện nhiều đốm vàng và nâu trên bề mặt lá. Dấu hiệu này cho thấy cây đang mắc bệnh đốm lá (Rust spot) do nấm gây ra, thường xuất hiện khi độ ẩm quá cao và thiếu sự thông thoáng.',
          confidence: 0.94,
          treatmentSteps: [
            'Cách ly cây bệnh ngay lập tức để tránh lây lan nấm bào tử sang các cây khỏe mạnh khác.',
            'Dùng kéo đã khử trùng cắt bỏ cẩn thiện những lá có vết đốm nhiễm bệnh nặng. Bỏ vào túi nilon kín vứt đi.',
            'Phun dung dịch diệt nấm sinh học (Neem oil hoặc baking soda pha loãng) lên cả hai mặt lá.',
            'Giảm lượng nước tưới, chỉ tưới gốc và tránh làm ướt lá. Chuyển cây đến nơi có ánh sáng tán xạ tốt hơn và thông thoáng hơn.'
          ],
          recommendations: [
            'Duy trì độ ẩm môi trường ở mức 50-60%.',
            'Sử dụng quạt gió nhẹ để tăng cường lưu thông không khí.',
            'Tránh tưới nước vào buổi chiều tối.'
          ]
        });
      });
    }, 3500);
  };

  return (
    <main className="pt-32 pb-24 px-6 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex py-2 px-4 rounded-full bg-accent/20 text-primary font-bold text-sm mb-6 border border-accent/30 gap-2 items-center shadow-sm"
          >
            <Sparkles size={16} />
            <span>GreenLife AI Plant Doctor</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900">Chẩn Đoán Sức Khỏe Cây Bằng AI</h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Công nghệ trí tuệ nhân tạo của chúng tôi có thể nhận diện hơn 1,000 loại bệnh trên cây trồng. Chụp ảnh ngay để nhận kết quả phân tích và phác đồ điều trị chi tiết trong vài giây.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Column: Upload Section */}
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => !isAnalyzing && fileInputRef.current?.click()}
              className={`aspect-[4/3] rounded-[40px] border-4 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden relative group shadow-sm bg-white
                ${isAnalyzing ? 'border-primary cursor-wait' : 'border-slate-200 cursor-pointer hover:border-primary/50'}
              `}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*"
                disabled={isAnalyzing}
              />
              
              {image ? (
                <>
                  <img src={image} alt="Upload Preview" className="w-full h-full object-cover" />
                  
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                      <div className="relative w-32 h-32 mb-6">
                        {/* Scanning Effect */}
                        <motion.div 
                          animate={{ top: ['0%', '100%', '0%'] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                          className="absolute left-0 w-full h-1 bg-accent shadow-[0_0_15px_rgba(34,197,94,0.8)] z-30"
                        />
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
                          <circle cx="50" cy="50" r="45" fill="none" stroke="#22c55e" strokeWidth="8" 
                            strokeDasharray={`${progress * 2.82} 282`} 
                            strokeLinecap="round" 
                            transform="rotate(-90 50 50)" 
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-2xl drop-shadow-md">
                          {progress}%
                        </div>
                      </div>
                      <p className="text-white font-medium drop-shadow-md bg-slate-900/40 px-4 py-1.5 rounded-full backdrop-blur-md flex items-center gap-2">
                        <Activity size={18} className="animate-pulse text-accent" /> Đang phân tích tế bào lá...
                      </p>
                    </div>
                  )}

                  {!isAnalyzing && (
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 z-10 backdrop-blur-sm">
                      <div className="p-4 bg-white rounded-full text-primary shadow-xl hover:scale-110 transition-transform"><Camera size={28} /></div>
                      <div className="p-4 bg-white rounded-full text-primary shadow-xl hover:scale-110 transition-transform"><Upload size={28} /></div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center p-8">
                  <div className="w-24 h-24 bg-nature-50 rounded-full flex items-center justify-center text-primary mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                    <Camera size={40} />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-800">Tải ảnh lên hoặc chụp hình</h3>
                  <p className="text-slate-500 max-w-xs mx-auto">Định dạng JPG, PNG. Đảm bảo ảnh rõ nét để AI phân tích chính xác nhất.</p>
                </div>
              )}
            </motion.div>

            <button
              disabled={!image || isAnalyzing}
              onClick={startAnalysis}
              className="w-full btn-primary !py-5 !rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg shadow-xl shadow-primary/20 relative overflow-hidden group"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  <span>Hệ thống đang xử lý...</span>
                </>
              ) : (
                <>
                  <Sparkles size={24} className="group-hover:animate-pulse" />
                  <span>Bắt đầu chẩn đoán bằng AI</span>
                </>
              )}
            </button>

            <div className="p-6 bg-blue-50/80 backdrop-blur-sm rounded-2xl border border-blue-100 flex gap-4 shadow-sm">
              <AlertCircle className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800 leading-relaxed">
                <strong>Mẹo cho kết quả chính xác:</strong> Chụp ảnh vào ban ngày với ánh sáng tự nhiên. Đặt lá cây lên nền trơn (như tờ giấy trắng) và chụp cận cảnh vào những đốm lạ, vết cháy hoặc phần bị héo.
              </p>
            </div>
          </div>

          {/* Right Column: Result Section */}
          <div className="min-h-[600px] flex flex-col">
            <AnimatePresence mode="wait">
              {!result && !isAnalyzing ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full flex-1 flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-200 rounded-[40px] bg-white/50 text-slate-400"
                >
                  <div className="w-32 h-32 opacity-20 mb-6 grayscale">
                    <img src="https://cdn-icons-png.flaticon.com/512/2928/2928878.png" alt="Plant Icon" className="w-full h-full object-contain" />
                  </div>
                  <p className="text-lg italic font-medium">Báo cáo sức khỏe cây sẽ hiển thị ở đây sau khi phân tích hoàn tất.</p>
                </motion.div>
              ) : isAnalyzing ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl animate-pulse" />
                    <div className="space-y-3 flex-1">
                      <div className="h-4 bg-slate-100 rounded-full w-2/3 animate-pulse" />
                      <div className="h-4 bg-slate-100 rounded-full w-1/3 animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 bg-slate-100 rounded-full w-full animate-pulse" />
                    <div className="h-4 bg-slate-100 rounded-full w-full animate-pulse" />
                    <div className="h-4 bg-slate-100 rounded-full w-5/6 animate-pulse" />
                  </div>
                  <div className="space-y-4 pt-4 border-t border-slate-50">
                    <div className="h-4 bg-slate-100 rounded-full w-1/4 animate-pulse mb-6" />
                    <div className="h-16 bg-slate-100 rounded-xl w-full animate-pulse" />
                    <div className="h-16 bg-slate-100 rounded-xl w-full animate-pulse" />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8 bg-white p-8 sm:p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50"
                >
                  {/* Header Result */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 mb-1">{result.plantName}</h2>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-sm font-bold border border-red-100">
                          <ShieldAlert size={16} />
                          {result.healthStatus}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Độ chính xác AI</span>
                      <span className="text-xl font-black text-accent">{(result.confidence * 100).toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <Activity className="text-primary" size={20} /> Kết luận chẩn đoán
                    </h3>
                    <p className="text-slate-600 leading-relaxed p-5 bg-slate-50 rounded-2xl italic border border-slate-100">
                      "{result.diagnosis}"
                    </p>
                  </div>

                  {/* Treatment Steps */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <CheckCircle2 className="text-primary" size={20} /> Phác đồ điều trị 4 bước
                    </h3>
                    
                    <div className="space-y-4">
                      {result.treatmentSteps.map((step: string, index: number) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * index }}
                          key={index} 
                          className="flex gap-4 p-4 rounded-2xl border border-emerald-100 bg-emerald-50/30 hover:bg-emerald-50 transition-colors"
                        >
                          <div className="w-8 h-8 shrink-0 bg-primary text-white rounded-full flex items-center justify-center font-bold shadow-md shadow-primary/20">
                            {index + 1}
                          </div>
                          <p className="text-slate-700 leading-relaxed pt-1">
                            {step}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Additional Recommendations */}
                  <div className="pt-6 border-t border-slate-100">
                    <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-4">Lưu ý chăm sóc phòng ngừa:</h4>
                    <ul className="grid sm:grid-cols-2 gap-3">
                      {result.recommendations.map((rec: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <div className="w-1.5 h-1.5 bg-accent rounded-full shrink-0 mt-1.5" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <div className="p-6 bg-slate-900 rounded-3xl text-white mt-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 transform group-hover:scale-110 transition-transform duration-700">
                      <Stethoscope size={120} />
                    </div>
                    <div className="relative z-10">
                      <h4 className="font-bold text-xl mb-2">Tình trạng cây nghiêm trọng?</h4>
                      <p className="text-sm text-slate-300 mb-6 max-w-sm leading-relaxed">Đội ngũ kỹ thuật viên và chuyên gia thực vật của GreenLife luôn sẵn sàng hỗ trợ tận nơi để cấp cứu cây cho bạn.</p>
                      <Link href="/services" className="inline-flex py-3 px-6 bg-accent text-primary rounded-xl font-bold hover:bg-white transition-all items-center gap-2 shadow-lg">
                        Đặt lịch Bác sĩ cây <ArrowRight size={18} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  );
}
