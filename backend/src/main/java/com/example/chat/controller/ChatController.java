package com.example.chat.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.example.chat.entity.ChatMessage;
import com.example.chat.service.ChatService;
import com.example.chat.service.ReadReceiptService;

@Controller
public class ChatController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ChatService chatService;

    @Autowired
    private ReadReceiptService readReceiptService;

    @MessageMapping("/chat.send")
    @SendTo("/topic/public")
    public ChatMessage sendMessage(@Payload ChatMessage message) {
        message.setTimestamp(LocalDateTime.now());
        return chatService.saveMessage(message);
    }

    @MessageMapping("/chat.private")
    public void sendPrivateMessage(@Payload ChatMessage message) {
        message.setTimestamp(LocalDateTime.now());
        message.setDeliveredAt(LocalDateTime.now());
        ChatMessage savedMessage = chatService.saveMessage(message);

        //Get unread count for receiver (from this sender)
        long unreadCount = chatService.getUnreadCountForSender(
            savedMessage.getSenderEmail(), 
            savedMessage.getReceiverEmail()
        );

        //Send message WITH unreadCount to receiver
        Map<String, Object> messageWithCount = new HashMap<>();
        messageWithCount.put("type", "MESSAGE");
        messageWithCount.put("message", savedMessage);
        messageWithCount.put("unreadCount", unreadCount);

        messagingTemplate.convertAndSend(
            buildInboxDestination(savedMessage.getReceiverEmail()),
            messageWithCount
        );

        //Send delivery receipt to sender (optional - keep as is)
        Map<String, Object> deliveryReceipt = new HashMap<>();
        deliveryReceipt.put("type", "DELIVERED");
        deliveryReceipt.put("messageId", savedMessage.getId());
        deliveryReceipt.put("deliveredAt", savedMessage.getDeliveredAt());

        messagingTemplate.convertAndSend(
            buildInboxDestination(savedMessage.getSenderEmail()),
            deliveryReceipt
        );
    }

    private String buildInboxDestination(String email) {
        return "/topic/messages/" + email;
    }
}