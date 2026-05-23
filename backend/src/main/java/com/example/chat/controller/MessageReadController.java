package com.example.chat.controller;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import com.example.chat.service.ReadReceiptService;

@Controller
public class MessageReadController {
    
    private static final Logger log = LoggerFactory.getLogger(MessageReadController.class);
    
    @Autowired
    private ReadReceiptService readReceiptService;
    
    @MessageMapping("/mark.read/{senderEmail}")
    public void markMessagesAsRead(@Payload Map<String, Object> receipt) {
        try {
            String readerEmail = (String) receipt.get("reader");
            String senderEmail = (String) receipt.get("sender");
            
            log.info("WebSocket read receipt received: reader={}, sender={}", readerEmail, senderEmail);
            
            if (readerEmail == null || senderEmail == null) {
                log.warn("Invalid read receipt: missing reader or sender");
                return;
            }
            
            long updatedCount = readReceiptService.markMessagesAsRead(senderEmail);
            log.info("Marked {} messages as read from {} to {}", updatedCount, senderEmail, readerEmail);
        } catch (Exception e) {
            log.error("Error processing read receipt: {}", e.getMessage(), e);
        }
    }
}
