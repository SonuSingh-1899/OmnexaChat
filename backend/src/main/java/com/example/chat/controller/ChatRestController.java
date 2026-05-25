package com.example.chat.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.chat.DTO.ChatMessageEditRequest;
import com.example.chat.DTO.ChatMessageRequest;
import com.example.chat.entity.ChatMessage;
import com.example.chat.exception.BusinessException;
import com.example.chat.service.ChatService;
import com.example.chat.service.ReadReceiptService;
import com.example.chat.service.UserProfileService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/chat")
public class ChatRestController {

    @Autowired
    private ChatService chatService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ReadReceiptService readReceiptService;

    @Autowired
    private UserProfileService userProfileService;

    @GetMapping("/messages/{roomId}")
    public ResponseEntity<List<ChatMessage>> getMessages1(
            @PathVariable String roomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(chatService.getMessages(roomId, page, size));
    }

    @GetMapping("/conversation")
    public ResponseEntity<List<ChatMessage>> getConversation1(
            @RequestParam String user1,
            @RequestParam String user2,
            @RequestParam(defaultValue = "0") int page) {
        String currentUserEmail = userProfileService.getCurrentUserEmail();
        if (!currentUserEmail.equalsIgnoreCase(user1) && !currentUserEmail.equalsIgnoreCase(user2)) {
            throw new BusinessException("You can access only your own conversations");
        }

        String otherEmail = currentUserEmail.equalsIgnoreCase(user1) ? user2 : user1;
        userProfileService.assertUsersConnected(currentUserEmail, otherEmail);
        return ResponseEntity.ok(chatService.getConversation(currentUserEmail, otherEmail, page));
    }

    @GetMapping("/conversation/{otherEmail}")
    public ResponseEntity<List<ChatMessage>> getMyConversation(
            @PathVariable String otherEmail,
            @RequestParam(defaultValue = "0") int page) {
        userProfileService.assertUsersConnected(otherEmail);
        return ResponseEntity.ok(
            chatService.getConversation(userProfileService.getCurrentUserEmail(), otherEmail, page)
        );
    }

    @PostMapping("/messages")
    public ResponseEntity<ChatMessage> sendMessage(@Valid @RequestBody ChatMessageRequest request) {
        userProfileService.assertUsersConnected(request.getReceiverEmail());
        ChatMessage message = chatService.createDirectMessage1(
            userProfileService.getCurrentUserEmail(),
            request.getReceiverEmail(),
            request.getContent(),
            request.getReplyToMessageId(),
            request.getReplyToSenderEmail(),
            request.getReplyToContent()
        );

        messagingTemplate.convertAndSend(buildInboxDestination(message.getReceiverEmail()), message);

        return ResponseEntity.ok(message);
    }

    @PutMapping("/messages/{messageId}")
    public ResponseEntity<ChatMessage> editMessage(
            @PathVariable Long messageId,
            @Valid @RequestBody ChatMessageEditRequest request) {
        ChatMessage updatedMessage = chatService.editMessage(
            userProfileService.getCurrentUserEmail(),
            messageId,
            request.getContent()
        );

        boolean isLatestInConversation = chatService.isLatestMessageInConversation(updatedMessage);
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "MESSAGE_EDITED");
        payload.put("message", updatedMessage);
        payload.put("isLatestInConversation", isLatestInConversation);

        messagingTemplate.convertAndSend(buildInboxDestination(updatedMessage.getSenderEmail()), payload);
        messagingTemplate.convertAndSend(buildInboxDestination(updatedMessage.getReceiverEmail()), payload);

        return ResponseEntity.ok(updatedMessage);
    }

    private String buildInboxDestination(String email) {
        return "/topic/messages/" + email;
    }

        @PostMapping("/read/{senderEmail}")
    public ResponseEntity<Map<String, Object>> markMessagesAsRead(@PathVariable String senderEmail) {
        long count = readReceiptService.markMessagesAsRead(senderEmail);
        Map<String, Object> response = new HashMap<>();
        response.put("message", count + " messages marked as read");
        response.put("count", count);
        return ResponseEntity.ok(response);
    }
    
    // Mark a single message as read
    @PostMapping("/messages/{messageId}/read")
    public ResponseEntity<Map<String, String>> markSingleMessageAsRead(@PathVariable Long messageId) {
        readReceiptService.markSingleMessageAsRead(messageId);
        return ResponseEntity.ok(Map.of("message", "Message marked as read"));
    }
    
    // Get total unread count
    @GetMapping("/unread/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        long count = readReceiptService.getUnreadCount();
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }
    
    // Get unread counts grouped by sender
    @GetMapping("/unread/by-sender")
    public ResponseEntity<Map<String, Long>> getUnreadCountsBySender() {
        return ResponseEntity.ok(readReceiptService.getUnreadCountsBySender());
    }

}
