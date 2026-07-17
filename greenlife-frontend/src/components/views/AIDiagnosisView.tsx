import React, { useState, useRef, useEffect } from "react";
import { BrainCircuit, Upload, Sparkles, AlertTriangle, CheckCircle, RefreshCw, Eye, History, ArrowRight, Trash2 } from "lucide-react";
import { Product, DiagnosisLog } from "../../types";
import { ExpertCalloutBanner } from "./ExpertDirectoryView";
import { useAppContext } from "../../context/AppContext";
import { useDiagnosis } from "../../hooks/useDiagnosis";
import { AIDiagnosisService } from "../../services/aiDiagnosisService";
import { ConfirmModal } from "../common/ConfirmModal";
import { CardSkeleton } from "../common/Skeleton";
import { logger } from "../../utils/logger";
import { getMediaUrl } from "../../utils/mediaUrl";
import toast from "react-hot-toast";

interface AIDiagnosisViewProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  diagnosisLogs: DiagnosisLog[];
  onAddDiagnosisLog: (log: DiagnosisLog) => void;
}

export const AIDiagnosisView: React.FC<AIDiagnosisViewProps> = ({
  products,
  onSelectProduct,
  diagnosisLogs: propLogs,
  onAddDiagnosisLog,
}) => {
  const { setCurrentPage } = useAppContext();
  const { logs: hookLogs, diagnose, deleteRecord, isDiagnosing } = useDiagnosis();

  // Use hook logs if present, otherwise fall back to propLogs
  const logs = hookLogs && hookLogs.length > 0 ? hookLogs : propLogs;

  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const isScanning = isLocalLoading || isDiagnosing;

  const [activeReport, setActiveReport] = useState<any | null>(null);
  const [warningMessage, setWarningMessage] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Trigger file dialog
  const handleSelectFileClick = () => {
    fileInputRef.current?.click();
  };

  // Convert File to base64
  const processUploadFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng tải lên tập tin hình ảnh vườn tược chuẩn (PNG/JPG).");
      return;
    }

    setFileName(file.name);
    setSelectedFile(file);

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

  // Trigger diagnosis call to server api
  const executeDiagnosisProcess = async () => {
    if (!selectedFile) {
      toast.error("Vui lòng tải lên file ảnh lá cây của bạn.");
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLocalLoading(true);
    setWarningMessage("");
    setActiveReport(null);

    try {
      const logResult = await diagnose(selectedFile);

      if (fileBase64 && !logResult.imageUrl) {
        logResult.imageUrl = fileBase64;
      }

      setActiveReport(logResult);
      toast.success("Chẩn đoán bệnh lá thành công!");

    } catch (err: any) {
      if (err.name !== "AbortError") {
        logger.error("Diagnosis error:", err);
        toast.error(err.message || "Mạng kết nối không ổn định hoặc lỗi máy chủ xử lý ảnh.");
      }
    } finally {
      setIsLocalLoading(false);
    }
  };

  const handleOpenDetails = async (id: string) => {
    setIsLocalLoading(true);
    try {
      const fullLog = await AIDiagnosisService.getDiagnosisDetails(id);
      setActiveReport(fullLog);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      logger.error("Failed to load details:", err);
      toast.error("Không thể tải chi tiết hồ sơ bệnh án này.");
    } finally {
      setIsLocalLoading(false);
    }
  };

  const handleRequestDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTargetId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    const targetId = deleteTargetId;
    setDeleteTargetId(null);
    try {
      await deleteRecord(targetId);
      if (activeReport && String(activeReport.id) === String(targetId)) {
        setActiveReport(null);
      }
    } catch (err) {
      // Error message is handled by context toast
    }
  };

  const getSeverityBadgeClass = (sev: string) => {
    switch (sev) {
      case "nhẹ":
      case "LOW":
        return "bg-emerald-950/85 border-emerald-500/30 text-emerald-400";
      case "trung bình":
      case "MEDIUM":
        return "bg-amber-955/85 border-amber-500/30 text-amber-400";
      case "nặng":
      case "HIGH":
      case "CRITICAL":
        return "bg-rose-955/85 border-rose-500/30 text-rose-500";
      default:
        return "bg-stone-900 border-stone-800 text-stone-300";
    }
  };

  const translateEscalationReason = (reason: string) => {
    switch (reason) {
      case "NON_DIAGNOSABLE_IMAGE":
        return "Hình ảnh tải lên không chứa lá cây hoặc không đủ rõ để nhận diện bệnh hại.";
      case "CRITICAL_SEVERITY":
        return "Tình trạng bệnh của cây đang ở mức cực kỳ nghiêm trọng, cần xử lý trực tiếp gấp.";
      case "URGENT_WARNING":
        return "Có cảnh báo khẩn cấp về nguồn lây lan hoặc nguy cơ chết cây cao.";
      case "HIGH_SEVERITY":
        return "Cây bị bệnh hại nặng, việc tự điều trị tại nhà có thể không hiệu quả.";
      case "LOW_CONFIDENCE":
        return "Độ tin cậy của chẩn đoán AI thấp, cần chuyên gia xác thực thực địa.";
      default:
        return reason || "Cần ý kiến chuyên môn thực địa.";
    }
  };

  return (
    <div className="space-y-12 pb-20">
      
      {/* Intro Section */}
      <div className="space-y-2">
        <span className="text-xs text-emerald-500 font-mono tracking-widest uppercase">TRẠM CHẨN ĐOÁN CÔNG NGHỆ CAO</span>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-stone-100 tracking-tight flex items-center gap-2">
          <BrainCircuit className="h-8 w-8 text-emerald-400" />
          Chẩn Đoán Bệnh Cây AI
        </h1>
        <p className="text-stone-400 text-sm max-w-2xl leading-relaxed">
          Ứng dụng phát hiện tự động hơn 150 loại vi nấm, sâu xanh rệp, thối nhũn và sự cố dinh dưỡng hữu cơ nhờ AI sinh học. Đưa cây hồi sinh khỏe mạnh chỉ sau một phác đồ dứt điểm.
        </p>
      </div>

      {/* Diagnosis Simulator Interface & Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Module - Leaf scan terminal stage */}
        <div className="lg:col-span-5 bg-neutral-950 border border-stone-850 p-6 rounded-3xl space-y-6">
          <h3 className="font-display font-semibold text-stone-100 text-sm tracking-wider uppercase">Console Máy Quét Thực Địa</h3>

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
                  src={getMediaUrl(fileBase64)}
                  alt="Scanned specimen"
                  className="absolute inset-0 w-full h-full object-cover rounded-2xl opacity-75 group-hover:opacity-60 transition-opacity"
                  referrerPolicy="no-referrer"
                />
                
                {/* scanning laser beam */}
                {isScanning && (
                  <div className="absolute inset-x-0 top-0 h-1.5 bg-emerald-400 shadow-lg shadow-emerald-500/50 animate-[bounce_2s_infinite]" />
                )}

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

          {/* Big diagnostic trigger button */}
          <button
            onClick={executeDiagnosisProcess}
            disabled={isScanning || !selectedFile}
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
                  Hãy tải lên hoặc kéo thả ảnh lá cây cần kiểm tra vào khu vực máy quét ở phía bên trái.
                </p>
              </div>
            </div>
          )}

          {/* Beautiful dynamic scanning simulator overlay display */}
          {isScanning && (
            <CardSkeleton />
          )}

          {/* Active diagnostic medical file viewer */}
          {activeReport && !isScanning && (
            <div className="bg-stone-900/25 border border-stone-800 p-6 sm:p-8 rounded-3xl space-y-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />

              {/* Status Warning overlay if any api limits or simulated keys */}
              {warningMessage && (
                <div className="p-3 bg-amber-955/40 border border-amber-500/20 rounded-xl text-amber-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{warningMessage}</span>
                </div>
              )}

              {/* Urgent Warning if any */}
              {activeReport.urgentWarning && (
                <div className="p-4 bg-red-955/30 border border-red-500/40 text-red-200 text-xs rounded-xl space-y-1">
                  <div className="font-bold flex items-center gap-2 uppercase">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                    CẢNH BÁO KHẨN CẤP
                  </div>
                  <p className="leading-relaxed text-[11px]">{activeReport.urgentWarning}</p>
                </div>
              )}

              {/* Patient Basic Specs Card */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-800/85 pb-5">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-emerald-500 tracking-wider">
                    BỆNH ÁN THỰC VẬT #GL-{activeReport.id}
                  </span>
                  <h3 className="text-2xl font-display font-bold text-stone-100 tracking-tight">{activeReport.diseaseName}</h3>
                  <p className="text-xs text-stone-400">Đối tượng phát hiện: <strong className="text-stone-200">{activeReport.plantName}</strong></p>
                  {activeReport.accuracy !== undefined && (
                    <span className="inline-block text-[10px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-md mt-1">
                      Độ tin cậy: {activeReport.accuracy}%
                    </span>
                  )}
                </div>
                
                {/* Severity Badge */}
                <div className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono uppercase tracking-wider font-semibold ${getSeverityBadgeClass(activeReport.severity)}`}>
                  Mức độ: {activeReport.severity}
                </div>
              </div>

              {/* Diagnosability Warning (if diagnosable === false) */}
              {activeReport.diagnosable === false && (
                <div className="p-4 bg-rose-955/20 border border-rose-500/30 rounded-xl space-y-1">
                  <div className="text-rose-455 font-semibold text-xs flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    HỆ THỐNG AI KHÔNG THỂ CHẨN ĐOÁN XÁC ĐỊNH
                  </div>
                  <p className="text-stone-300 text-[11px] leading-relaxed">
                    Hình ảnh không đủ cơ sở dữ liệu để đưa ra chẩn đoán chính xác. 
                    {activeReport.uncertaintyReason && (
                      <span className="block mt-1 font-mono text-rose-455 text-[10px]">
                        LÝ DO: {activeReport.uncertaintyReason}
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Symptoms explanation block */}
              <div className="space-y-2">
                <h4 className="text-xs text-stone-400 font-mono uppercase tracking-widest">Triệu Chứng Bệnh Lâm Sàng</h4>
                <p className="text-xs text-stone-300 leading-relaxed bg-stone-950/40 p-4 rounded-xl border border-stone-850">
                  {activeReport.symptoms}
                </p>
              </div>

              {/* Observed Symptoms (if present) */}
              {activeReport.observedSymptoms && (
                <div className="space-y-2">
                  <h4 className="text-xs text-stone-400 font-mono uppercase tracking-widest">Triệu chứng quan sát được</h4>
                  <p className="text-xs text-stone-300 leading-relaxed bg-stone-950/40 p-4 rounded-xl border border-stone-850">
                    {activeReport.observedSymptoms}
                  </p>
                </div>
              )}

              {/* Possible Causes (if present) */}
              {activeReport.possibleCauses && (
                <div className="space-y-2">
                  <h4 className="text-xs text-stone-400 font-mono uppercase tracking-widest">Nguyên nhân có thể</h4>
                  <p className="text-xs text-stone-300 leading-relaxed bg-stone-950/40 p-4 rounded-xl border border-stone-850">
                    {activeReport.possibleCauses}
                  </p>
                </div>
              )}

              {/* Actionable Remedies Checklist (Treatment steps) */}
              {activeReport.treatmentSteps && activeReport.treatmentSteps.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-xs text-stone-400 font-mono uppercase tracking-widest">Phác Đồ Hồi Sinh Linh Thể Hữu Cơ</h4>
                  <div className="grid grid-cols-1 gap-2.5">
                    {activeReport.treatmentSteps.map((step: string, index: number) => (
                      <div key={index} className="flex gap-3 bg-stone-900/40 p-3.5 rounded-xl border border-stone-850/60 text-xs text-stone-300 leading-relaxed items-start">
                        <div className="flex items-center justify-center p-1 bg-emerald-950 rounded-lg border border-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                          <CheckCircle className="h-3.5 w-3.5" />
                        </div>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : activeReport.treatment && activeReport.treatment.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-xs text-stone-400 font-mono uppercase tracking-widest">Phác Đồ Hồi Sinh Linh Thể Hữu Cơ</h4>
                  <div className="grid grid-cols-1 gap-2.5">
                    {activeReport.treatment.map((step: string, index: number) => (
                      <div key={index} className="flex gap-3 bg-stone-900/40 p-3.5 rounded-xl border border-stone-850/60 text-xs text-stone-300 leading-relaxed items-start">
                        <div className="flex items-center justify-center p-1 bg-emerald-950 rounded-lg border border-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                          <CheckCircle className="h-3.5 w-3.5" />
                        </div>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Prevention Steps (if present) */}
              {activeReport.preventionSteps && activeReport.preventionSteps.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs text-stone-400 font-mono uppercase tracking-widest">Biện Pháp Phòng Ngừa Chủ Động</h4>
                  <div className="grid grid-cols-1 gap-2.5">
                    {activeReport.preventionSteps.map((step: string, index: number) => (
                      <div key={index} className="flex gap-3 bg-stone-900/40 p-3.5 rounded-xl border border-stone-850/60 text-xs text-stone-300 leading-relaxed items-start">
                        <div className="flex items-center justify-center p-1 bg-emerald-950 rounded-lg border border-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                          <CheckCircle className="h-3.5 w-3.5" />
                        </div>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended organic remedies available in Shop */}
              {activeReport.recommendedProducts && activeReport.recommendedProducts.length > 0 && (
                <div className="pt-4 border-t border-stone-850 space-y-4">
                  <h4 className="text-xs text-stone-400 font-mono uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                    Sản phẩm sinh học hỗ trợ điều trị nhanh nhất
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeReport.recommendedProducts.map((backendProd: any) => {
                      const localProduct = products.find((prod) => String(prod.id) === String(backendProd.id));
                      const productToUse = localProduct || {
                        id: String(backendProd.id),
                        name: backendProd.name,
                        price: backendProd.price,
                        image: backendProd.imageUrl || "",
                        description: backendProd.description || "",
                        category: "nutrients",
                        rating: 5,
                        ecoScore: 90,
                        details: [],
                        specs: {}
                      };
                      return (
                        <div
                          key={productToUse.id}
                          className="bg-stone-950 border border-stone-850 p-3 rounded-2xl flex items-center gap-3.5 justify-between"
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={getMediaUrl(productToUse.image)}
                              alt={productToUse.name}
                              className="w-12 h-12 object-cover rounded-xl"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <span className="text-stone-300 text-[11px] font-semibold block line-clamp-1">{productToUse.name}</span>
                              <span className="text-emerald-400 text-xs font-mono block mt-0.5">{productToUse.price.toLocaleString("vi-VN")}₫</span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => onSelectProduct(productToUse as Product)}
                            className="p-2 border border-stone-800 hover:border-emerald-500 hover:bg-emerald-950/25 rounded-lg text-stone-400 hover:text-emerald-400 cursor-pointer transition-all"
                            title="Đọc mô tả chi tiết sản phẩm"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recommended Services Section */}
              {activeReport.recommendedServices && activeReport.recommendedServices.length > 0 && (
                <div className="pt-4 border-t border-stone-850 space-y-4">
                  <h4 className="text-xs text-stone-400 font-mono uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                    Dịch vụ chăm sóc & kiểm tra đề xuất
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeReport.recommendedServices.map((service: any) => (
                      <div
                        key={service.id}
                        className="bg-stone-950 border border-stone-850 p-3 rounded-2xl flex flex-col justify-between gap-3 text-xs"
                      >
                        <div>
                          <span className="text-stone-300 text-[11px] font-semibold block line-clamp-1">{service.name}</span>
                          <span className="text-[10px] text-stone-500 block mt-0.5">Thời lượng: {service.durationMinutes} phút</span>
                          <p className="text-[10px] text-stone-400 line-clamp-2 mt-1">{service.description}</p>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-stone-850/60">
                          <span className="text-emerald-400 text-xs font-mono">{service.price.toLocaleString("vi-VN")}₫</span>
                          <button
                            onClick={() => setCurrentPage("booking")}
                            className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/20 hover:border-emerald-500/50 rounded-lg text-emerald-400 text-[10px] font-semibold cursor-pointer transition-all"
                          >
                            Đặt lịch ngay
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Visually Prioritized Expert Review Callout if requested */}
              {activeReport.expertReviewRecommended && (
                <div className="p-4 bg-amber-955/20 border border-amber-500/35 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold font-display">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Yêu cầu kiểm tra từ chuyên gia thực địa</span>
                  </div>
                  <p className="text-stone-300 text-[11px] leading-relaxed">
                    Hệ thống AI khuyến nghị bạn nên đặt lịch dịch vụ kiểm tra trực tiếp từ đội ngũ chuyên gia GreenLife để chẩn đoán chính xác hơn.
                    {activeReport.escalationReason && (
                      <span className="block mt-1 font-mono text-amber-500/90 text-[10px]">
                        LÝ DO: {translateEscalationReason(activeReport.escalationReason)}
                      </span>
                    )}
                  </p>
                  <div className="pt-1">
                    <button
                      onClick={() => setCurrentPage("booking")}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-bold rounded-lg cursor-pointer transition-all uppercase tracking-wider"
                    >
                      Đặt dịch vụ kiểm tra trực tiếp
                    </button>
                  </div>
                </div>
              )}

              {/* General Care Services CTA */}
              <div className="pt-4 border-t border-stone-850 flex justify-between items-center text-xs">
                <span className="text-stone-400">Bạn muốn chăm sóc cây tại nhà?</span>
                <button
                  onClick={() => setCurrentPage("booking")}
                  className="flex items-center gap-1 text-emerald-400 hover:text-emerald-350 hover:underline font-semibold cursor-pointer"
                >
                  Xem dịch vụ chăm sóc trực tiếp
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Expert Callout Banner */}
              <div className="mt-8 pt-6 border-t border-stone-850/80">
                <ExpertCalloutBanner onNavigateToDirectory={() => setCurrentPage("booking")} />
              </div>

              {/* Disclaimer and Watermark */}
              <div className="pt-4 border-t border-stone-850 space-y-2 text-[10px] text-stone-500">
                {activeReport.disclaimer && (
                  <p className="italic leading-relaxed">
                    ⚠️ {activeReport.disclaimer}
                  </p>
                )}
                {(activeReport.provider || activeReport.model) && (
                  <p className="font-mono text-right">
                    Powered by {activeReport.provider || "Gemini"} {activeReport.model ? `(${activeReport.model})` : ""}
                  </p>
                )}
              </div>

            </div>
          )}

        </div>
      </div>

      {/* Historical diagnosis Logs tracking db */}
      {logs.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-stone-850">
          <h3 className="font-display font-bold text-stone-100 text-lg tracking-tight flex items-center gap-2">
            <History className="h-5 w-5 text-emerald-500" />
            Lịch Sử Đã Khám Bệnh Tại Vườn Của Bạn ({logs.length})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {logs.map((log) => (
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
                  <div className="flex gap-3">
                    <button
                      onClick={(e) => handleRequestDelete(log.id, e)}
                      className="text-xs text-rose-500 hover:text-rose-455 font-medium cursor-pointer transition-colors"
                      title="Xóa hồ sơ bệnh án này"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenDetails(log.id)}
                      className="text-xs text-emerald-400 hover:underline font-semibold cursor-pointer"
                    >
                      Mở lại hồ sơ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirm deletion modal */}
      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Xác nhận xóa hồ sơ bệnh án"
        message="Bạn có chắc chắn muốn xóa hồ sơ chẩn đoán bệnh này không? Thao tác này không thể hoàn tác và hồ sơ sẽ bị xóa vĩnh viễn khỏi máy chủ."
        confirmLabel="Xác nhận xóa"
        cancelLabel="Hủy"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
        isDanger={true}
      />

    </div>
  );
};
