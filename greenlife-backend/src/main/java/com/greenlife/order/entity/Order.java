package com.greenlife.order.entity;

import com.greenlife.user.entity.User;
import com.greenlife.store.entity.Store;
import com.greenlife.order.entity.enums.OrderStatus;
import com.greenlife.payment.entity.enums.PaymentStatus;
import com.greenlife.payment.entity.converter.PaymentStatusConverter;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    @Column(name = "recipient_name", nullable = false, length = 120)
    private String recipientName;

    @Column(name = "recipient_phone", nullable = false, length = 20)
    private String recipientPhone;

    @Column(name = "shipping_address", nullable = false, length = 255)
    private String shippingAddress;

    @Column(nullable = false, precision = 12, scale = 0)
    private BigDecimal subtotal;

    @Column(name = "shipping_fee", nullable = false, precision = 12, scale = 0)
    @Builder.Default
    private BigDecimal shippingFee = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 0)
    private BigDecimal totalAmount;

    @Column(name = "payment_method", nullable = false, length = 30)
    @Builder.Default
    private String paymentMethod = "COD";

    @Convert(converter = PaymentStatusConverter.class)
    @Column(name = "payment_status", nullable = false, length = 30)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Column(name = "payment_provider", length = 20)
    private String paymentProvider;

    @Column(name = "payos_link_id", length = 100)
    private String payosLinkId;

    @Column(name = "payos_checkout_url", length = 500)
    private String payosCheckoutUrl;

    @Column(name = "payos_qr_code", length = 1000)
    private String payosQrCode;

    @Column(name = "payos_order_code")
    private Long payosOrderCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OrderStatus status;

    @Column(length = 500)
    private String note;

    @Column(name = "return_reject_reason", length = 500)
    private String returnRejectReason;

    @Column(name = "return_request_reason", length = 500)
    private String returnRequestReason;

    @Column(name = "return_request_reason_code", length = 100)
    private String returnRequestReasonCode;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderDetail> orderDetails = new ArrayList<>();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderReturnEvidence> returnEvidences = new ArrayList<>();
}
