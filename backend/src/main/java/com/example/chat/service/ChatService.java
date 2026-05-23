package com.example.chat.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.example.chat.entity.ChatMessage;
import com.example.chat.entity.ChatMessage.MessageType;
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

    public ChatMessage createDirectMessage1(String senderEmail, String receiverEmail, String content) {
        ChatMessage message = new ChatMessage();
        message.setSenderEmail(senderEmail);
        message.setReceiverEmail(receiverEmail);
        message.setContent(content);
        message.setRoomId(buildRoomId1(senderEmail, receiverEmail));
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
}
