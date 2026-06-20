package com.greenlife.repository.specification;

import com.greenlife.entity.DiagnosisHistory;
import com.greenlife.entity.enums.Severity;
import org.springframework.data.jpa.domain.Specification;

public class DiagnosisHistorySpecifications {

    public static Specification<DiagnosisHistory> hasCustomer(Integer customerId) {
        return (root, query, cb) -> cb.equal(root.get("customer").get("id"), customerId);
    }

    public static Specification<DiagnosisHistory> hasPlant(Integer plantId) {
        return (root, query, cb) -> plantId == null ? null : cb.equal(root.get("plant").get("id"), plantId);
    }

    public static Specification<DiagnosisHistory> hasSeverity(Severity severity) {
        return (root, query, cb) -> severity == null ? null : cb.equal(root.get("severity"), severity);
    }
}
