package com.greenlife.chat.dto;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeminiChatResult {
    private String answer;
    private List<String> suggestedActionIds;
}
