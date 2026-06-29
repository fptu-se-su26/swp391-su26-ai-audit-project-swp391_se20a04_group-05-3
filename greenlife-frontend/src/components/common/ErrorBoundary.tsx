import React, { ErrorInfo, ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
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
        <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center p-6 text-stone-100 font-sans">
          <div className="max-w-md w-full text-center space-y-6 bg-stone-950 border border-stone-850 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/[0.01] rounded-full blur-2xl" />
            <div className="flex justify-center">
              <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-rose-500">
                <ShieldAlert className="h-12 w-12" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold font-display tracking-tight text-white">Đã xảy ra lỗi không mong muốn.</h2>
              <p className="text-xs text-stone-400">
                Hệ thống gặp sự cố tải tài nguyên hoặc lỗi giao diện. Vui lòng tải lại trang hoặc liên hệ bộ phận hỗ trợ.
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase rounded-xl text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 tracking-wider font-mono shadow-md shadow-emerald-500/10"
            >
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
