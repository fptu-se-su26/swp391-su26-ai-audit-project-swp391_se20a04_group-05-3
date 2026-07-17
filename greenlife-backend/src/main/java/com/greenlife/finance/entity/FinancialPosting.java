package com.greenlife.finance.entity;

import com.greenlife.store.entity.Store;
import com.greenlife.finance.entity.enums.FinancialAccountOwnerType;
import com.greenlife.finance.entity.enums.FinancialCurrency;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "financial_postings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinancialPosting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_id", nullable = false)
    private FinancialJournal journal;

    @Column(name = "account_code", nullable = false, length = 50)
    private String accountCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_owner_type", nullable = false, length = 30)
    private FinancialAccountOwnerType accountOwnerType;

    @Column(name = "account_owner_id")
    private Integer accountOwnerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store;

    @Column(name = "debit_amount", nullable = false, precision = 12, scale = 0)
    private BigDecimal debitAmount;

    @Column(name = "credit_amount", nullable = false, precision = 12, scale = 0)
    private BigDecimal creditAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "currency", nullable = false, length = 10)
    @Builder.Default
    private FinancialCurrency currency = FinancialCurrency.VND;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
