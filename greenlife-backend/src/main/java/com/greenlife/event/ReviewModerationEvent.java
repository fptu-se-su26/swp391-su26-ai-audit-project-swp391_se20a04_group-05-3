package com.greenlife.event;

import lombok.Getter;

@Getter
public class ReviewModerationEvent extends NotificationEvent {
    private final Integer reviewId;
    private final Integer customerId;

    public ReviewModerationEvent(Object source, Integer reviewId, Integer customerId) {
        super(source);
        this.reviewId = reviewId;
        this.customerId = customerId;
    }
}
