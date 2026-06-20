package com.greenlife.service;

import com.greenlife.exception.CustomException;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnMissingBean(JavaMailSender.class)
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Override
    public void sendVerificationOtp(String email, String otp) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setTo(email);
            helper.setSubject("GreenLife Email Verification");

            String htmlTemplate = "<!DOCTYPE html>\n" +
                    "<html>\n" +
                    "<head>\n" +
                    "    <meta charset=\"UTF-8\">\n" +
                    "    <title>GreenLife Verification Code</title>\n" +
                    "    <style>\n" +
                    "        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 0; color: #333333; }\n"
                    +
                    "        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid #e0e0e0; }\n"
                    +
                    "        .header { background-color: #2E7D32; padding: 25px; text-align: center; color: #ffffff; }\n"
                    +
                    "        .header h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 1px; }\n" +
                    "        .content { padding: 30px; line-height: 1.6; }\n" +
                    "        .otp-box { background-color: #f1f8e9; border: 1px dashed #81c784; border-radius: 6px; padding: 20px; text-align: center; margin: 25px 0; }\n"
                    +
                    "        .otp-code { font-size: 36px; font-weight: bold; color: #2E7D32; letter-spacing: 6px; margin: 0; }\n"
                    +
                    "        .footer { background-color: #fafafa; padding: 20px; text-align: center; font-size: 12px; color: #777777; border-top: 1px solid #eeeeee; }\n"
                    +
                    "        .footer p { margin: 5px 0; }\n" +
                    "    </style>\n" +
                    "</head>\n" +
                    "<body>\n" +
                    "    <div class=\"container\">\n" +
                    "        <div class=\"header\">\n" +
                    "            <h1>GreenLife</h1>\n" +
                    "        </div>\n" +
                    "        <div class=\"content\">\n" +
                    "            <p>Xin chào,</p>\n" +
                    "            <p>Cảm ơn bạn đã đăng ký tài khoản tại GreenLife. Vui lòng sử dụng mã OTP dưới đây để xác thực địa chỉ email của bạn:</p>\n"
                    +
                    "            <div class=\"otp-box\">\n" +
                    "                <p class=\"otp-code\">" + otp + "</p>\n" +
                    "            </div>\n" +
                    "            <p>Mã OTP này có hiệu lực trong vòng <strong>10 phút</strong>. Vì lý do bảo mật, vui lòng không chia sẻ mã này với bất kỳ ai.</p>\n"
                    +
                    "            <p>Trân trọng,<br>Đội ngũ phát triển GreenLife</p>\n" +
                    "        </div>\n" +
                    "        <div class=\"footer\">\n" +
                    "            <p>Email này được gửi tự động từ hệ thống GreenLife. Vui lòng không phản hồi trực tiếp email này.</p>\n"
                    +
                    "            <p>&copy; 2026 GreenLife. All rights reserved.</p>\n" +
                    "        </div>\n" +
                    "    </div>\n" +
                    "</body>\n" +
                    "</html>";

            helper.setText(htmlTemplate, true);
            mailSender.send(mimeMessage);
        } catch (MessagingException e) {
            throw new CustomException("Lỗi gửi email xác thực: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public void sendPasswordResetOtp(String email, String otp) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setTo(email);
            helper.setSubject("GreenLife Password Reset Request");

            String htmlTemplate = "<!DOCTYPE html>\n" +
                    "<html>\n" +
                    "<head>\n" +
                    "    <meta charset=\"UTF-8\">\n" +
                    "    <title>GreenLife Password Reset</title>\n" +
                    "    <style>\n" +
                    "        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 0; color: #333333; }\n"
                    +
                    "        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid #e0e0e0; }\n"
                    +
                    "        .header { background-color: #2E7D32; padding: 25px; text-align: center; color: #ffffff; }\n"
                    +
                    "        .header h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 1px; }\n" +
                    "        .content { padding: 30px; line-height: 1.6; }\n" +
                    "        .otp-box { background-color: #f1f8e9; border: 1px dashed #81c784; border-radius: 6px; padding: 20px; text-align: center; margin: 25px 0; }\n"
                    +
                    "        .otp-code { font-size: 36px; font-weight: bold; color: #2E7D32; letter-spacing: 6px; margin: 0; }\n"
                    +
                    "        .footer { background-color: #fafafa; padding: 20px; text-align: center; font-size: 12px; color: #777777; border-top: 1px solid #eeeeee; }\n"
                    +
                    "        .footer p { margin: 5px 0; }\n" +
                    "        .warning { color: #c62828; font-weight: bold; margin-top: 20px; }\n" +
                    "    </style>\n" +
                    "</head>\n" +
                    "<body>\n" +
                    "    <div class=\"container\">\n" +
                    "        <div class=\"header\">\n" +
                    "            <h1>GreenLife</h1>\n" +
                    "        </div>\n" +
                    "        <div class=\"content\">\n" +
                    "            <p>Hello,</p>\n" +
                    "            <p>We received a request to reset your GreenLife account password. Please use the following OTP code to verify your request:</p>\n"
                    +
                    "            <div class=\"otp-box\">\n" +
                    "                <p class=\"otp-code\">" + otp + "</p>\n" +
                    "            </div>\n" +
                    "            <p>This code is valid for <strong>10 minutes</strong>. For security reasons, do not share this code with anyone.</p>\n"
                    +
                    "            <p class=\"warning\">Security Warning: If you did not request this password reset, please ignore this email and secure your account immediately.</p>\n"
                    +
                    "            <p>Regards,<br>GreenLife Development Team</p>\n" +
                    "        </div>\n" +
                    "        <div class=\"footer\">\n" +
                    "            <p>This is an automated email. Please do not reply to it.</p>\n" +
                    "            <p>&copy; 2026 GreenLife. All rights reserved.</p>\n" +
                    "        </div>\n" +
                    "    </div>\n" +
                    "</body>\n" +
                    "</html>";

            helper.setText(htmlTemplate, true);
            mailSender.send(mimeMessage);
        } catch (MessagingException e) {
            throw new CustomException("Lỗi gửi email đặt lại mật khẩu: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
