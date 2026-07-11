import { API_BASE_URL } from "../config/env";

/**
 * Normalizes a media URL by prepending the API base URL if the path is relative.
 */
export function getMediaUrl(url?: string, defaultFallback = "https://images.unsplash.com/photo-1545241047-6083a3684587?w=600"): string {
  if (!url) {
    return defaultFallback;
  }

  // If it's already an absolute URL or base64, return it as-is
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }

  // Standardize relative paths starting with /
  const cleanPath = url.startsWith("/") ? url : `/${url}`;

  // Prepend API_BASE_URL
  const base = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  return `${base}${cleanPath}`;
}
