package com.example.chat.service;

import brevo.ApiClient;
import brevo.Configuration;
import brevoApi.TransactionalEmailsApi;
import brevoModel.SendSmtpEmail;
import brevoModel.SendSmtpEmailSender;
import brevoModel.SendSmtpEmailTo;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;
import java.util.Collections;

@Service
public class EmailService { 

    @Value("${brevo.api.key}")
    private String apiKey;

    @Value("${brevo.sender.email}")
    private String senderEmail;

    @Value("${brevo.sender.name}")
    private String senderName;

    private TransactionalEmailsApi emailApi;

    @PostConstruct
    public void init() {
        ApiClient client = Configuration.getDefaultApiClient();
        client.setApiKey(apiKey);
        emailApi = new TransactionalEmailsApi(client);
        System.out.println("✅ Brevo Email Service Ready!");
    }

        private void sendEmail(String to, String subject, String body) {
        System.out.println("📧 Preparing to send email to: " + to);
        System.out.println("📧 Using sender: " + senderEmail);
        System.out.println("📧 API Key length: " + (apiKey != null ? apiKey.length() : "NULL"));
        
        try {
            SendSmtpEmail email = new SendSmtpEmail();
            
            SendSmtpEmailTo recipient = new SendSmtpEmailTo();
            recipient.setEmail(to);
            email.setTo(Collections.singletonList(recipient));
            
            SendSmtpEmailSender sender = new SendSmtpEmailSender();
            sender.setEmail(senderEmail);
            sender.setName(senderName);
            email.setSender(sender);
            
            email.setSubject(subject);
            email.setTextContent(body);
            
            System.out.println("📨 Calling Brevo API...");
            emailApi.sendTransacEmail(email);
            System.out.println("✅ Email sent successfully to: " + to);
            
        } catch (brevo.ApiException e) {
            // 🔴 YAHAN SE DETAILED ERROR MILEGA
            System.err.println("========== BREVO API ERROR ==========");
            System.err.println("HTTP Status Code: " + e.getCode());
            System.err.println("Error Message: " + e.getMessage());
            System.err.println("Response Body: " + e.getResponseBody());
            System.err.println("=====================================");
            throw new RuntimeException("Failed to send email: " + e.getResponseBody(), e);
        } catch (Exception e) {
            System.err.println("General Error: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to send email", e);
        }
    }

    public void sendOtp(String email, String otp) {
        String body = "Your OTP is: " + otp + "\n\nValid for 5 minutes.\n\nRegards,\nOmnexa Chat Team";
        sendEmail(email, "Your OTP Code", body);
    }

    public void sendPasswordResetEmail(String email, String resetLink) {
        String body = "Click the link below to reset your password:\n\n" + resetLink + "\n\nThis link will expire in 1 hour.\n\nRegards,\nOmnexa Chat Team";
        sendEmail(email, "Password Reset Request", body);
    }

    public void sendPasswordResetOtp(String email, String otp) {
        String body = "Your password reset OTP is: " + otp + "\n\nValid for 10 minutes.\n\nRegards,\nOmnexa Chat Team";
        sendEmail(email, "Reset Password OTP", body);
    }
}