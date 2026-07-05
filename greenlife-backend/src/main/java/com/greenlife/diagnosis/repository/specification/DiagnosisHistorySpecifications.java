package com.greenlife.diagnosis.repository.specification;

import com.greenlife.diagnosis.entity.DiagnosisHistory;
import com.greenlife.diagnosis.entity.enums.Severity;
import org.springframework.data.jpa.domain.Specification;

public class DiagnosisHistorySpecifications {

    @SuppressWarnings("null")
    public static Specification<DiagnosisHistory> hasCustomer(Integer customerId) {
        return (root, query, cb) -> cb.equal(root.get("customer").get("id"), customerId);
    }

    @SuppressWarnings("null")
    public static Specification<DiagnosisHistory> hasPlant(Integer plantId) {
        return (root, query, cb) -> plantId == null ? null : cb.equal(root.get("plant").get("id"), plantId);
    }

    @SuppressWarnings("null")
    public static Specification<DiagnosisHistory> hasSeverity(Severity severity) {
        return (root, query, cb) -> severity == null ? null : cb.equal(root.get("severity"), severity);
    }
}
