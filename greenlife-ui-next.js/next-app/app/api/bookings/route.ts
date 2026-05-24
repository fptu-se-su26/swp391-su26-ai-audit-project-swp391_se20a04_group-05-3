import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { serviceId, expertId, date, time, customerName, customerPhone, customerAddress } = body;

    // Server-side validation
    if (!serviceId || !expertId || !date || !time || !customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp đầy đủ thông tin yêu cầu đặt lịch.' },
        { status: 400 }
      );
    }

    // Simulate storing to database or sending email alerts
    console.log('--- BOOKING RECEIVED ---');
    console.log('Customer:', customerName);
    console.log('Phone:', customerPhone);
    console.log('Address:', customerAddress);
    console.log('Service ID:', serviceId);
    console.log('Expert ID:', expertId);
    console.log('Scheduled Date & Time:', `${date} @ ${time}`);
    console.log('--- END OF BOOKING ---');

    return NextResponse.json({
      success: true,
      message: 'Đặt lịch chăm sóc thành công!',
      booking: {
        id: `book-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
        customerName,
        serviceId,
        expertId,
        date,
        time,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Có lỗi xảy ra trong quá trình tiếp nhận yêu cầu đặt lịch.' },
      { status: 500 }
    );
  }
}
