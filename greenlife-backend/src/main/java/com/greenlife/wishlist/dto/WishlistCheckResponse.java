package com.greenlife.wishlist.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WishlistCheckResponse {
    private boolean favorited;
}
