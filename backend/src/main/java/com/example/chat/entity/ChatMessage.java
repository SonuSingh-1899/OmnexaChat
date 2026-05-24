package com.example.chat.entity;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Entity
@Table(name = "chat_messages", indexes = {
    @Index(name = "idx_timestamp", columnList = "timestamp"),
    @Index(name = "idx_room_timestamp", columnList = "roomId, timestamp"),
    @Index(name = "idx_receiver_read", columnList = "receiverEmail, isread"),
    @Index(name = "idx_sender_receiver_read", columnList = "senderEmail, receiverEmail, isread")
})
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String senderEmail;
    private String receiverEmail;
    @Column(columnDefinition = "TEXT")
    private String content;
    private String roomId;
    private Long replyToMessageId;
    private String replyToSenderEmail;
    @Column(columnDefinition = "TEXT")
    private String replyToContent;

    private String isread; // Keep for backward compatibility, but we'll enhance
    
    @Column(name = "read_at")
    private LocalDateTime readAt;
    
    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;
    
    // Helper methods
    public boolean isRead() {
        return "READ".equalsIgnoreCase(isread) || readAt != null;
    }
    
    public void markAsRead() {
        this.isread = "READ";
        this.readAt = LocalDateTime.now();
    }
    
    @Enumerated(EnumType.STRING)
    private MessageType type;
    
    @Getter(AccessLevel.NONE)
    @Setter(AccessLevel.NONE)
    @JsonIgnore
    private LocalDateTime timestamp;
    private boolean isDeleted = false;
    private LocalDateTime deletedAt;
    
    public enum MessageType {
        CHAT, JOIN, LEAVE, TYPING
    }
    
    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }

    @JsonProperty("timestamp")
    public String getTimestamp() {
        if (timestamp == null) {
            return null;
        }

        return timestamp.atZone(ZoneId.systemDefault()).toInstant().toString();
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    @JsonProperty("timestamp")
    public void setTimestamp(String timestamp) {
        if (timestamp == null || timestamp.isBlank()) {
            this.timestamp = null;
            return;
        }

        try {
            this.timestamp = LocalDateTime.ofInstant(
                java.time.Instant.parse(timestamp),
                ZoneId.systemDefault()
            );
        } catch (DateTimeParseException ex) {
            this.timestamp = LocalDateTime.parse(timestamp);
        }
    }
}
