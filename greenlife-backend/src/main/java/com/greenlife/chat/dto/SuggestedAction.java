package com.greenlife.chat.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuggestedAction {
    private String actionId;
    private String label;
    private String route;
}
