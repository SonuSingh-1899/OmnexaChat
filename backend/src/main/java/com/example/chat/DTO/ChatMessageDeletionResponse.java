package com.example.chat.DTO;

import com.example.chat.entity.ChatMessage;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ChatMessageDeletionResponse {
    private Long messageId;
    private String senderEmail;
    private String receiverEmail;
    private ChatMessage latestMessage;
}
