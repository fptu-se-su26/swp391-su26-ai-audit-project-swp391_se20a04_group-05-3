import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDanger?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  onConfirm,
  onCancel,
  isDanger = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] w-full max-w-md rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl relative select-none"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 rounded-xl text-[var(--gl-text-muted)] hover:text-[var(--gl-text-primary)] hover:bg-[var(--gl-bg-muted)] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
          aria-label="Đóng hộp thoại"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Title & Icon */}
        <div className="flex items-center gap-3 pr-6">
          <div className={`p-2.5 rounded-2xl shrink-0 ${isDanger ? "bg-rose-500/10 text-[var(--gl-danger)] border border-rose-500/20" : "bg-[var(--gl-accent-soft)] text-[var(--gl-accent)] border border-[var(--gl-accent)]/20"}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h3 id="confirm-modal-title" className="text-base sm:text-lg font-bold text-[var(--gl-text-primary)] font-display tracking-tight leading-snug">
            {title}
          </h3>
        </div>

        {/* Message */}
        <div className="text-xs sm:text-sm text-[var(--gl-text-secondary)] leading-relaxed font-sans">
          {message}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 min-h-[44px] py-2.5 px-4 bg-[var(--gl-bg-muted)] hover:bg-[var(--gl-bg-elevated)] border border-[var(--gl-border)] text-[var(--gl-text-primary)] rounded-xl text-xs font-semibold cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] active:scale-[0.98]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 min-h-[44px] py-2.5 px-4 text-white font-bold uppercase text-xs tracking-wider rounded-xl cursor-pointer transition-all shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] active:scale-[0.98] ${
              isDanger
                ? "bg-rose-600 hover:bg-rose-700 dark:text-white"
                : "bg-[var(--gl-accent)] hover:bg-[var(--gl-accent-hover)] dark:text-emerald-950"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
