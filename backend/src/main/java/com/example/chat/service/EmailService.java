package com.example.chat.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    private void sendEmail(String to, String subject, String body) {

        try {

            SimpleMailMessage message = new SimpleMailMessage();

            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);

            mailSender.send(message);

            System.out.println("Email sent successfully");

        } catch (Exception e) {
            throw new RuntimeException("Failed to send email", e);
        }
    }

    public void sendOtp(String email, String otp) {

        String body =
                "Your OTP is: " + otp +
                "\n\nValid for 5 minutes.";

        sendEmail(email, "Your OTP Code", body);
    }

    public void sendPasswordResetEmail(String email, String resetLink) {

        String body =
                "Click the link below to reset your password:\n\n"
                + resetLink +
                "\n\nThis link will expire in 1 hour.";

        sendEmail(email, "Password Reset Request", body);
    }

    public void sendPasswordResetOtp(String email, String otp) {

        String body =
                "Your password reset OTP is: " + otp +
                "\n\nValid for 10 minutes.";

        sendEmail(email, "Reset Password OTP", body);
    }
}