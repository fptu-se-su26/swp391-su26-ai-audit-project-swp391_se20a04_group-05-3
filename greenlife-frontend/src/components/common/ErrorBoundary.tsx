import React, { ErrorInfo, ReactNode } from "react";
import { ShieldAlert, RotateCcw } from "lucide-react";
import { logger } from "../../utils/logger";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--gl-bg-page)] text-[var(--gl-text-primary)] flex flex-col items-center justify-center p-4 sm:p-6 font-sans select-none">
          <div className="max-w-md w-full text-center space-y-6 bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/[0.03] rounded-full blur-2xl pointer-events-none" />
            <div className="flex justify-center">
              <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-[var(--gl-danger)] inline-flex">
                <ShieldAlert className="h-10 w-10 sm:h-12 sm:w-12" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold font-display tracking-tight text-[var(--gl-text-primary)]">
                Đã xảy ra lỗi không mong muốn
              </h2>
              <p className="text-xs sm:text-sm text-[var(--gl-text-secondary)] leading-relaxed">
                Hệ thống gặp sự cố tải tài nguyên hoặc lỗi giao diện. Vui lòng tải lại trang hoặc liên hệ bộ phận hỗ trợ.
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full min-h-[44px] py-3 px-4 bg-[var(--gl-accent)] hover:bg-[var(--gl-accent-hover)] text-white dark:text-emerald-950 font-bold uppercase rounded-xl text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 tracking-wider font-mono shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] active:scale-[0.98]"
            >
              <RotateCcw className="h-4 w-4" />
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

export default ErrorBoundary;
