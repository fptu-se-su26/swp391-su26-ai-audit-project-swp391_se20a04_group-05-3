package com.greenlife.event;

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
