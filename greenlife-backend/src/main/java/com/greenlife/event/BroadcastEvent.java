package com.greenlife.event;

import lombok.Getter;

@Getter
public class BroadcastEvent extends NotificationEvent {
    private final String title;
    private final String message;

    public BroadcastEvent(Object source, String title, String message) {
        super(source);
        this.title = title;
        this.message = message;
    }
}
