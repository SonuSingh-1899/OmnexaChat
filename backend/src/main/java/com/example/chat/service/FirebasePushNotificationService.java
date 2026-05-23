package com.example.chat.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.chat.entity.ChatMessage;
import com.example.chat.entity.User;
import com.example.chat.repository.UserRepository;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.MessagingErrorCode;
import com.google.firebase.messaging.WebpushConfig;
import com.google.firebase.messaging.WebpushFcmOptions;
import com.google.firebase.messaging.WebpushNotification;

import jakarta.annotation.PostConstruct;

@Service
public class FirebasePushNotificationService {
    private static final Logger log = LoggerFactory.getLogger(FirebasePushNotificationService.class);
    private static final String FIREBASE_APP_NAME = "omnexa-push";
    private static final String DEFAULT_ICON_PATH = "/icons/manifest-icon-192.maskable.png";

    @Value("${firebase.enabled:true}")
    private boolean firebaseEnabled;

    @Value("${firebase.service-account-path:}")
    private String serviceAccountPath;

    @Value("${app.web.base-url:http://localhost:5173}")
    private String webBaseUrl;

    @Autowired
    private PushTokenService pushTokenService;

    @Autowired
    private UserRepository userRepository;

    private FirebaseMessaging firebaseMessaging;

    @PostConstruct
    public void initializeFirebase() {
        if (!firebaseEnabled) {
            log.info("Firebase push notifications are disabled by configuration");
            return;
        }

        if (serviceAccountPath == null || serviceAccountPath.isBlank()) {
            log.warn("Firebase service account path is not configured. Push notifications are disabled.");
            return;
        }

        Path credentialsPath = Paths.get(serviceAccountPath).toAbsolutePath().normalize();
        if (!Files.exists(credentialsPath)) {
            log.warn("Firebase service account file not found at {}. Push notifications are disabled.", credentialsPath);
            return;
        }

        try (InputStream credentialsStream = Files.newInputStream(credentialsPath)) {
            FirebaseApp firebaseApp = FirebaseApp.getApps().stream()
                .filter(app -> FIREBASE_APP_NAME.equals(app.getName()))
                .findFirst()
                .orElseGet(() -> {
                    try {
                        return FirebaseApp.initializeApp(
                            FirebaseOptions.builder()
                                .setCredentials(GoogleCredentials.fromStream(credentialsStream))
                                .build(),
                            FIREBASE_APP_NAME
                        );
                    } catch (IOException e) {
                        // TODO Auto-generated catch block
                        e.printStackTrace();
                    }
                    return null;
                });

            firebaseMessaging = FirebaseMessaging.getInstance(firebaseApp);
            log.info("Firebase push notifications initialized successfully");
        } catch (IOException exception) {
            log.error("Failed to initialize Firebase Admin SDK", exception);
        }
    }

    public void sendMessageNotification(ChatMessage message) {
        if (firebaseMessaging == null || message == null) {
            return;
        }

        List<String> receiverTokens = pushTokenService.getTokensForUser(message.getReceiverEmail());
        if (receiverTokens.isEmpty()) {
            return;
        }

        User sender = userRepository.findByEmail(message.getSenderEmail()).orElse(null);
        String senderName = sender != null && sender.getName() != null && !sender.getName().isBlank()
            ? sender.getName().trim()
            : message.getSenderEmail();
        String notificationBody = abbreviate(message.getContent(), 160);
        String targetUrl = webBaseUrl + "/dashboard";
        String iconUrl = webBaseUrl + DEFAULT_ICON_PATH;

        for (String token : receiverTokens) {
            try {
                Message firebaseMessage = Message.builder()
                    .setToken(token)
                    .putData("type", "chat-message")
                    .putData("senderEmail", safeValue(message.getSenderEmail()))
                    .putData("receiverEmail", safeValue(message.getReceiverEmail()))
                    .putData("senderName", safeValue(senderName))
                    .putData("messageId", String.valueOf(message.getId()))
                    .putData("content", safeValue(notificationBody))
                    .putData("url", targetUrl)
                    .setWebpushConfig(WebpushConfig.builder()
                        .putHeader("Urgency", "high")
                        .setNotification(WebpushNotification.builder()
                            .setTitle("New message from " + senderName)
                            .setBody(notificationBody)
                            .setIcon(iconUrl)
                            .setBadge(iconUrl)
                            .setTag("chat-" + safeValue(message.getSenderEmail()))
                            .build())
                        .setFcmOptions(WebpushFcmOptions.withLink(targetUrl))
                        .build())
                    .build();

                firebaseMessaging.send(firebaseMessage);
            } catch (FirebaseMessagingException exception) {
                log.warn("Failed to send push notification to token {}", token, exception);
                if (exception.getMessagingErrorCode() == MessagingErrorCode.UNREGISTERED
                        || exception.getMessagingErrorCode() == MessagingErrorCode.INVALID_ARGUMENT) {
                    pushTokenService.deleteToken(token);
                }
            }
        }
    }

    private String abbreviate(String value, int maxLength) {
        if (value == null) {
            return "";
        }

        String normalized = value.trim().replaceAll("\\s+", " ");
        if (normalized.length() <= maxLength) {
            return normalized;
        }

        return normalized.substring(0, Math.max(0, maxLength - 3)) + "...";
    }

    private String safeValue(String value) {
        return value == null ? "" : value;
    }
}
