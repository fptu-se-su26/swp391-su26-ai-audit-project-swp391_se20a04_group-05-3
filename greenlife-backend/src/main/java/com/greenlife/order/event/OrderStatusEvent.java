package com.greenlife.order.event;

import com.greenlife.order.entity.enums.OrderStatus;
import com.greenlife.notification.event.NotificationEvent;
import lombok.Getter;

@Getter
public class OrderStatusEvent extends NotificationEvent {
    private final Integer orderId;
    private final Integer customerId;
    private final Integer storeOwnerId;
    private final OrderStatus status;

    public OrderStatusEvent(Object source, Integer orderId, Integer customerId, Integer storeOwnerId, OrderStatus status) {
        super(source);
        this.orderId = orderId;
        this.customerId = customerId;
        this.storeOwnerId = storeOwnerId;
        this.status = status;
    }
}
