package com.example.chat.DTO;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChatMessageEditRequest {
    @NotBlank(message = "Message content is required")
    private String content;
}
