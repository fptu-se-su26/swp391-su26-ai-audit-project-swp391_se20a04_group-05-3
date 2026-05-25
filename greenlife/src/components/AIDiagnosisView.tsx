import React, { useState, useRef } from "react";
import { BrainCircuit, Upload, Sparkles, AlertTriangle, CheckCircle, RefreshCw, ShoppingBag, Eye, History, HelpCircle } from "lucide-react";
import { Product, DiagnosisLog } from "../types";
import { MOCK_DIAGNOSIS_PRESETS } from "../data";

interface AIDiagnosisViewProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  diagnosisLogs: DiagnosisLog[];
  onAddDiagnosisLog: (log: DiagnosisLog) => void;
}

export const AIDiagnosisView: React.FC<AIDiagnosisViewProps> = ({
  products,
  onSelectProduct,
  diagnosisLogs,
  onAddDiagnosisLog,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [activeReport, setActiveReport] = useState<any | null>(null);
  const [warningMessage, setWarningMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trigger file dialog
  const handleSelectFileClick = () => {
    fileInputRef.current?.click();
  };

  // Convert File to base64
  const processUploadFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng tải lên tập tin hình ảnh vườn tược chuẩn (PNG/JPG).");
      return;
    }

    setFileName(file.name);
    setSelectedPresetId(null); // Overwrite preset with custom custom upload image

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setFileBase64(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle standard manual selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadFile(e.target.files[0]);
    }
  };

  // Handle Drag Events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadFile(e.dataTransfer.files[0]);
    }
  };

  // Quick Preset Selector
  const selectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    setFileBase64(null); // Clear custom upload image
    setFileName("");
    const matched = MOCK_DIAGNOSIS_PRESETS.find((p) => p.id === presetId);
    if (matched) {
      setFileBase64(matched.imageUrl);
    }
  };

  // Trigger diagnosis call to server api
  const executeDiagnosisProcess = async () => {
    if (!fileBase64 && !selectedPresetId) {
      alert("Vui lòng chọn 1 loại bệnh cây mẫu bên dưới hoặc tải lên file ảnh lá cây của bạn.");
      return;
    }

    setIsScanning(true);
    setWarningMessage("");
    setActiveReport(null);

    try {
      // Build body parameters
      const reqBody: any = {};
      if (selectedPresetId) {
        reqBody.presetId = selectedPresetId;
      } else {
        reqBody.base64Data = fileBase64;
        reqBody.mimeType = "image/jpeg";
      }

      const response = await fetch("/api/ai-diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
      });

      const data = await response.json();

      if (data.success && data.result) {
        setActiveReport(data.result);
        if (data.warning) {
          setWarningMessage(data.warning);
        }

        // Save report log to parent state
        const newLog: DiagnosisLog = {
          id: `diag-${Date.now()}`,
          date: new Date().toLocaleDateString("vi-VN"),
          plantName: data.result.plantName,
          diseaseName: data.result.diseaseName,
          severity: data.result.severity,
          symptoms: data.result.symptoms,
          treatment: data.result.treatment,
          recommendedProductIds: data.result.recommendedProductIds || [],
          imageUrl: fileBase64 || "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200"
        };
        onAddDiagnosisLog(newLog);

      } else {
        alert(data.error || "Có lỗi bất ngờ xảy ra khi chuẩn đoán thông số.");
      }
    } catch (err: any) {
      console.error("Diagnosis error:", err);
      alert("Mạng kết nối không ổn định hoặc lỗi máy chủ xử lý ảnh.");
    } finally {
      setIsScanning(false);
    }
  };

  const getSeverityBadgeClass = (sev: string) => {
    switch (sev) {
      case "nhẹ":
        return "bg-emerald-950/80 border-emerald-500/30 text-emerald-400";
      case "trung bình":
        return "bg-amber-950/80 border-amber-500/30 text-amber-400";
      case "nặng":
        return "bg-rose-950/80 border-rose-500/30 text-rose-500";
      default:
        return "bg-stone-900 border-stone-800 text-stone-300";
    }
  };

  return (
    <div className="space-y-12 pb-20">
      
      {/* Intro Section */}
      <div className="space-y-2">
        <span className="text-xs text-emerald-500 font-mono tracking-widest uppercase">TRÁM CHẨN ĐOÁN CÔNG NGHỆ CAO</span>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight flex items-center gap-2">
          <BrainCircuit className="h-8 w-8 text-emerald-400" />
          Bác Sĩ Thực Vật Trí Tuệ Nhân Tạo
        </h1>
        <p className="text-stone-400 text-sm max-w-2xl leading-relaxed">
          Ứng dụng phát hiện tự động hơn 150 loại vi nấm, sâu xanh rệp, thối nhũn và sự cố dinh dưỡng hữu cơ nhờ AI sinh học. Đưa cây hồi sinh khỏe mạnh chỉ sau một phác đồ dứt điểm.
        </p>
      </div>

      {/* Diagnosis Simulator Interface & Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Module - Leaf scan terminal stage */}
        <div className="lg:col-span-5 bg-neutral-950 border border-stone-850 p-6 rounded-3xl space-y-6">
          <h3 className="font-display font-semibold text-white text-sm tracking-wider uppercase">Console Máy Quét Thực Địa</h3>

          {/* Interactive Drag Drop or File Selector Container */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={handleSelectFileClick}
            className={`cursor-pointer h-72 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-6 transition-all relative overflow-hidden group ${
              isDragActive
                ? "border-emerald-500 bg-emerald-950/20"
                : fileBase64
                ? "border-stone-800 bg-stone-950/50"
                : "border-stone-800 hover:border-stone-700 bg-stone-950/40"
            }`}
          >
            {fileBase64 ? (
              <>
                <img
                  src={fileBase64}
                  alt="Scanned specimen"
                  className="absolute inset-0 w-full h-full object-cover rounded-2xl opacity-75 group-hover:opacity-60 transition-opacity"
                  referrerPolicy="no-referrer"
                />
                
                {/* scanning laser beam */}
                {isScanning && (
                  <div className="absolute inset-x-0 top-0 h-1.5 bg-emerald-400 shadow-lg shadow-emerald-500/50 animate-[bounce_2s_infinite]" />
                )}

                <div className="absolute bottom-3 right-3 bg-stone-900/95 border border-stone-800 px-3 py-1.5 rounded-lg text-[10px] font-mono text-stone-300">
                  {fileName ? "File custom" : "Preset cây hại"}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-stone-900 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-stone-400 group-hover:text-emerald-400 group-hover:bg-emerald-950/30 transition-all">
                  <Upload className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-stone-200">Kéo thả ảnh bệnh lá hoặc Nhấp để chọn</p>
                  <p className="text-[10px] text-stone-500">Hỗ trợ PNG, JPG dung lượng tối đa 10MB</p>
                </div>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Preset Buttons for Quick Diagnostic sandbox */}
          <div className="space-y-2.5">
            <span className="text-[10px] text-stone-500 font-mono tracking-wider block">CHỌN CHẨN ĐOÁN MẪU THỬ NHANH:</span>
            <div className="grid grid-cols-1 gap-2">
              {MOCK_DIAGNOSIS_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => selectPreset(preset.id)}
                  className={`text-left p-2.5 rounded-xl border text-xs transition-all flex items-center gap-3 ${
                    selectedPresetId === preset.id
                      ? "border-emerald-500 bg-emerald-950/20 text-white"
                      : "border-stone-850 bg-stone-900/40 text-stone-400 hover:text-stone-300 hover:bg-stone-950"
                  }`}
                >
                  <img
                    src={preset.imageUrl}
                    alt={preset.name}
                    className="w-10 h-10 object-cover rounded-md"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <span className="font-semibold block text-stone-200 text-[11px] line-clamp-1">{preset.name}</span>
                    <span className="text-[9px] text-stone-500 italic block mt-0.5">{preset.plantType}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Big diagnostic trigger button */}
          <button
            onClick={executeDiagnosisProcess}
            disabled={isScanning || (!fileBase64 && !selectedPresetId)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-stone-850 disabled:text-stone-600 font-semibold text-sm text-black rounded-xl cursor-pointer transition-all"
          >
            {isScanning ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Đang giải mã sinh học gốc...
              </>
            ) : (
              <>
                <BrainCircuit className="h-5 w-5" />
                Đặt Lệnh Chẩn Đoán AI
              </>
            )}
          </button>
        </div>

        {/* Right Module - Diagnosis Clinical results & therapy guides */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Default instructions state if empty */}
          {!activeReport && !isScanning && (
            <div className="bg-stone-900/10 border border-stone-800 p-8 rounded-3xl text-center space-y-4">
              <div className="p-4 bg-stone-900/60 w-16 h-16 rounded-full flex items-center justify-center mx-auto border border-stone-800">
                <BrainCircuit className="h-8 w-8 text-stone-600" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="font-display font-medium text-stone-200 text-sm">Chưa có spec chẩn đoán nào được tải</h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Hãy thả ảnh nghi vấn sâu hại của bạn vào mô-đun máy quét ngoài ra hứa hẹn hoặc trải nghiệm tức thì phác đồ phục hồi bằng cách chọn các dịch bệnh mẫu ở trái màn hình.
                </p>
              </div>
            </div>
          )}

          {/* Beautiful dynamic scanning simulator overlay display */}
          {isScanning && (
            <div className="bg-stone-950 border border-stone-800 p-8 rounded-3xl space-y-6 animate-pulse">
              <div className="h-4 bg-stone-900 rounded-md w-1/4" />
              <div className="h-8 bg-stone-900 rounded-md w-3/4" />
              <div className="space-y-3 pt-4 border-t border-stone-800">
                <div className="h-3 bg-stone-900 rounded-md w-full" />
                <div className="h-3 bg-stone-900 rounded-md w-5/6" />
                <div className="h-3 bg-stone-900 rounded-md w-4/6" />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-6">
                <div className="h-10 bg-stone-900 rounded-xl" />
                <div className="h-10 bg-stone-900 rounded-xl" />
              </div>
            </div>
          )}

          {/* Active diagnostic medical file viewer */}
          {activeReport && (
            <div className="bg-stone-900/25 border border-stone-800 p-6 sm:p-8 rounded-3xl space-y-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />

              {/* Status Warning overlay if any api limits or simulated keys */}
              {warningMessage && (
                <div className="p-3 bg-amber-950/40 border border-amber-500/20 rounded-xl text-amber-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{warningMessage}</span>
                </div>
              )}

              {/* Patient Basic Specs Card */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-800/85 pb-5">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-emerald-500 tracking-wider">BỆNH ÁN THỰC VẬT #GL-{Math.floor(Math.random() * 8000 + 1000)}</span>
                  <h3 className="text-2xl font-display font-medium text-white tracking-tight">{activeReport.diseaseName}</h3>
                  <p className="text-xs text-stone-400">Đối tượng phát hiện: <strong className="text-stone-200">{activeReport.plantName}</strong></p>
                </div>
                
                {/* Severity Badge */}
                <div className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono uppercase tracking-wider font-semibold ${getSeverityBadgeClass(activeReport.severity)}`}>
                  Mức độ: {activeReport.severity}
                </div>
              </div>

              {/*Symptoms explanation block */}
              <div className="space-y-2">
                <h4 className="text-xs text-stone-400 font-mono uppercase tracking-widest">Triệu Chứng Bệnh Lâm Sàng</h4>
                <p className="text-xs text-stone-300 leading-relaxed bg-stone-950/40 p-4 rounded-xl border border-stone-850">
                  {activeReport.symptoms}
                </p>
              </div>

              {/* Actionable Remedies Checklist */}
              <div className="space-y-3">
                <h4 className="text-xs text-stone-400 font-mono uppercase tracking-widest">Phác Đồ Hồi Sinh Linh Thể Hữu Cơ</h4>
                <div className="grid grid-cols-1 gap-2.5">
                  {activeReport.treatment?.map((step: string, index: number) => (
                    <div key={index} className="flex gap-3 bg-stone-900/40 p-3.5 rounded-xl border border-stone-850/60 text-xs text-stone-300 leading-relaxed items-start">
                      <div className="flex items-center justify-center p-1 bg-emerald-950 rounded-lg border border-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                        <CheckCircle className="h-3.5 w-3.5" />
                      </div>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended organic remedies available in Shop */}
              {activeReport.recommendedProductIds && activeReport.recommendedProductIds.length > 0 && (
                <div className="pt-4 border-t border-stone-850 space-y-4">
                  <h4 className="text-xs text-stone-400 font-mono uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                    Sản phân sinh học hỗ trợ điều trị nhanh nhất
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {products
                      .filter((prod) => activeReport.recommendedProductIds.includes(prod.id))
                      .map((p) => (
                        <div
                          key={p.id}
                          className="bg-stone-950 border border-stone-850 p-3 rounded-2xl flex items-center gap-3.5 justify-between"
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-12 h-12 object-cover rounded-xl"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <span className="text-stone-300 text-[11px] font-semibold block line-clamp-1">{p.name}</span>
                              <span className="text-emerald-400 text-xs font-mono block mt-0.5">{p.price.toLocaleString("vi-VN")}₫</span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => onSelectProduct(p)}
                            className="p-2 border border-stone-800 hover:border-emerald-500 hover:bg-emerald-950/25 rounded-lg text-stone-400 hover:text-emerald-400 cursor-pointer transition-all"
                            title="Đọc mô tả chi tiết sản phẩm"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </div>

      {/* Historical diagnosis Logs tracking db */}
      {diagnosisLogs.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-stone-850">
          <h3 className="font-display font-bold text-white text-lg tracking-tight flex items-center gap-2">
            <History className="h-5 w-5 text-emerald-500" />
            Lịch Sử Đã Khám Bệnh Tại Vườn Của Bạn ({diagnosisLogs.length})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {diagnosisLogs.map((log) => (
              <div
                key={log.id}
                className="bg-stone-900/10 border border-stone-800 p-4 rounded-2xl relative overflow-hidden flex flex-col justify-between h-44"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-stone-500 font-semibold">{log.date}</span>
                    <span className={`px-2 py-0.5 rounded-md border text-[9px] uppercase ${getSeverityBadgeClass(log.severity)}`}>
                      {log.severity}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-stone-200 text-sm line-clamp-1">{log.diseaseName}</h4>
                    <span className="text-stone-500 text-[10px] italic">Đối tượng: {log.plantName}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-800/40">
                  <span className="text-[10px] text-stone-500 italic font-mono">Chẩn đoán hoàn thành</span>
                  <button
                    onClick={() => {
                      // Reload in report panel
                      setActiveReport({
                        plantName: log.plantName,
                        diseaseName: log.diseaseName,
                        severity: log.severity,
                        symptoms: log.symptoms,
                        treatment: log.treatment,
                        recommendedProductIds: log.recommendedProductIds,
                      });
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="text-xs text-emerald-400 hover:underline"
                  >
                    Mở lại hồ sơ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
