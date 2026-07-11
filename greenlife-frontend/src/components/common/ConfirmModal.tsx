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
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl relative">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-750 dark:hover:text-stone-250 transition-all cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Title & Icon */}
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl ${isDanger ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-display">
            {title}
          </h3>
        </div>

        {/* Message */}
        <div className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-sans">
          {message}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-semibold cursor-pointer transition-all"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-2.5 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all shadow-sm ${
              isDanger
                ? "bg-rose-600 hover:bg-rose-750 hover:shadow-rose-650/10"
                : "bg-emerald-600 hover:bg-emerald-750 hover:shadow-emerald-650/10"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
