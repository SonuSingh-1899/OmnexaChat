package com.example.chat.DTO;
import java.time.LocalDateTime;

import lombok.Data;

@Data
public class UserProfileResponse {
    private Long id;
    private String email;
    private String name;
    private String bio;
    private String avatarUrl;
    private boolean isVerified;
    private boolean isActive;
    private boolean isConnected;
    private boolean isRequestSent;
    private boolean isRequestReceived;
    private long followersCount;
    private long followingCount;
    private LocalDateTime lastloginAt;
    private LocalDateTime createdAt;
    private String lastMessage;
    private LocalDateTime lastMessageTime;
    private long unreadCount; 
}
