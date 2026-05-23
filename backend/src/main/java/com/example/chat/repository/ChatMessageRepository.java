package com.example.chat.repository;

import com.example.chat.entity.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    
    List<ChatMessage> findByRoomIdOrderByTimestampDesc(String roomId, Pageable pageable);
    
    @Query("SELECT m FROM ChatMessage m WHERE (m.senderEmail = :user1 AND m.receiverEmail = :user2) OR (m.senderEmail = :user2 AND m.receiverEmail = :user1) ORDER BY m.timestamp DESC")
    List<ChatMessage> findConversation(@Param("user1") String user1, @Param("user2") String user2, Pageable pageable);
    
    List<ChatMessage> findByTimestampBefore(LocalDateTime dateTime);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM ChatMessage m WHERE m.timestamp <= :cutoffDate")
    int deleteOldMessages(@Param("cutoffDate") LocalDateTime cutoffDate);


    // Mark all messages in a conversation as read
    @Modifying
    @Transactional
    @Query("UPDATE ChatMessage m SET m.isread = 'READ', m.readAt = CURRENT_TIMESTAMP " +
           "WHERE m.senderEmail = :senderEmail " +
           "AND m.receiverEmail = :receiverEmail " +
           "AND (m.isread IS NULL OR m.isread != 'READ')")
    int markConversationAsRead(@Param("senderEmail") String senderEmail, 
                               @Param("receiverEmail") String receiverEmail);
    
    // Get unread count for a user
    @Query("SELECT COUNT(m) FROM ChatMessage m " +
           "WHERE m.receiverEmail = :userEmail " +
           "AND (m.isread IS NULL OR m.isread != 'READ')")
    long countUnreadMessages(@Param("userEmail") String userEmail);
    
    // Get unread messages from a specific sender
    @Query("SELECT m FROM ChatMessage m " +
           "WHERE m.receiverEmail = :receiverEmail " +
           "AND m.senderEmail = :senderEmail " +
           "AND (m.isread IS NULL OR m.isread != 'READ')")
    List<ChatMessage> findUnreadMessagesFromSender(@Param("senderEmail") String senderEmail,
                                                    @Param("receiverEmail") String receiverEmail);

        @Query("SELECT MAX(m.timestamp) FROM ChatMessage m " +
       "WHERE (m.senderEmail = :email1 AND m.receiverEmail = :email2) " +
       "OR (m.senderEmail = :email2 AND m.receiverEmail = :email1)")
LocalDateTime findLatestMessageTimeBetween(@Param("email1") String email1, 
                                            @Param("email2") String email2);




       @Query(value = "SELECT m.content FROM chat_messages m " +
           "WHERE (m.sender_email = :email1 AND m.receiver_email = :email2) " +
           "OR (m.sender_email = :email2 AND m.receiver_email = :email1) " +
           "ORDER BY m.timestamp DESC LIMIT 1", nativeQuery = true)
    String findLatestMessageContent(@Param("email1") String email1, 
                                     @Param("email2") String email2);
    
    // ✅ ADD THIS METHOD - Count unread messages from specific sender
    @Query("SELECT COUNT(m) FROM ChatMessage m " +
           "WHERE m.senderEmail = :senderEmail " +
           "AND m.receiverEmail = :receiverEmail " +
           "AND (m.isread IS NULL OR m.isread != 'READ')")
    long countUnreadFromSender(@Param("senderEmail") String senderEmail,
                               @Param("receiverEmail") String receiverEmail);

}