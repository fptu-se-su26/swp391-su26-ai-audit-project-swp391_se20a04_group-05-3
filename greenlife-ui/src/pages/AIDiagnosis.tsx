import React, { useState, useRef, ChangeEvent } from 'react';
import { Camera, Upload, AlertCircle, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AIDiagnosis() {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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
    // Simulate AI thinking
    setTimeout(() => {
      setIsAnalyzing(false);
      setResult({
        plantName: 'Monstera Deliciosa',
        healthStatus: 'Chú ý',
        diagnosis: 'Bị thiếu nước và độ ẩm không khí thấp.',
        recommendations: [
          'Tưới thêm nước ngay lập tức nhưng tránh để ngập úng.',
          'Sử dụng bình phun sương để tăng độ ẩm cho lá.',
          'Đặt cây tránh xa luồng gió trực tiếp của máy điều hòa.',
          'Kiểm tra rễ xem có bị thối hay không.'
        ],
        confidence: 0.92
      });
    }, 3000);
  };

  return (
    <main className="pt-32 pb-24 px-6 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex py-2 px-4 rounded-full bg-accent/20 text-primary font-bold text-sm mb-6 border border-accent/30 gap-2 items-center"
          >
            <Sparkles size={16} />
            <span>AI Plant Doctor</span>
          </motion.div>
          <h1 className="text-4xl font-bold mb-4">Chẩn Đoán Sức Khỏe Cây Bằng AI</h1>
          <p className="text-slate-500 max-w-xl mx-auto">Chụp ảnh lá cây hoặc vết bệnh, AI của chúng tôi sẽ phân tích và đưa ra giải pháp chăm sóc phù hợp ngay lập tức.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Upload Section */}
          <div className="space-y-6">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-[40px] border-4 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all overflow-hidden relative group"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*"
              />
              
              {image ? (
                <>
                  <img src={image} alt="Upload" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <div className="p-3 bg-white rounded-full text-primary shadow-lg"><Camera size={24} /></div>
                    <div className="p-3 bg-white rounded-full text-primary shadow-lg"><Upload size={24} /></div>
                  </div>
                </>
              ) : (
                <div className="text-center p-8">
                  <div className="w-20 h-20 bg-nature-50 rounded-full flex items-center justify-center text-primary mx-auto mb-6">
                    <Camera size={32} />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Tải ảnh lên hoặc chụp hình</h3>
                  <p className="text-sm text-slate-400">Định dạng JPG, PNG. Dung lượng tối đa 10MB.</p>
                </div>
              )}
            </div>

            <button
              disabled={!image || isAnalyzing}
              onClick={startAnalysis}
              className="w-full btn-primary !py-4 !rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  <span>Đang phân tích tế bào...</span>
                </>
              ) : (
                <>
                  <Sparkles size={24} />
                  <span>Bắt đầu chẩn đoán AI</span>
                </>
              )}
            </button>

            <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4">
              <AlertCircle className="text-blue-500 shrink-0" />
              <p className="text-xs text-blue-700 leading-relaxed">
                <strong>Lưu ý:</strong> Kết quả từ AI mang tính chất tham khảo. Để có kết quả chính xác nhất, bạn nên cung cấp ảnh chụp cận cảnh những vùng có dấu hiệu bất thường.
              </p>
            </div>
          </div>

          {/* Result Section */}
          <div className="min-h-[500px]">
            <AnimatePresence mode="wait">
              {!result && !isAnalyzing ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-slate-100 rounded-[40px] bg-slate-50/50 italic text-slate-400"
                >
                  <p>Kết quả phân tích sẽ hiển thị ở đây sau khi bạn tải ảnh lên và nhấn chẩn đoán.</p>
                </motion.div>
              ) : isAnalyzing ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-8"
                >
                  <div className="h-10 bg-slate-200 rounded-full w-2/3 animate-pulse" />
                  <div className="space-y-4">
                    <div className="h-4 bg-slate-200 rounded-full w-full animate-pulse" />
                    <div className="h-4 bg-slate-200 rounded-full w-full animate-pulse" />
                    <div className="h-4 bg-slate-200 rounded-full w-1/2 animate-pulse" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 bg-slate-200 rounded-2xl animate-pulse" />
                    <div className="h-24 bg-slate-200 rounded-2xl animate-pulse" />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900">Chi tiết chẩn đoán</h2>
                    <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                      Độ tin cậy: {(result.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                        <AlertCircle size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Tình trạng</p>
                        <p className="font-bold text-orange-600">{result.healthStatus}</p>
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-lg mb-2">{result.plantName}</h3>
                    <p className="text-slate-600 leading-relaxed mb-6">{result.diagnosis}</p>

                    <div className="space-y-4">
                      <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400">Lời khuyên từ chuyên gia:</h4>
                      <ul className="space-y-3">
                        {result.recommendations.map((rec: string, i: number) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                            <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="p-6 bg-primary rounded-3xl text-white">
                    <h4 className="font-bold mb-4">Bạn cần hỗ trợ trực tiếp?</h4>
                    <p className="text-sm opacity-80 mb-6">Đội ngũ kỹ thuật viên của chúng tôi có thể tư vấn chuyên sâu hơn cho tình hợp của bạn.</p>
                    <button className="w-full py-3 bg-accent text-primary rounded-xl font-bold hover:bg-neutral-100 transition-all">
                      Kết nối với chuyên gia
                    </button>
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
