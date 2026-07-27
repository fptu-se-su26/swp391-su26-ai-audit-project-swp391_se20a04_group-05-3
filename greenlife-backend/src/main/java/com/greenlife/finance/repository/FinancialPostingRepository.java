package com.greenlife.finance.repository;

import com.greenlife.finance.entity.FinancialPosting;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FinancialPostingRepository extends JpaRepository<FinancialPosting, Long> {

    List<FinancialPosting> findByJournalIdOrderByIdAsc(Long journalId);

    List<FinancialPosting> findByStoreIdOrderByCreatedAtAsc(Integer storeId);

    List<FinancialPosting> findByStoreIdAndAccountCodeOrderByCreatedAtAsc(
        Integer storeId,
        String accountCode
    );
}
