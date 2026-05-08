package com.example.chat.service;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.SendGrid;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;

@Service
public class EmailService {

    @Value("${sendgrid.api.key}")
    private String sendGridApiKey;

    @Value("${sendgrid.from.email}")
    private String fromEmail;

    private void sendEmail(String to, String subject, String body) {

        try {

            Email from = new Email(fromEmail);
            Email toEmail = new Email(to);

            Content content = new Content("text/plain", body);

            Mail mail = new Mail(from, subject, toEmail, content);

            SendGrid sg = new SendGrid(sendGridApiKey);

            Request request = new Request();

            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());

            Response response = sg.api(request);

            System.out.println("Status Code: " + response.getStatusCode());

        } catch (IOException e) {
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
        System.out.println("Password reset OTP mail method called");

        String body =
                "Your password reset OTP is: " + otp +
                "\n\nValid for 10 minutes.";

        sendEmail(email, "Reset Password OTP", body);
    }
}