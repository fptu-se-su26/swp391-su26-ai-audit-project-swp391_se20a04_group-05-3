import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Simulate database or ML model query delays
    await new Promise(resolve => setTimeout(resolve, 800));

    // High fidelity simulated response matching original application data structure
    return NextResponse.json({
      plantName: 'Monstera Deliciosa (Trầu Bà Nam Mỹ)',
      healthStatus: 'Bệnh đốm lá rỉ sắt',
      diagnosis: 'Dựa trên hình ảnh phân tích từ camera di động, AI phát hiện nhiều đốm vàng viền nâu đậm phân bố rải rác trên phiến lá. Dấu hiệu đặc trưng này cho thấy cây đang mắc bệnh đốm lá (Rust spot) do nấm nứt bào tử gây ra dưới điều kiện khí hậu nóng ẩm, ít gió.',
      confidence: 0.97,
      treatmentSteps: [
        'Cách ly cây bệnh ngay lập tức để tránh lây lan nấm bào tử sang các chậu cây khỏe mạnh khác trong vườn.',
        'Dùng kéo chuyên dụng đã sát trùng cẩn thận bằng cồn để cắt bỏ sạch những lá có vết đốm nhiễm nấm nặng. Gom lá bệnh bỏ vào túi nilon buộc kín vứt sọt rác.',
        'Phun dung dịch diệt nấm hữu cơ (như tinh dầu Neem pha loãng hoặc baking soda hòa với nước) đều lên cả mặt trên và mặt dưới của các lá còn lại.',
        'Giảm tần suất tưới nước. Chỉ tưới trực tiếp vào đất quanh gốc, tránh phun nước ướt đẫm phiến lá. Chuyển chậu cây ra khu vực hứng ánh sáng tán xạ dịu nhẹ và thông gió tốt hơn.'
      ],
      recommendations: [
        'Duy trì độ ẩm môi trường quanh phòng ở mức ổn định 50-60%.',
        'Bật quạt gió nhẹ hoặc mở cửa sổ để luân chuyển không khí thường xuyên.',
        'Hạn chế tưới cây vào buổi chiều tối muộn để tránh nước đọng lâu trên lá qua đêm.'
      ]
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Yêu cầu chẩn đoán không hợp lệ hoặc thiếu dữ liệu hình ảnh.' },
      { status: 400 }
    );
  }
}
