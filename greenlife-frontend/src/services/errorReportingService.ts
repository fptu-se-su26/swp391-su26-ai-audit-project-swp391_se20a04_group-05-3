import { logger } from "../utils/logger";

class ErrorReportingService {
  private static instance: ErrorReportingService;

  private constructor() {
    this.setupListeners();
  }

  public static initialize(): ErrorReportingService {
    if (!ErrorReportingService.instance) {
      ErrorReportingService.instance = new ErrorReportingService();
    }
    return ErrorReportingService.instance;
  }

  private setupListeners(): void {
    if (typeof window === "undefined") return;

    window.onerror = (message, source, lineno, colno, error) => {
      logger.error("Unhandled global error occurred:", {
        message,
        source,
        lineno,
        colno,
        error: error ? error.stack || error.message : null,
      });

      // Future integration placeholder (e.g., Sentry / LogRocket)
      // sendToLoggingServer({ message, source, lineno, colno, error });

      return false; // Let browser process standard error handling
    };

    window.onunhandledrejection = (event) => {
      logger.error("Unhandled promise rejection occurred:", {
        reason: event.reason ? event.reason.stack || event.reason.message || event.reason : "Unknown reason",
      });

      // Future integration placeholder (e.g., Sentry / LogRocket)
      // sendRejectionToLoggingServer(event.reason);
    };
  }
}

export const errorReportingService = ErrorReportingService;
