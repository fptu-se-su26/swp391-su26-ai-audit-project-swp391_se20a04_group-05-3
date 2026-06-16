import { DiagnosisLog, Product } from "../types";
import { MOCK_AI_DIAGNOSES, PRODUCTS } from "../data";

export class AIDiagnosisService {
  private static STORAGE_KEY = "greenlife_diagnosis_logs";

  private static async delay(ms = 600): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Retrieves diagnosis logs
   */
  public static async getDiagnosisLogs(): Promise<DiagnosisLog[]> {
    await this.delay(200);
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (err) {
        // Fallback
      }
    }
    // Seed initial on first use
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(MOCK_AI_DIAGNOSES));
    return MOCK_AI_DIAGNOSES;
  }

  /**
   * Evaluates plant photo uploading, producing health score, pathology diagnosis, & medical treatment recommendations
   */
  public static async diagnosePlantLeaf(
    plantName: string,
    imageUrl: string
  ): Promise<DiagnosisLog> {
    await this.delay(1200); // Higher delay to simulate real deep neural processing

    const logs = await this.getDiagnosisLogs();
    
    // Choose randomly from templates or compute a dynamic diagnosis matching user inputs
    const isWaterTrouble = plantName.toLowerCase().includes("sen") || plantName.toLowerCase().includes("suc");
    const matchedPreset = isWaterTrouble
      ? {
          diseaseName: "Thối nhũn tế bào cổ rễ (Fusarium Oxysporum)",
          severity: "nặng" as const,
          symptoms: "Lá mọng tầng sát đất chuyển vàng nhớt, cuống rỗng úng nước đen sẫm rụng rời rạc.",
          treatment: [
            "Cách ly khẩn cấp chậu cây ra khu vực riêng khô ráo thông thoáng cực cao.",
            "Dùng dao mổ hoả vô trùng xén bỏ 100% rễ nhũn thối đen hại.",
            "Tưới bôi vôi sát khuẩn hoặc nhúng nước rễ tỏi cô đặc.",
            "Thay toàn bộ đất sỏi ẩm ướt bằng xỉ than trộn sỏi nhẹ thoát nước siêu tốc."
          ],
          recommendedProductIds: ["prod-5"]
        }
      : {
          diseaseName: "Phấn trắng hại hoa lá (Sphaerotheca pannosa)",
          severity: "trung bình" as const,
          symptoms: "Bề mặt lá héo mệt phủ thảm trắng bụi cám li ti ngăn cản khả năng quang hợp hữu cơ cực đoan.",
          treatment: [
            "Tránh phun tưới nước ướt đọng tán lá vào buổi hoàng hôn tĩnh lặng.",
            "Pha 5ml Chế phẩm Dầu Neem Ép Lạnh GreenLife khuấy xà phòng hữu cơ xịt nhẹ.",
            "Cắt tỉa tầng nhánh sát đất tăng cường luồng lưu chuyển khí quyển tự nhiên."
          ],
          recommendedProductIds: ["prod-5"]
        };

    const newDiagnosis: DiagnosisLog = {
      id: `diag-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      plantName: plantName || "Cây cảnh ban công",
      diseaseName: matchedPreset.diseaseName,
      severity: matchedPreset.severity,
      symptoms: matchedPreset.symptoms,
      treatment: matchedPreset.treatment,
      recommendedProductIds: matchedPreset.recommendedProductIds,
      imageUrl,
      accuracy: Math.floor(Math.random() * 8) + 91, // 91% - 98% range
      notes: "Sơ bộ kiểm tra qua trí tuệ nhân tạo GreenLife AI. Để có phác đồ tối ưu, hãy đăng ký hội chẩn thêm cùng kỹ sư thực địa."
    };

    const updated = [newDiagnosis, ...logs];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    return newDiagnosis;
  }

  /**
   * Deletes a record from the cloud logs cache
   */
  public static async deleteRecordAndFreeMemory(id: string): Promise<DiagnosisLog[]> {
    await this.delay(300);
    const logs = await this.getDiagnosisLogs();
    const updated = logs.filter((l) => l.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    return updated;
  }
}
