import nodemailer from "nodemailer";

export class EmailService {
  /**
   * Sends an OTP code via email.
   * If SMTP configuration is missing, it will log the OTP in the terminal console instead.
   */
  public static async sendOTPEmail(
    to: string,
    otp: string,
    type: "register" | "forgot_password"
  ): Promise<boolean> {
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
    const smtpUser = process.env.SMTP_USER || "";
    const smtpPass = process.env.SMTP_PASS || "";

    const isMock = !smtpUser || !smtpPass;

    if (isMock) {
      console.log("\n==================================================");
      console.log(`🚀 [SIMULATED EMAIL SENDER]`);
      console.log(`To:      ${to}`);
      console.log(`OTP:     ${otp}`);
      console.log(`Action:  ${type === "register" ? "ĐĂNG KÝ TÀI KHOẢN" : "CÀI LẠI MẬT KHẨU"}`);
      console.log(`Status:  Vui lòng dùng mã OTP ở trên để tiếp tục.`);
      console.log("==================================================\n");
      return true;
    }

    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const subject =
        type === "register"
          ? "[GreenLife] Mã OTP xác thực đăng ký tài khoản"
          : "[GreenLife] Mã OTP đặt lại mật khẩu của bạn";

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #10b981; text-align: center;">GreenLife Portal</h2>
          <p>Xin chào,</p>
          <p>Bạn nhận được email này vì đã yêu cầu thực hiện hành động <strong>${
            type === "register" ? "Đăng ký tài khoản mới" : "Đặt lại mật khẩu"
          }</strong> tại hệ thống sinh thái GreenLife.</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1f2937;">${otp}</span>
          </div>
          <p style="color: #ef4444; font-size: 13px;">* Mã OTP này có hiệu lực trong vòng 5 phút và chỉ được sử dụng một lần duy nhất.</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="font-size: 11px; color: #9ca3af; text-align: center;">Đây là email tự động từ GreenLife, vui lòng không phản hồi lại email này.</p>
        </div>
      `;

      await transporter.sendMail({
        from: `"GreenLife" <${smtpUser}>`,
        to,
        subject,
        html: htmlContent,
      });

      console.log(`✅ Đã gửi email OTP thành công tới ${to}`);
      return true;
    } catch (err: any) {
      console.error("❌ Lỗi khi gửi email OTP thật thông qua Nodemailer:", err.message);
      // Fallback: log to console to avoid blocking development flow
      console.log("\n==================================================");
      console.log(`⚠️ [SMTP FAIL FALLBACK OTP]`);
      console.log(`To:      ${to}`);
      console.log(`OTP:     ${otp}`);
      console.log(`Action:  ${type}`);
      console.log("==================================================\n");
      return true;
    }
  }
}
