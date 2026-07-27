package com.greenlife.notification.event;

import org.springframework.context.ApplicationEvent;

public abstract class NotificationEvent extends ApplicationEvent {
    public NotificationEvent(Object source) {
        super(source);
    }
}
