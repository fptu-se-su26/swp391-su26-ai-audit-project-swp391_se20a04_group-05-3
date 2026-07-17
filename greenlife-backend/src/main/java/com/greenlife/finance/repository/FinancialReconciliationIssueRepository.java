package com.greenlife.finance.repository;

import com.greenlife.finance.entity.FinancialReconciliationIssue;
import com.greenlife.finance.entity.enums.ReconciliationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface FinancialReconciliationIssueRepository extends JpaRepository<FinancialReconciliationIssue, Integer> {

    List<FinancialReconciliationIssue> findByStatusOrderByDetectedAtDesc(
        ReconciliationStatus status
    );

    List<FinancialReconciliationIssue> findByRuleCodeAndEntityTypeAndEntityReferenceOrderByDetectedAtDesc(
        String ruleCode,
        String entityType,
        String entityReference
    );

    Optional<FinancialReconciliationIssue>
    findFirstByRuleCodeAndEntityTypeAndEntityReferenceAndStatusInOrderByDetectedAtDesc(
        String ruleCode,
        String entityType,
        String entityReference,
        Collection<ReconciliationStatus> statuses
    );
}
