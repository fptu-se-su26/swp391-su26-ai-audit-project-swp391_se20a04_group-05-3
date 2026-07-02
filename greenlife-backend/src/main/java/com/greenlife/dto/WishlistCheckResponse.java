package com.greenlife.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WishlistCheckResponse {
    private boolean favorited;
}
