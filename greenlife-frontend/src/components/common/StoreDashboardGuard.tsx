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
  const { stores, currentUser } = useAppContext();
  
  // Decide loading based on whether user is STORE_OWNER ("store" role in frontend)
  const isStoreOwner = currentUser?.role === "store";
  
  const [loading, setLoading] = useState(isStoreOwner);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!isStoreOwner) {
      setLoading(false);
      return;
    }

    const abortController = new AbortController();

    const checkStoreProfile = async () => {
      try {
        const data = await HttpClient.get<any>("/api/store/profile", {
          signal: abortController.signal,
        });
        if (data && data.status === "APPROVED") {
          setVerified(true);
        } else {
          setVerified(false);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          logger.error("Lỗi khi kiểm tra hồ sơ cửa hàng:", err);
          setVerified(false);
        }
      } finally {
        setLoading(false);
      }
    };

    checkStoreProfile();

    return () => {
      abortController.abort();
    };
  }, [isStoreOwner]);

  // Non-store owners fallback to existing mock stores check behavior
  if (!isStoreOwner) {
    const myStore = stores.find((s) => s.ownerEmail === currentUser?.email);
    if (!myStore || !myStore.verified) {
      return <StoreProfileSetupView />;
    }
    return (
      <StoreDashboardView
        products={products}
        onAddProduct={onAddProduct}
      />
    );
  }

  // Store owners checking logic
  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <DashboardSkeleton />
      </div>
    );
  }

  if (!verified) {
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
