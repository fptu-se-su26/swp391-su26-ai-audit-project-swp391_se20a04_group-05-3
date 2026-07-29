import React, { useEffect, useState, useRef, useCallback } from "react";
import { CheckCircle2, XCircle, ArrowRight, RefreshCw, AlertTriangle } from "lucide-react";
import { OrderService, PayOSPaymentStatusResponse } from "../../services/orderService";
import { useCart } from "../../hooks/useCart";
import { toast } from "react-hot-toast";

interface PaymentStatusViewProps {
  type: "success" | "cancel";
  setCurrentPage: (page: string) => void;
}

const MAX_STATUS_RETRIES = 5;
const RETRY_INTERVAL_MS = 3000;

export const PaymentStatusView: React.FC<PaymentStatusViewProps> = ({ type, setCurrentPage }) => {
  const [loading, setLoading] = useState(false);
  const [statusData, setStatusData] = useState<PayOSPaymentStatusResponse | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { loadCart } = useCart();

  const hasRefreshedCartRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const queryParams = new URLSearchParams(window.location.search);
  const orderCode = queryParams.get("orderCode") || queryParams.get("orderId");

  const checkStatus = useCallback(async () => {
    if (!orderCode) return;
    setLoading(true);
    try {
      const res = await OrderService.getPayOSPaymentStatus(orderCode);
      setStatusData(res);

      if (res && res.paymentStatus === "PAID") {
        if (!hasRefreshedCartRef.current) {
          hasRefreshedCartRef.current = true;
          await loadCart();
        }
      } else if (res && (res.paymentStatus === "PENDING" || res.paymentStatus === "PROCESSING")) {
        setRetryCount(prev => {
          const next = prev + 1;
          if (next < MAX_STATUS_RETRIES) {
            timerRef.current = setTimeout(() => {
              checkStatus();
            }, RETRY_INTERVAL_MS);
          }
          return next;
        });
      }
    } catch (err: any) {
      toast.error("Không thể tải trạng thái đơn hàng: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  }, [orderCode, loadCart]);

  useEffect(() => {
    if (orderCode && type === "success") {
      checkStatus();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [orderCode, type, checkStatus]);

  const isVerifiedPaid = statusData?.paymentStatus === "PAID";
  const isPending = !statusData || statusData.paymentStatus === "PENDING" || statusData.paymentStatus === "PROCESSING";

  return (
    <div className="max-w-md mx-auto my-12 p-8 bg-stone-900 border border-stone-800 rounded-3xl text-center space-y-6 shadow-2xl text-stone-100">
      {type === "cancel" ? (
        <div className="space-y-4">
          <div className="flex justify-center">
            <XCircle className="w-16 h-16 text-rose-500 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-rose-400">Bạn đã hủy thanh toán</h2>
          <p className="text-sm text-stone-400 leading-relaxed">
            Giao dịch thanh toán qua cổng PayOS đã bị hủy bỏ. Bạn có thể tiến hành thanh toán lại từ lịch sử đơn hàng bất cứ lúc nào.
          </p>

          <div className="pt-4 space-y-2">
            <button
              type="button"
              onClick={() => {
                window.history.replaceState({}, document.title, "/");
                setCurrentPage("customer-dashboard");
              }}
              className="w-full flex items-center justify-center gap-2 py-3 min-h-[44px] bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 font-bold uppercase rounded-xl cursor-pointer transition-all text-[11px] tracking-wider font-mono"
            >
              Quay lại lịch sử mua hàng
            </button>

            <button
              type="button"
              onClick={() => {
                window.history.replaceState({}, document.title, "/");
                setCurrentPage("shop");
              }}
              className="w-full text-center py-2 min-h-[40px] text-xs text-stone-500 hover:text-stone-300 font-medium cursor-pointer"
            >
              Tiếp tục mua sắm
            </button>
          </div>
        </div>
      ) : !orderCode ? (
        <div className="space-y-4">
          <div className="flex justify-center">
            <AlertTriangle className="w-16 h-16 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-amber-400">Chưa thể xác minh đơn hàng</h2>
          <p className="text-sm text-stone-400 leading-relaxed">
            Không tìm thấy thông tin mã đơn hàng để xác thực trạng thái thanh toán. Vui lòng kiểm tra lại trong lịch sử đơn hàng của bạn.
          </p>
          <button
            type="button"
            onClick={() => {
              window.history.replaceState({}, document.title, "/");
              setCurrentPage("customer-dashboard");
            }}
            className="w-full flex items-center justify-center gap-2 py-3 min-h-[44px] bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 font-bold uppercase rounded-xl cursor-pointer transition-all text-[11px] tracking-wider font-mono"
          >
            Xem lịch sử đơn hàng
          </button>
        </div>
      ) : isVerifiedPaid ? (
        <div className="space-y-4">
          <div className="flex justify-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 animate-bounce" />
          </div>
          <h2 className="text-2xl font-bold text-emerald-400">Thanh toán thành công!</h2>
          <p className="text-sm text-stone-400 leading-relaxed">
            Hệ thống đã xác nhận giao dịch thanh toán thành công thông qua cổng PayOS. Đơn hàng của bạn đang được chuẩn bị.
          </p>

          {statusData && (
            <div className="bg-stone-950/60 p-4 rounded-2xl border border-stone-800 font-mono text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500">MÃ ĐƠN HÀNG:</span>
                <span className="font-bold text-stone-300 break-all">#{statusData.orderCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">SỐ TIỀN:</span>
                <span className="font-bold text-amber-500">{statusData.amount?.toLocaleString("vi-VN")} VND</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">TRẠNG THÁI:</span>
                <span className="font-bold uppercase text-emerald-400">Đã thanh toán</span>
              </div>
            </div>
          )}

          <div className="pt-4">
            <button
              type="button"
              onClick={() => {
                window.history.replaceState({}, document.title, "/");
                setCurrentPage("customer-dashboard");
              }}
              className="w-full flex items-center justify-center gap-2 py-3 min-h-[44px] bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold uppercase rounded-xl cursor-pointer transition-all text-[11px] tracking-wider font-mono shadow-sm"
            >
              Xem lịch sử đơn hàng
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-center">
            <RefreshCw className="w-16 h-16 text-amber-500 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-amber-400">Đang xác nhận thanh toán</h2>
          <p className="text-sm text-stone-400 leading-relaxed">
            Hệ thống đang xác minh phản hồi thanh toán với cổng PayOS. Quá trình này có thể mất vài giây.
          </p>

          {statusData && (
            <div className="bg-stone-950/60 p-4 rounded-2xl border border-stone-800 font-mono text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500">MÃ ĐƠN HÀNG:</span>
                <span className="font-bold text-stone-300 break-all">#{statusData.orderCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">TRẠNG THÁI:</span>
                <span className="font-bold uppercase text-amber-500">
                  {isPending ? `Đang xử lý (Lần thử ${retryCount}/${MAX_STATUS_RETRIES})` : statusData.paymentStatus}
                </span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => checkStatus()}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 min-h-[44px] bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 font-bold uppercase rounded-xl cursor-pointer transition-all text-[11px] tracking-wider font-mono disabled:opacity-50"
          >
            {loading ? "Đang cập nhật..." : "Cập nhật trạng thái"}
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                window.history.replaceState({}, document.title, "/");
                setCurrentPage("customer-dashboard");
              }}
              className="w-full text-center py-2 text-xs text-stone-500 hover:text-stone-300 font-medium cursor-pointer"
            >
              Xem lịch sử mua hàng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
