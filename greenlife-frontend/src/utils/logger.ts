const IS_PROD = import.meta.env.MODE === "production";

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

export const logger = {
  info: IS_PROD ? noop : (...args: any[]) => console.info(...args),
  warn: IS_PROD ? noop : (...args: any[]) => console.warn(...args),
  error: (...args: any[]) => console.error(...args),
};

export default logger;
