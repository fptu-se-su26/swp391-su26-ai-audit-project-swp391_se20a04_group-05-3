import React from "react";
import { ShieldAlert, Key, Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { Button } from "./ui/Button";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Array<"customer" | "store" | "admin">;
  onPageRedirect?: (page: string) => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  onPageRedirect,
}) => {
  const { role, switchRole } = useAuth();
  const isAllowed = allowedRoles.includes(role);

  if (!isAllowed) {
    // Generate an beautiful design for Access Denied sandbox experience
    return (
      <div className="max-w-md mx-auto my-12 bg-stone-950 border border-rose-900/40 p-8 rounded-3xl space-y-6 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/[0.02] rounded-full blur-2xl" />
        
        <div className="inline-flex p-4 bg-rose-950/45 border border-rose-500/20 rounded-2xl text-rose-400 mx-auto">
          <ShieldAlert className="h-8 w-8 text-rose-400" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-display font-bold text-white tracking-tight">Quyền Truy Cập Bị Hạn Chế</h3>
          <p className="text-stone-400 text-xs leading-relaxed">
            Khu vực này yêu cầu cấp đặc quyền bảo mật cấp bậc <strong className="text-rose-400 uppercase">{allowedRoles.join(" / ")}</strong>. 
            Tài khoản hiện tại của bạn là <strong className="text-stone-300 uppercase">{role}</strong> không có quyền can thiệp hệ thống này.
          </p>
        </div>

        {/* Sandbox fast bypass controls */}
        <div className="bg-stone-900/60 p-4 rounded-2xl border border-stone-850 space-y-3">
          <span className="text-[10px] text-stone-500 font-mono tracking-wider block uppercase">GIẢ LẬP NHANH QUYỀN TRUY CẬP:</span>
          <div className="flex justify-center gap-2">
            {allowedRoles.map((r) => (
              <Button
                key={r}
                variant="outline"
                size="xs"
                onClick={async () => {
                  await switchRole(r);
                  if (onPageRedirect) {
                    if (r === "customer") onPageRedirect("customer-dashboard");
                    else if (r === "store") onPageRedirect("store-dashboard");
                    else if (r === "admin") onPageRedirect("admin-dashboard");
                  }
                }}
              >
                Gán Quyền {r === "customer" ? "Khách VIP" : r === "store" ? "Đối tác" : "Tổng Admin"}
              </Button>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-stone-900">
          <Button
            variant="ghost"
            size="sm"
            className="text-stone-400 hover:text-white inline-flex items-center gap-1.5"
            onClick={() => onPageRedirect && onPageRedirect("home")}
          >
            Quay về trang chủ an toàn
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
export default ProtectedRoute;
