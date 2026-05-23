package com.example.chat.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.chat.entity.ChatMessage;
import com.example.chat.repository.ChatMessageRepository;
import com.example.chat.exception.BusinessException;

import java.util.HashMap;
import java.util.Map;

@Service
public class ReadReceiptService {
    
    @Autowired
    private ChatMessageRepository chatMessageRepository;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private UserProfileService userProfileService;
    
    @Transactional
    public long markMessagesAsRead(String senderEmail) {
        String currentUserEmail = userProfileService.getCurrentUserEmail();
        
        System.out.println("🔵 [ReadReceipt] markMessagesAsRead called: sender=" + senderEmail + ", reader=" + currentUserEmail);
        
        userProfileService.assertUsersConnected(senderEmail);
        
        int updatedCount = chatMessageRepository.markConversationAsRead(senderEmail, currentUserEmail);
        
        System.out.println("🔵 [ReadReceipt] Updated " + updatedCount + " messages as read");
        
        if (updatedCount > 0) {
            sendReadReceipt(senderEmail, currentUserEmail, updatedCount);
        }
        
        return updatedCount;
    }
    
    @Transactional
    public void markSingleMessageAsRead(Long messageId) {
        ChatMessage message = chatMessageRepository.findById(messageId)
            .orElseThrow(() -> new BusinessException("Message not found"));
        
        String currentUserEmail = userProfileService.getCurrentUserEmail();
        
        if (!message.getReceiverEmail().equals(currentUserEmail)) {
            throw new BusinessException("You can only mark messages sent to you as read");
        }
        
        if (!message.isRead()) {
            message.markAsRead();
            chatMessageRepository.save(message);
            
            sendSingleReadReceipt(message.getSenderEmail(), currentUserEmail, messageId);
        }
    }
    
    public long getUnreadCount() {
        String currentUserEmail = userProfileService.getCurrentUserEmail();
        return chatMessageRepository.countUnreadMessages(currentUserEmail);
    }
    
    public Map<String, Long> getUnreadCountsBySender() {
        String currentUserEmail = userProfileService.getCurrentUserEmail();
        Map<String, Long> unreadCounts = new HashMap<>();
        for (Object[] row : chatMessageRepository.countUnreadMessagesBySender(currentUserEmail)) {
            unreadCounts.put((String) row[0], (Long) row[1]);
        }
        return unreadCounts;
    }
    
    private void sendReadReceipt(String senderEmail, String readerEmail, int count) {
        Map<String, Object> receipt = new HashMap<>();
        receipt.put("type", "READ_RECEIPT");
        receipt.put("reader", readerEmail);
        receipt.put("readBy", readerEmail);
        receipt.put("messageCount", count);
        receipt.put("unreadCount", 0);
        receipt.put("timestamp", java.time.LocalDateTime.now().toString());
        
        messagingTemplate.convertAndSend("/topic/messages/" + senderEmail, receipt);
        System.out.println("📤 [ReadReceipt] Sent READ_RECEIPT to " + senderEmail + " with count=" + count);
    }
    
    private void sendSingleReadReceipt(String senderEmail, String readerEmail, Long messageId) {
        Map<String, Object> receipt = new HashMap<>();
        receipt.put("type", "MESSAGE_READ");
        receipt.put("messageId", messageId);
        receipt.put("reader", readerEmail);
        receipt.put("readAt", java.time.LocalDateTime.now().toString());
        
        messagingTemplate.convertAndSend("/topic/messages/" + senderEmail, receipt);
    }
}
