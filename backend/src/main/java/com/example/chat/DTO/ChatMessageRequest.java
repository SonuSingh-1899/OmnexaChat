package com.example.chat.DTO;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChatMessageRequest {
    @NotBlank(message = "Receiver email is required")
    private String receiverEmail;

    @NotBlank(message = "Message content is required")
    private String content;

    private Long replyToMessageId;

    private String replyToSenderEmail;

    private String replyToContent;
}
