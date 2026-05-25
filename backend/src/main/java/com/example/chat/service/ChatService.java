package com.example.chat.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.example.chat.DTO.ChatMessageDeletionResponse;
import com.example.chat.entity.ChatMessage;
import com.example.chat.entity.ChatMessage.MessageType;
import com.example.chat.exception.BusinessException;
import com.example.chat.repository.ChatMessageRepository;

@Service
public class ChatService {
    
    @Autowired
    private ChatMessageRepository chatRepository;
    
    public ChatMessage saveMessage(ChatMessage message) {
        message.setTimestamp(LocalDateTime.now());
        return chatRepository.save(message);
    }
    
    public List<ChatMessage> getMessages(String roomId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return chatRepository.findByRoomIdOrderByTimestampDesc(roomId, pageable);
    }
    
    public List<ChatMessage> getConversation(String user1, String user2, int page) {
        Pageable pageable = PageRequest.of(page, 50);
        return chatRepository.findConversation(user1, user2, pageable);
    }

    public ChatMessage createDirectMessage1(
        String senderEmail,
        String receiverEmail,
        String content,
        Long replyToMessageId,
        String replyToSenderEmail,
        String replyToContent
    ) {
        ChatMessage message = new ChatMessage();
        message.setSenderEmail(senderEmail);
        message.setReceiverEmail(receiverEmail);
        message.setContent(content);
        message.setRoomId(buildRoomId1(senderEmail, receiverEmail));
        message.setReplyToMessageId(replyToMessageId);
        message.setReplyToSenderEmail(replyToSenderEmail);
        message.setReplyToContent(replyToContent);
        message.setType(MessageType.CHAT);
        message.setDeliveredAt(LocalDateTime.now());
        return saveMessage(message);
    }

    public String buildRoomId1(String user1, String user2) {
        return user1.compareToIgnoreCase(user2) <= 0
            ? user1 + "__" + user2
            : user2 + "__" + user1;
    }

    public long getUnreadCountForSender(String senderEmail, String receiverEmail) {
        return chatRepository.countUnreadFromSender(senderEmail, receiverEmail);
    }

    public ChatMessage editMessage(String currentUserEmail, Long messageId, String content) {
        ChatMessage message = chatRepository.findById(messageId)
            .orElseThrow(() -> new BusinessException("Message not found"));

        if (!message.getSenderEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new BusinessException("You can edit only your own messages");
        }

        if (message.isDeleted()) {
            throw new BusinessException("Deleted message cannot be edited");
        }

        String normalizedContent = content == null ? "" : content.trim();
        if (normalizedContent.isBlank()) {
            throw new BusinessException("Message content is required");
        }

        message.setContent(normalizedContent);
        return chatRepository.save(message);
    }

    public ChatMessageDeletionResponse deleteMessage(String currentUserEmail, Long messageId) {
        ChatMessage message = chatRepository.findById(messageId)
            .orElseThrow(() -> new BusinessException("Message not found"));

        if (!message.getSenderEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new BusinessException("You can delete only your own messages");
        }

        String roomId = message.getRoomId();
        String senderEmail = message.getSenderEmail();
        String receiverEmail = message.getReceiverEmail();

        chatRepository.delete(message);

        ChatMessage latestMessage = roomId == null
            ? null
            : chatRepository.findTopByRoomIdOrderByTimestampDesc(roomId);

        return new ChatMessageDeletionResponse(
            messageId,
            senderEmail,
            receiverEmail,
            latestMessage
        );
    }
}
