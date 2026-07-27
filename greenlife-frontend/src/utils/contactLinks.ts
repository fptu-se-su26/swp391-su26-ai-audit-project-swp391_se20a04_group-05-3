import toast from "react-hot-toast";

/**
 * Normalizes a Vietnamese phone number to a standard format (e.g. 0912345678).
 */
export function normalizeVietnamPhone(phone: string): string {
  if (!phone) return "";
  let clean = phone.trim().replace(/[\s\-\(\)\.]/g, "");
  
  if (clean.startsWith("+84")) {
    clean = "0" + clean.slice(3);
  } else if (clean.startsWith("84")) {
    clean = "0" + clean.slice(2);
  }
  
  return clean;
}

/**
 * Returns a tel: link URL for calling.
 */
export function getTelUrl(phone: string): string {
  const normalized = normalizeVietnamPhone(phone);
  return normalized ? `tel:${normalized}` : "#";
}

/**
 * Returns a Zalo contact link URL.
 */
export function getZaloContactUrl(phone: string): string {
  const normalized = normalizeVietnamPhone(phone);
  return normalized ? `https://zalo.me/${normalized}` : "#";
}

/**
 * Copies the phone number to clipboard and triggers a friendly toast.
 */
export async function copyPhoneToClipboard(phone: string): Promise<boolean> {
  const normalized = normalizeVietnamPhone(phone);
  if (!normalized) {
    toast.error("Số điện thoại không hợp lệ để sao chép.");
    return false;
  }
  try {
    await navigator.clipboard.writeText(normalized);
    toast.success(`Đã sao chép số điện thoại: ${normalized}`);
    return true;
  } catch (err) {
    toast.error("Không thể sao chép số điện thoại.");
    return false;
  }
}
