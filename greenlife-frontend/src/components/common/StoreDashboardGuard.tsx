import React, { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import { Product } from "../../types";
import { HttpClient } from "../../services/httpClient";
import { logger } from "../../utils/logger";
import { DashboardSkeleton } from "./Skeleton";

interface StoreDashboardGuardProps {
  products: Product[];
  onAddProduct: (p: Product) => void;
}

const StoreDashboardView = React.lazy(() =>
  import("../views/StoreDashboardView").then((m) => ({ default: m.StoreDashboardView }))
);
const StoreProfileSetupView = React.lazy(() =>
  import("../views/StoreProfileSetupView").then((m) => ({ default: m.StoreProfileSetupView }))
);

export const StoreDashboardGuard: React.FC<StoreDashboardGuardProps> = ({
  products,
  onAddProduct,
}) => {
  const { currentUser } = useAppContext();
  const [storeState, setStoreState] = useState<"loading" | "none" | "pending" | "approved" | "rejected">("loading");
  const [rejectReason, setRejectReason] = useState<string>("");

  useEffect(() => {
    if (!currentUser) {
      setStoreState("none");
      return;
    }

    const abortController = new AbortController();

    const checkStore = async () => {
      try {
        const data = await HttpClient.get<any>("/api/store/profile", {
          signal: abortController.signal,
        });
        if (data) {
          if (data.status === "APPROVED") {
            setStoreState("approved");
          } else if (data.status === "PENDING") {
            setStoreState("pending");
          } else if (data.status === "REJECTED") {
            setStoreState("rejected");
            setRejectReason(data.reason || "Hồ sơ không hợp lệ");
          } else {
            setStoreState("none");
          }
        } else {
          setStoreState("none");
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          // If no store is registered or any error, fallback to none
          setStoreState("none");
        }
      }
    };

    checkStore();

    return () => {
      abortController.abort();
    };
  }, [currentUser]);

  if (storeState === "loading") {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <DashboardSkeleton />
      </div>
    );
  }

  if (storeState === "pending") {
    return (
      <div className="p-6 max-w-2xl mx-auto mt-10">
        <div className="bg-[var(--gl-bg-surface)] rounded-2xl shadow-xl p-8 border border-[var(--gl-border)] text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 border border-amber-500/20">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-[var(--gl-text-primary)]">Hồ sơ cửa hàng đang chờ duyệt</h2>
            <p className="text-[var(--gl-text-secondary)] text-sm md:text-base leading-relaxed">
              Thông tin đăng ký của bạn đã được gửi thành công và đang trong quá trình kiểm duyệt. 
              Ban quản trị GreenLife sẽ xác minh tài liệu KYC của bạn trong vòng 24-48 giờ.
            </p>
          </div>
          <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20 text-left text-xs md:text-sm text-amber-600 dark:text-amber-400">
            <span className="font-semibold">Lưu ý:</span> Bạn sẽ nhận được quyền truy cập đầy đủ vào trang quản trị ngay sau khi tài khoản được phê duyệt và nâng cấp thành chủ cửa hàng (STORE_OWNER).
          </div>
        </div>
      </div>
    );
  }

  if (storeState === "rejected") {
    return (
      <div className="p-6 max-w-2xl mx-auto mt-10">
        <div className="bg-[var(--gl-bg-surface)] rounded-2xl shadow-xl p-8 border border-rose-500/20 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center text-[var(--gl-danger)] border border-rose-500/20">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-[var(--gl-text-primary)]">Hồ sơ đăng ký bị từ chối</h2>
            <p className="text-[var(--gl-danger)] text-sm font-semibold">
              Lý do từ chối: {rejectReason}
            </p>
            <p className="text-[var(--gl-text-secondary)] text-sm">
              Vui lòng cập nhật lại thông tin đăng ký hoặc tài liệu KYC của bạn để gửi yêu cầu phê duyệt mới.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setStoreState("none")}
              className="px-6 py-2.5 min-h-[44px] bg-[var(--gl-accent)] hover:bg-[var(--gl-accent-hover)] text-white dark:text-emerald-950 font-bold rounded-xl transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] shadow-sm"
            >
              Chỉnh sửa thông tin đăng ký
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (storeState === "none") {
    return <StoreProfileSetupView />;
  }

  return (
    <StoreDashboardView
      products={products}
      onAddProduct={onAddProduct}
    />
  );
};

export default StoreDashboardGuard;
