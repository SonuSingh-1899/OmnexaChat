package com.example.chat.DTO;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TypingStatusRequest {
    @NotBlank(message = "Sender email is required")
    private String senderEmail;

    @NotBlank(message = "Receiver email is required")
    private String receiverEmail;

    private boolean typing;
}
