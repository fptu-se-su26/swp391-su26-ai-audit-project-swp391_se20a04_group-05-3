export function mapAccessoryCategory(catId: number | null): string {
  if (!catId) return "plants";
  if (catId === 1) return "plants"; // Pots/Chậu
  if (catId === 2) return "nutrients"; // Soil/Đất
  if (catId === 3) return "nutrients"; // Fertilizer/Phân bón
  if (catId === 4) return "smarthome"; // Tools/Dụng cụ
  return "plants";
}

export function mapPlantCategory(catId: number | null): string {
  if (!catId) return "plants";
  if (catId === 8) return "care"; // Moss/Rêu Java
  if (catId === 2 || catId === 6) return "plants"; // Hanging/Hồ điệp
  return "plants";
}
