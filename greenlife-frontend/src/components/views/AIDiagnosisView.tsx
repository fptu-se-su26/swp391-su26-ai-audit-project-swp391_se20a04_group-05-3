import React, { useState, useRef, useEffect } from "react";
import { BrainCircuit, Upload, Sparkles, AlertTriangle, CheckCircle, RefreshCw, Eye, History, ArrowRight, Trash2 } from "lucide-react";
import { Product, DiagnosisLog } from "../../types";
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

  // Clear selected image
  const handleClearImage = () => {
    setSelectedFile(null);
    setFileBase64(null);
    setFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Convert File to base64
  const processUploadFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng tải lên tập tin hình ảnh chuẩn (PNG/JPG).");
      return;
    }

    // Reset previous report & warning when selecting a new valid image
    setActiveReport(null);
    setWarningMessage("");

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
      toast.error("Vui lòng tải lên file ảnh cây cần chẩn đoán.");
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
      toast.success("Chẩn đoán hình ảnh thành công!");

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
      toast.error("Không thể tải chi tiết hồ sơ chẩn đoán này.");
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
        return "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400";
      case "trung bình":
      case "MEDIUM":
        return "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400";
      case "nặng":
      case "HIGH":
      case "CRITICAL":
        return "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400";
      default:
        return "bg-[var(--gl-bg-muted)] border-[var(--gl-border)] text-[var(--gl-text-secondary)]";
    }
  };

  return (
    <div className="space-y-10 pb-20 text-[var(--gl-text-primary)]">
      
      {/* Intro Section */}
      <div className="space-y-2">
        <span className="text-xs text-[var(--gl-accent)] font-mono tracking-widest uppercase font-semibold">TRẠM CHẨN ĐOÁN CÔNG NGHỆ CAO</span>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-[var(--gl-text-primary)] tracking-tight flex items-center gap-2.5">
          <BrainCircuit className="h-8 w-8 text-[var(--gl-accent)] shrink-0" />
          Chẩn Đoán Bệnh Cây AI
        </h1>
        <p className="text-[var(--gl-text-secondary)] text-sm max-w-2xl leading-relaxed">
          Ứng dụng công nghệ AI sinh học phát hiện tự động hơn 150 loại vi nấm, rệp sâu, thối nhũn và sự cố dinh dưỡng. Giúp phân tích nguyên nhân và đề xuất hướng chăm sóc phù hợp.
        </p>
      </div>

      {/* Diagnosis Simulator Interface & Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Module - Image Upload & Preview Card (~40%) */}
        <div className="lg:col-span-5 lg:sticky lg:top-[140px] bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] p-5 sm:p-6 rounded-3xl space-y-5 shadow-xs">
          <h3 className="font-display font-semibold text-[var(--gl-text-muted)] text-xs tracking-wider uppercase font-mono flex items-center gap-2">
            <Upload className="w-4 h-4 text-[var(--gl-accent)] shrink-0" />
            TẢI ẢNH CÂY CẦN KIỂM TRA
          </h3>

          {/* Interactive Drag Drop or File Selector Container */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Tải lên hình ảnh cây cần chẩn đoán"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleSelectFileClick();
              }
            }}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={!fileBase64 ? handleSelectFileClick : undefined}
            className={`min-h-[250px] max-h-[320px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-5 transition-all relative overflow-hidden group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] ${
              isDragActive
                ? "border-[var(--gl-accent)] bg-[var(--gl-accent-soft)]/30"
                : fileBase64
                ? "border-[var(--gl-border)] bg-[var(--gl-bg-muted)]"
                : "border-[var(--gl-border)] hover:border-[var(--gl-accent)]/50 bg-[var(--gl-bg-muted)] cursor-pointer"
            }`}
          >
            {fileBase64 ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <img
                  src={getMediaUrl(fileBase64)}
                  alt="Ảnh cây cần chẩn đoán"
                  className="w-full max-h-52 object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                />
                
                {/* scanning laser animation — only while API is processing */}
                {isScanning && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none gl-scan-corners"
                  >
                    <div className="gl-scan-overlay" />
                    <div className="gl-scan-line" />
                  </div>
                )}

                {!isScanning && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearImage();
                    }}
                    className="px-3 py-1.5 min-h-[40px] text-xs font-semibold text-[var(--gl-text-secondary)] hover:text-[var(--gl-text-primary)] bg-[var(--gl-bg-surface)] hover:bg-[var(--gl-bg-elevated)] border border-[var(--gl-border)] rounded-xl transition-all cursor-pointer flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[var(--gl-text-muted)]" />
                    <span>Chọn ảnh khác</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="p-3.5 bg-[var(--gl-bg-surface)] rounded-2xl w-12 h-12 flex items-center justify-center mx-auto text-[var(--gl-text-muted)] group-hover:text-[var(--gl-accent)] group-hover:bg-[var(--gl-accent-soft)]/50 transition-all shadow-xs border border-[var(--gl-border)]">
                  <Upload className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[var(--gl-text-primary)]">Kéo thả ảnh cây vào đây</p>
                  <p className="text-[11px] text-[var(--gl-text-secondary)]">hoặc nhấn để chọn ảnh</p>
                  <p className="text-[10px] text-[var(--gl-text-muted)] font-mono pt-1">PNG, JPG (tối đa 10MB)</p>
                </div>
                <div className="p-2.5 bg-[var(--gl-accent-soft)]/30 border border-[var(--gl-accent)]/20 rounded-xl text-[10px] text-[var(--gl-accent)] font-medium">
                  💡 Nên chụp đủ sáng, rõ lá hoặc phần cây bị bệnh.
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
            type="button"
            onClick={executeDiagnosisProcess}
            disabled={isScanning || !selectedFile}
            className="w-full min-h-[44px] flex items-center justify-center gap-2 px-6 py-3 bg-[var(--gl-accent)] hover:bg-[var(--gl-accent-hover)] disabled:bg-[var(--gl-bg-muted)] disabled:text-[var(--gl-text-muted)] font-bold text-sm text-white dark:text-emerald-950 rounded-xl cursor-pointer transition-all shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] disabled:cursor-not-allowed"
          >
            {isScanning ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-white dark:text-emerald-950" />
                <span>GreenLife AI đang phân tích hình ảnh...</span>
              </>
            ) : (
              <>
                <BrainCircuit className="h-5 w-5" />
                <span>Phân tích ảnh bằng AI</span>
              </>
            )}
          </button>
        </div>

        {/* Right Module - Diagnosis Results & Reports (~60%) */}
        <div className="lg:col-span-7 space-y-6 min-w-0">
          
          {/* Default instructions state if empty */}
          {!activeReport && !isScanning && (
            <div className="bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] p-8 sm:p-10 rounded-3xl text-center space-y-4 shadow-xs">
              <div className="p-4 bg-[var(--gl-accent-soft)]/40 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto border border-[var(--gl-accent)]/20 text-[var(--gl-accent)]">
                <BrainCircuit className="h-8 w-8" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="font-display font-semibold text-[var(--gl-text-primary)] text-base">
                  Chưa có kết quả chẩn đoán
                </h3>
                <p className="text-xs text-[var(--gl-text-secondary)] leading-relaxed">
                  Tải lên ảnh rõ nét của lá, thân hoặc phần cây đang gặp vấn đề để GreenLife AI hỗ trợ phân tích.
                </p>
              </div>
            </div>
          )}

          {/* Dynamic scanning simulator skeleton */}
          {isScanning && (
            <div className="space-y-4">
              <div className="bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] p-6 rounded-3xl text-center">
                <div className="flex items-center justify-center gap-3 text-sm font-semibold text-[var(--gl-accent)]">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>GreenLife AI đang phân tích hình ảnh...</span>
                </div>
              </div>
              <CardSkeleton />
            </div>
          )}

          {/* ACTIVE DIAGNOSIS REPORT */}
          {activeReport && !isScanning && (
            <>
              {/* CASE A: NON-DIAGNOSABLE IMAGE (activeReport.diagnosable === false) */}
              {activeReport.diagnosable === false ? (
                <div className="bg-[var(--gl-bg-surface)] border border-amber-500/30 p-6 sm:p-8 rounded-3xl space-y-6 shadow-xs relative overflow-hidden">
                  {/* Status Badge & Header */}
                  <div className="space-y-3 border-b border-[var(--gl-border)] pb-5">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 inline-flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        CHƯA THỂ CHẨN ĐOÁN
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-display font-bold text-[var(--gl-text-primary)] tracking-tight break-words">
                      {activeReport.diseaseName || "Không thể nhận diện hình ảnh"}
                    </h3>
                    <p className="text-xs text-[var(--gl-text-secondary)] leading-relaxed break-words">
                      {activeReport.uncertaintyReason || activeReport.symptoms || "Hình ảnh không đủ cơ sở dữ liệu để đưa ra chẩn đoán chính xác."}
                    </p>
                    {(!activeReport.accuracy || activeReport.accuracy === 0) && (
                      <p className="text-[11px] text-[var(--gl-text-muted)] italic">
                        AI chưa có đủ dữ liệu để đưa ra chẩn đoán.
                      </p>
                    )}
                  </div>

                  {/* Checklist Hướng Dẫn Chụp Ảnh */}
                  <div className="space-y-3 bg-[var(--gl-bg-muted)] p-4 sm:p-5 rounded-2xl border border-[var(--gl-border)]">
                    <h4 className="text-xs font-bold text-[var(--gl-text-primary)] flex items-center gap-1.5 uppercase font-mono tracking-wider">
                      <Sparkles className="w-4 h-4 text-[var(--gl-accent)] shrink-0" />
                      Hướng dẫn chụp lại ảnh chuẩn xác:
                    </h4>
                    <div className="space-y-2.5 text-xs text-[var(--gl-text-secondary)]">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle className="w-4 h-4 text-[var(--gl-accent)] shrink-0 mt-0.5" />
                        <span>Chụp rõ lá, thân hoặc vùng cây đang nghi ngờ bị bệnh.</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <CheckCircle className="w-4 h-4 text-[var(--gl-accent)] shrink-0 mt-0.5" />
                        <span>Tránh ảnh chân dung, vật thể khác hoặc ảnh bị mờ nét.</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <CheckCircle className="w-4 h-4 text-[var(--gl-accent)] shrink-0 mt-0.5" />
                        <span>Đảm bảo đủ ánh sáng và cây chiếm phần lớn khung hình.</span>
                      </div>
                    </div>
                  </div>

                  {/* Unified CTA System for Non-Diagnosable */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={handleSelectFileClick}
                      className="flex-1 min-h-[44px] px-5 py-2.5 bg-[var(--gl-accent)] hover:bg-[var(--gl-accent-hover)] text-white dark:text-emerald-950 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] shadow-xs"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Chọn ảnh cây khác</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentPage("booking")}
                      className="flex-1 min-h-[44px] px-5 py-2.5 bg-[var(--gl-bg-muted)] hover:bg-[var(--gl-bg-elevated)] text-[var(--gl-text-primary)] border border-[var(--gl-border)] font-semibold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                    >
                      <span>Đặt lịch kiểm tra trực tiếp</span>
                    </button>
                  </div>

                  {/* Disclaimer Notice */}
                  {activeReport.disclaimer && (
                    <div className="pt-4 border-t border-[var(--gl-border)] text-[11px] text-[var(--gl-text-secondary)] leading-relaxed space-y-1">
                      <p className="flex items-start gap-1.5 italic">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{activeReport.disclaimer}</span>
                      </p>
                      {(activeReport.provider || activeReport.model) && (
                        <p className="font-mono text-[10px] text-[var(--gl-text-muted)] text-right">
                          Powered by {activeReport.provider || "Gemini"} {activeReport.model ? `(${activeReport.model})` : ""}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* CASE B: VALID DIAGNOSIS RESULT (activeReport.diagnosable !== false) */
                <div className="bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] p-6 sm:p-8 rounded-3xl space-y-6 shadow-xs relative overflow-hidden">
                  {/* Status Warning if any */}
                  {warningMessage && (
                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2 font-medium">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span className="break-words">{warningMessage}</span>
                    </div>
                  )}

                  {/* Urgent Warning if any */}
                  {activeReport.urgentWarning && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-[var(--gl-danger)] text-xs rounded-xl space-y-1">
                      <div className="font-bold flex items-center gap-2 uppercase font-mono tracking-wider">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
                        CẢNH BÁO KHẨN CẤP
                      </div>
                      <p className="leading-relaxed text-xs break-words">{activeReport.urgentWarning}</p>
                    </div>
                  )}

                  {/* Patient Header */}
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--gl-border)] pb-5">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono text-[var(--gl-accent)] tracking-wider font-bold uppercase">
                          BỆNH ÁN #GL-{activeReport.id}
                        </span>
                        {activeReport.accuracy !== undefined && activeReport.accuracy > 0 && (
                          <span className="text-[10px] font-semibold text-[var(--gl-accent)] bg-[var(--gl-accent-soft)] border border-[var(--gl-accent)]/20 px-2.5 py-0.5 rounded-full">
                            Độ tin cậy {activeReport.accuracy}%
                          </span>
                        )}
                      </div>
                      <h3 className="text-2xl font-display font-bold text-[var(--gl-text-primary)] tracking-tight break-words">
                        {activeReport.diseaseName}
                      </h3>
                      {activeReport.plantName && (
                        <p className="text-xs text-[var(--gl-text-secondary)]">
                          Đối tượng phát hiện: <strong className="text-[var(--gl-text-primary)]">{activeReport.plantName}</strong>
                        </p>
                      )}
                    </div>

                    {/* Severity Badge */}
                    {activeReport.severity && (
                      <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono uppercase tracking-wider font-semibold shrink-0 ${getSeverityBadgeClass(activeReport.severity)}`}>
                        Mức độ: {activeReport.severity}
                      </div>
                    )}
                  </div>

                  {/* Section 1: Tổng quan triệu chứng */}
                  {activeReport.symptoms && (
                    <div className="space-y-2">
                      <h4 className="text-xs text-[var(--gl-text-muted)] font-mono uppercase tracking-widest font-bold flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-[var(--gl-accent)]" />
                        Tổng quan triệu chứng
                      </h4>
                      <p className="text-xs text-[var(--gl-text-secondary)] leading-relaxed bg-[var(--gl-bg-muted)] p-4 rounded-xl border border-[var(--gl-border)] break-words">
                        {activeReport.symptoms}
                      </p>
                    </div>
                  )}

                  {/* Section 2: Dấu hiệu quan sát được */}
                  {activeReport.observedSymptoms && (
                    <div className="space-y-2">
                      <h4 className="text-xs text-[var(--gl-text-muted)] font-mono uppercase tracking-widest font-bold flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-[var(--gl-accent)]" />
                        Dấu hiệu quan sát được
                      </h4>
                      <p className="text-xs text-[var(--gl-text-secondary)] leading-relaxed bg-[var(--gl-bg-muted)] p-4 rounded-xl border border-[var(--gl-border)] break-words">
                        {activeReport.observedSymptoms}
                      </p>
                    </div>
                  )}

                  {/* Section 3: Nguyên nhân có thể */}
                  {activeReport.possibleCauses && (
                    <div className="space-y-2">
                      <h4 className="text-xs text-[var(--gl-text-muted)] font-mono uppercase tracking-widest font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-[var(--gl-accent)]" />
                        Nguyên nhân có thể
                      </h4>
                      <p className="text-xs text-[var(--gl-text-secondary)] leading-relaxed bg-[var(--gl-bg-muted)] p-4 rounded-xl border border-[var(--gl-border)] break-words">
                        {activeReport.possibleCauses}
                      </p>
                    </div>
                  )}

                  {/* Section 4: Hướng xử lý đề xuất (Phác đồ điều trị) */}
                  {((activeReport.treatmentSteps && activeReport.treatmentSteps.length > 0) || (activeReport.treatment && activeReport.treatment.length > 0)) && (
                    <div className="space-y-3">
                      <h4 className="text-xs text-[var(--gl-text-muted)] font-mono uppercase tracking-widest font-bold flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-[var(--gl-accent)]" />
                        Phác đồ điều trị đề xuất
                      </h4>
                      <div className="grid grid-cols-1 gap-2.5">
                        {(activeReport.treatmentSteps || activeReport.treatment).map((step: string, index: number) => (
                          <div key={index} className="flex gap-3 bg-[var(--gl-bg-muted)] p-3.5 rounded-xl border border-[var(--gl-border)] text-xs text-[var(--gl-text-secondary)] leading-relaxed items-start break-words">
                            <div className="flex items-center justify-center p-1 bg-[var(--gl-accent-soft)] rounded-lg border border-[var(--gl-accent)]/20 text-[var(--gl-accent)] shrink-0 mt-0.5">
                              <CheckCircle className="h-3.5 w-3.5" />
                            </div>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section 5: Biện pháp phòng ngừa */}
                  {activeReport.preventionSteps && activeReport.preventionSteps.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs text-[var(--gl-text-muted)] font-mono uppercase tracking-widest font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[var(--gl-accent)]" />
                        Biện pháp phòng ngừa chủ động
                      </h4>
                      <div className="grid grid-cols-1 gap-2.5">
                        {activeReport.preventionSteps.map((step: string, index: number) => (
                          <div key={index} className="flex gap-3 bg-[var(--gl-bg-muted)] p-3.5 rounded-xl border border-[var(--gl-border)] text-xs text-[var(--gl-text-secondary)] leading-relaxed items-start break-words">
                            <div className="flex items-center justify-center p-1 bg-[var(--gl-accent-soft)] rounded-lg border border-[var(--gl-accent)]/20 text-[var(--gl-accent)] shrink-0 mt-0.5">
                              <CheckCircle className="h-3.5 w-3.5" />
                            </div>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section 6: Recommended Products (if any) */}
                  {activeReport.recommendedProducts && activeReport.recommendedProducts.length > 0 && (
                    <div className="pt-4 border-t border-[var(--gl-border)] space-y-4">
                      <h4 className="text-xs text-[var(--gl-text-muted)] font-mono uppercase tracking-widest flex items-center gap-1.5 font-bold">
                        <Sparkles className="h-3.5 w-3.5 text-[var(--gl-accent)]" />
                        Sản phẩm đề xuất điều trị
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                            <div key={productToUse.id} className="bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] p-3 rounded-2xl flex items-center gap-3 justify-between shadow-xs">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img src={getMediaUrl(productToUse.image)} alt={productToUse.name} className="w-12 h-12 object-cover rounded-xl shrink-0" referrerPolicy="no-referrer" />
                                <div className="min-w-0">
                                  <span className="text-[var(--gl-text-primary)] text-[11px] font-semibold block truncate">{productToUse.name}</span>
                                  <span className="text-[var(--gl-accent)] text-xs font-mono block mt-0.5 font-bold">{productToUse.price.toLocaleString("vi-VN")}₫</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => onSelectProduct(productToUse as Product)}
                                className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 border border-[var(--gl-border)] hover:border-[var(--gl-accent)] hover:bg-[var(--gl-accent-soft)]/30 rounded-lg text-[var(--gl-text-muted)] hover:text-[var(--gl-accent)] cursor-pointer transition-all shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                                title="Xem sản phẩm"
                                aria-label="Xem sản phẩm"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Section 7: Expert Review Callout if requested */}
                  {activeReport.expertReviewRecommended && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold font-display">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>Khuyến nghị khảo sát thực địa</span>
                      </div>
                      <p className="text-[var(--gl-text-secondary)] text-[11px] leading-relaxed break-words">
                        Hệ thống AI khuyến nghị bạn nên đặt lịch dịch vụ khảo sát trực tiếp tại nhà để kiểm tra chính xác hơn.
                      </p>
                    </div>
                  )}

                  {/* Unified Secondary CTA Footer */}
                  <div className="pt-4 border-t border-[var(--gl-border)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <span className="text-[var(--gl-text-secondary)] text-center sm:text-left">
                      Cần hỗ trợ trực tiếp từ chuyên gia cây cảnh?
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentPage("booking")}
                      className="w-full sm:w-auto min-h-[44px] px-4 py-2 bg-[var(--gl-bg-muted)] hover:bg-[var(--gl-bg-elevated)] border border-[var(--gl-border)] text-[var(--gl-accent)] font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                    >
                      <span>Xem dịch vụ chăm sóc cây</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Disclaimer & Provider Metadata */}
                  <div className="pt-4 border-t border-[var(--gl-border)] text-[11px] text-[var(--gl-text-secondary)] leading-relaxed space-y-1">
                    {activeReport.disclaimer && (
                      <p className="flex items-start gap-1.5 italic">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{activeReport.disclaimer}</span>
                      </p>
                    )}
                    {(activeReport.provider || activeReport.model) && (
                      <p className="font-mono text-[10px] text-[var(--gl-text-muted)] text-right">
                        Powered by {activeReport.provider || "Gemini"} {activeReport.model ? `(${activeReport.model})` : ""}
                      </p>
                    )}
                  </div>

                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* Historical diagnosis Logs section */}
      {logs.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-[var(--gl-border)]">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-[var(--gl-accent)] shrink-0" />
            <h3 className="font-display font-bold text-[var(--gl-text-primary)] text-lg tracking-tight">
              Lịch sử chẩn đoán
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[var(--gl-accent-soft)] text-[var(--gl-accent)] border border-[var(--gl-accent)]/20">
              {logs.length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className="bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] p-4 rounded-2xl relative overflow-hidden flex flex-col justify-between h-44 shadow-xs"
              >
                <div className="space-y-2 min-w-0">
                  <div className="flex justify-between items-center text-[10px] font-mono gap-2">
                    <span className="text-[var(--gl-text-muted)] font-semibold truncate">{log.date}</span>
                    {log.diagnosable === false ? (
                      <span className="px-2 py-0.5 rounded-md border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] uppercase font-semibold shrink-0">
                        CHƯA THỂ CHẨN ĐOÁN
                      </span>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-md border text-[9px] uppercase font-semibold shrink-0 ${getSeverityBadgeClass(log.severity)}`}>
                        {log.severity}
                      </span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-semibold text-[var(--gl-text-primary)] text-sm truncate">{log.diseaseName}</h4>
                    <p className="text-[var(--gl-text-secondary)] text-[11px] truncate">Đối tượng: <span className="font-medium text-[var(--gl-text-primary)]">{log.plantName}</span></p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-[var(--gl-border)]">
                  <button
                    type="button"
                    onClick={() => handleOpenDetails(log.id)}
                    className="min-h-[40px] px-3 bg-[var(--gl-bg-muted)] hover:bg-[var(--gl-bg-elevated)] border border-[var(--gl-border)] text-xs text-[var(--gl-accent)] font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem lại kết quả</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleRequestDelete(log.id, e)}
                    className="w-10 h-10 flex items-center justify-center text-[var(--gl-danger)] hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                    title="Xóa hồ sơ bệnh án này"
                    aria-label="Xóa hồ sơ bệnh án này"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
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
