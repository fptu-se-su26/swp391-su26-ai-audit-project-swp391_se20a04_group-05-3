package com.greenlife.finance.repository;

import com.greenlife.finance.entity.FinancialJournal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FinancialJournalRepository extends JpaRepository<FinancialJournal, Long> {

    Optional<FinancialJournal> findByBusinessReference(String businessReference);

    boolean existsByBusinessReference(String businessReference);

    Optional<FinancialJournal> findByReversalOfJournalId(Long journalId);

    List<FinancialJournal> findByOrderIdOrderByCreatedAtAsc(Integer orderId);

    List<FinancialJournal> findByPaymentTransactionIdOrderByCreatedAtAsc(Integer paymentTransactionId);

    List<FinancialJournal> findByRefundIdOrderByCreatedAtAsc(Integer refundId);

    List<FinancialJournal> findByPayoutIdOrderByCreatedAtAsc(Integer payoutId);
}
