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

    // Fallback treatment extraction if backend.treatmentSteps is empty
    let treatment: string[] = backend.treatmentSteps || [];
    if (treatment.length === 0 && backend.recommendation) {
      treatment = backend.recommendation
        .split("\n")
        .map((line: string) => {
          return line
            .replace(/^[-*\d.]+\s*/, "") // Strips lists markers like -, *, 1., 2.
            .trim();
        })
        .filter(Boolean);
    }

    const confidence = backend.confidenceScore !== undefined ? Number(backend.confidenceScore) : undefined;
    const accuracy = confidence !== undefined ? (confidence <= 1.0 ? Math.round(confidence * 100) : Math.round(confidence)) : undefined;

    return {
      id: String(backend.id),
      date: backend.createdAt ? backend.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
      plantName: backend.plantName || "Cây cảnh",
      diseaseName: backend.diseaseName || "",
      severity,
      symptoms: backend.result || "",
      treatment,
      recommendedProductIds: (backend.recommendedProducts || []).map((p: any) => String(p.id)),
      imageUrl: backend.imageUrl || "",
      accuracy,
      notes: backend.recommendation || "",

      // Structured backend fields
      diagnosable: backend.diagnosable !== undefined ? backend.diagnosable : true,
      uncertaintyReason: backend.uncertaintyReason || null,
      observedSymptoms: backend.observedSymptoms || null,
      possibleCauses: backend.possibleCauses || null,
      alternativeDiagnoses: backend.alternativeDiagnoses || [],
      treatmentSteps: backend.treatmentSteps || [],
      preventionSteps: backend.preventionSteps || [],
      urgentWarning: backend.urgentWarning || null,
      disclaimer: backend.disclaimer || "",
      expertReviewRecommended: backend.expertReviewRecommended !== undefined ? backend.expertReviewRecommended : false,
      escalationReason: backend.escalationReason || null,
      recommendedProducts: backend.recommendedProducts || [],
      recommendedServices: backend.recommendedServices || [],
      provider: backend.provider || null,
      model: backend.model || null
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
      content: (data.content || []).map(this.mapBackendToDiagnosisLog.bind(this)),
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
   * Retrieves details for a specific diagnosis record
   */
  public static async getDiagnosisDetails(id: string, signal?: AbortSignal): Promise<DiagnosisLog> {
    const data = await HttpClient.get(`/api/diagnoses/${id}`, { signal });
    return this.mapBackendToDiagnosisLog(data);
  }

  /**
   * Deletes a diagnosis record by ID via customer API
   */
  public static async deleteRecordAndFreeMemory(id: string, signal?: AbortSignal): Promise<void> {
    await HttpClient.delete(`/api/diagnoses/${id}`, { signal });
  }
}
