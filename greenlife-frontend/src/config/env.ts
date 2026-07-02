export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
export const APP_ENV = import.meta.env.MODE;
export const IS_DEV = APP_ENV === "development";
export const IS_PROD = APP_ENV === "production";
export const DEFAULT_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || "15000", 10);
