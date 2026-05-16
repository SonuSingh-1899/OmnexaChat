package com.example.chat.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.chat.entity.User;
import com.example.chat.entity.UserConnection;
import com.example.chat.entity.UserConnection.ConnectionStatus;

public interface UserConnectionRepository extends JpaRepository<UserConnection, Long> {

    List<UserConnection> findByRequesterOrRecipient(User requester, User recipient);

    List<UserConnection> findByRecipientAndStatus(User recipient, ConnectionStatus status);

    @Query("""
        SELECT connection
        FROM UserConnection connection
        WHERE (
            (connection.requester = :firstUser AND connection.recipient = :secondUser)
            OR (connection.requester = :secondUser AND connection.recipient = :firstUser)
        )
        """)
    Optional<UserConnection> findRelationshipBetween(
        @Param("firstUser") User firstUser,
        @Param("secondUser") User secondUser
    );

    @Query("""
        SELECT COUNT(connection)
        FROM UserConnection connection
        WHERE connection.status = :status
        AND (connection.requester = :user OR connection.recipient = :user)
        """)
    long countByUserAndStatus(@Param("user") User user, @Param("status") ConnectionStatus status);
}
