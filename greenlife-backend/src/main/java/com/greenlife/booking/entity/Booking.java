package com.greenlife.booking.entity;

import com.greenlife.user.entity.User;
import com.greenlife.store.entity.Store;
import com.greenlife.booking.entity.enums.BookingStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    private PlantCareService service;

    @Column(name = "service_name_snapshot", length = 150)
    private String serviceNameSnapshot;

    @Column(name = "service_price_snapshot")
    private BigDecimal servicePriceSnapshot;

    @Column(name = "store_name_snapshot", length = 150)
    private String storeNameSnapshot;

    @Column(name = "scheduled_at", nullable = false)
    private LocalDateTime scheduledAt;

    @Column(name = "service_address", nullable = false, length = 255)
    private String serviceAddress;

    @Column(name = "customer_phone", length = 20)
    private String customerPhone;

    @Column(name = "customer_note", length = 500)
    private String customerNote;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private BookingStatus status = BookingStatus.PENDING;

    @Column(name = "cancel_reason", length = 500)
    private String cancelReason;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Version
    private Long version;
}
