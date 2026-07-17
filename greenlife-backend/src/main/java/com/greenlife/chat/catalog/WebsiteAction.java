package com.greenlife.chat.catalog;

import com.greenlife.user.entity.User;
import java.util.Optional;

public enum WebsiteAction {
    NAV_HOME("nav_home", "Về Trang Chủ", "home", true, false, null),
    NAV_SHOP("nav_shop", "Đến Cửa Hàng Cây", "shop", true, false, null),
    NAV_AI_DIAGNOSIS("nav_ai_diagnosis", "Dùng Bác Sĩ Cây AI", "ai-diagnosis", true, false, null),
    NAV_BOOKING("nav_booking", "Đặt Dịch Vụ Chăm Sóc Cây", "booking", true, false, null),
    NAV_BLOG("nav_blog", "Đọc Cẩm Nang Xanh", "blog", true, false, null),
    NAV_AUTH("nav_auth", "Đăng Nhập / Đăng Ký", "auth", true, true, null),
    NAV_CUSTOMER_DASHBOARD("nav_customer_dashboard", "Hồ Sơ Của Tôi", "customer-dashboard", false, false, null),
    NAV_STORE_REGISTER("nav_store_register", "Đăng Ký Bán Hàng", "store-profile-setup", false, false, "CUSTOMER"),
    NAV_STORE_DASHBOARD("nav_store_dashboard", "Quản Lý Cửa Hàng", "store-dashboard", false, false, "STORE_OWNER");

    private final String actionId;
    private final String label;
    private final String currentPage;
    private final boolean isPublic;
    private final boolean guestOnly;
    private final String requiredRole;

    WebsiteAction(String actionId, String label, String currentPage, boolean isPublic, boolean guestOnly, String requiredRole) {
        this.actionId = actionId;
        this.label = label;
        this.currentPage = currentPage;
        this.isPublic = isPublic;
        this.guestOnly = guestOnly;
        this.requiredRole = requiredRole;
    }

    public String getActionId() { return actionId; }
    public String getLabel() { return label; }
    public String getCurrentPage() { return currentPage; }
    public boolean isPublic() { return isPublic; }
    public boolean isGuestOnly() { return guestOnly; }
    public String getRequiredRole() { return requiredRole; }

    public static Optional<WebsiteAction> fromActionId(String actionId) {
        if (actionId == null) return Optional.empty();
        for (WebsiteAction action : values()) {
            if (action.actionId.equalsIgnoreCase(actionId.trim())) {
                return Optional.of(action);
            }
        }
        return Optional.empty();
    }

    public static boolean isValidPage(String page) {
        if (page == null) return false;
        String trimmed = page.trim();
        for (WebsiteAction action : values()) {
            if (action.currentPage.equalsIgnoreCase(trimmed)) {
                return true;
            }
        }
        if (trimmed.equalsIgnoreCase("admin-dashboard")) {
            return true;
        }
        return false;
    }

    public boolean isAllowedFor(User user) {
        if (user == null) {
            return isPublic;
        } else {
            if (guestOnly) {
                return false;
            }
            if (requiredRole == null) {
                return true;
            }
            if (user.getRole() == null || user.getRole().getName() == null) {
                return false;
            }
            String roleName = user.getRole().getName().toUpperCase();
            if (this == NAV_STORE_DASHBOARD) {
                return roleName.equals("STORE_OWNER") || roleName.equals("ADMIN");
            }
            return roleName.equals(requiredRole.toUpperCase());
        }
    }
}
