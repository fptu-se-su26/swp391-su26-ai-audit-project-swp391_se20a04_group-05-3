import { DiagnosisLog } from "../types";
import { HttpClient } from "./httpClient";

export class AIDiagnosisService {
  /**
   * Helper to translate backend DiagnosisResponse DTO into frontend DiagnosisLog
   */
  private static mapBackendToDiagnosisLog(backend: any): DiagnosisLog {
    // Translate severity: LOW -> "nhẹ", MEDIUM -> "trung bình", HIGH/CRITICAL -> "nặng"
    let severity: "nhẹ" | "trung bình" | "nặng" = "trung bình";
    if (backend.severity === "LOW") {
      severity = "nhẹ";
    } else if (backend.severity === "MEDIUM") {
      severity = "trung bình";
    } else if (backend.severity === "HIGH" || backend.severity === "CRITICAL") {
      severity = "nặng";
    }

    // Split recommendation by newline and remove list indicators (- , * , 1. , 2. )
    let treatment: string[] = [];
    if (backend.recommendation) {
      treatment = backend.recommendation
        .split("\n")
        .map((line: string) => {
          return line
            .replace(/^[-*\d.]+\s*/, "") // Strips lists markers like -, *, 1., 2.
            .trim();
        })
        .filter(Boolean);
    }

    return {
      id: String(backend.id),
      date: backend.createdAt ? backend.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
      plantName: "Plant Diagnosis",
      diseaseName: backend.diseaseName,
      severity,
      symptoms: backend.result,
      treatment,
      recommendedProductIds: [],
      imageUrl: backend.imageUrl || "",
      accuracy: backend.confidenceScore !== undefined ? Math.round(Number(backend.confidenceScore) * 100) : undefined,
      notes: backend.recommendation || ""
    };
  }

  /**
   * Retrieves diagnosis logs from the backend
   */
  public static async getDiagnosisLogs(
    page = 0,
    size = 10,
    signal?: AbortSignal
  ): Promise<{ content: DiagnosisLog[]; totalPages: number; number: number }> {
    const data = await HttpClient.get(`/api/diagnoses?page=${page}&size=${size}`, { signal });
    return {
      content: (data.content || []).map(this.mapBackendToDiagnosisLog),
      totalPages: data.totalPages || 0,
      number: data.number || 0
    };
  }

  /**
   * Evaluates plant photo uploading, producing health score and pathology diagnosis
   */
  public static async diagnosePlantLeaf(
    file: File | Blob,
    signal?: AbortSignal
  ): Promise<DiagnosisLog> {
    const formData = new FormData();
    formData.append("file", file);

    const data = await HttpClient.post("/api/diagnoses", formData, { signal });
    return this.mapBackendToDiagnosisLog(data);
  }

  /**
   * Stub delete method since customer role deletion is not exposed
   */
  public static async deleteRecordAndFreeMemory(id: string, signal?: AbortSignal): Promise<void> {
    return Promise.resolve();
  }
}
