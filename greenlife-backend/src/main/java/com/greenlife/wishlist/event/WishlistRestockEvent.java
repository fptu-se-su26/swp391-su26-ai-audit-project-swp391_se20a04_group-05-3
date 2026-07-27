package com.greenlife.wishlist.event;

import com.greenlife.notification.event.NotificationEvent;
import lombok.Getter;

@Getter
public class WishlistRestockEvent extends NotificationEvent {
    private final Integer plantId;
    private final String plantName;

    public WishlistRestockEvent(Object source, Integer plantId, String plantName) {
        super(source);
        this.plantId = plantId;
        this.plantName = plantName;
    }
}
