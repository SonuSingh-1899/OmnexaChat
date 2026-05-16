package com.example.chat.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Data;

@Data
@Entity
@Table(
    name = "user_connections",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_user_connection_requester_recipient",
            columnNames = { "requester_id", "recipient_id" }
        )
    },
    indexes = {
        @Index(name = "idx_user_connection_requester", columnList = "requester_id"),
        @Index(name = "idx_user_connection_recipient", columnList = "recipient_id"),
        @Index(name = "idx_user_connection_status", columnList = "status")
    }
)
public class UserConnection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ConnectionStatus status = ConnectionStatus.PENDING;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime respondedAt;

    public enum ConnectionStatus {
        PENDING,
        ACCEPTED
    }
}
