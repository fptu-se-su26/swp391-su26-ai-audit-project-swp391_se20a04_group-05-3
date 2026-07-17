package com.greenlife.finance.entity;

import com.greenlife.store.entity.Store;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "store_balances")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreBalance {

    @Id
    @Column(name = "store_id")
    private Integer storeId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "store_id")
    private Store store;

    @Column(name = "pending_balance", nullable = false, precision = 12, scale = 0)
    private BigDecimal pendingBalance;

    @Column(name = "available_balance", nullable = false, precision = 12, scale = 0)
    private BigDecimal availableBalance;

    @Column(name = "reserved_balance", nullable = false, precision = 12, scale = 0)
    private BigDecimal reservedBalance;

    @Column(name = "commission_receivable_balance", nullable = false, precision = 12, scale = 0)
    @Builder.Default
    private BigDecimal commissionReceivableBalance = BigDecimal.ZERO;

    @Version
    @Column(name = "version", nullable = false)
    private Integer version;

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "last_reconciled_at")
    private LocalDateTime lastReconciledAt;
}
