package com.example.chat.controller;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.example.chat.service.ReadReceiptService;

@Controller
public class MessageReadController {
    
    private static final Logger log = LoggerFactory.getLogger(MessageReadController.class);
    
    @Autowired
    private ReadReceiptService readReceiptService;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @MessageMapping("/mark.read/{senderEmail}")
    public void markMessagesAsRead(@Payload Map<String, Object> receipt) {
        try {
            String readerEmail = (String) receipt.get("reader");
            String senderEmail = (String) receipt.get("sender");
            
            log.info("📖 WebSocket read receipt received: reader={}, sender={}", readerEmail, senderEmail);
            
            if (readerEmail == null || senderEmail == null) {
                log.warn("Invalid read receipt: missing reader or sender");
                return;
            }
            
            // Mark messages as read in database
            long updatedCount = readReceiptService.markMessagesAsRead(senderEmail);
            
            log.info("✅ Marked {} messages as read from {} to {}", updatedCount, senderEmail, readerEmail);
            
            // Send acknowledgment back to the original sender
            Map<String, Object> readReceipt = new HashMap<>();
            readReceipt.put("type", "READ_RECEIPT");
            readReceipt.put("reader", readerEmail);
            readReceipt.put("readBy", readerEmail);
            readReceipt.put("messageCount", updatedCount);
            readReceipt.put("timestamp", java.time.LocalDateTime.now().toString());
            
            messagingTemplate.convertAndSend("/topic/messages/" + senderEmail, readReceipt);
            log.info("📤 Sent read receipt acknowledgment to {}", senderEmail);
            
        } catch (Exception e) {
            log.error("Error processing read receipt: {}", e.getMessage(), e);
        }
    }
}