package com.greenlife.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatRequest {

    @NotBlank(message = "Question cannot be blank")
    @Size(max = 1000, message = "Question is too long")
    private String question;

    @Size(max = 255, message = "Current route path is too long")
    private String currentRoute;
}
