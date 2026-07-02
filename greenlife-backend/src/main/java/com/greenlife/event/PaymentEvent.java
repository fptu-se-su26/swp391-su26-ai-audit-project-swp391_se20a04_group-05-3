package com.greenlife.event;

import lombok.Getter;

@Getter
public class PaymentEvent extends NotificationEvent {
    private final Integer orderId;
    private final Integer customerId;
    private final boolean success;

    public PaymentEvent(Object source, Integer orderId, Integer customerId, boolean success) {
        super(source);
        this.orderId = orderId;
        this.customerId = customerId;
        this.success = success;
    }
}
