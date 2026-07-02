package com.greenlife.repository;

import com.greenlife.entity.StoreApprovalAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StoreApprovalAuditRepository extends JpaRepository<StoreApprovalAudit, Integer> {
    List<StoreApprovalAudit> findByStoreId(Integer storeId);
}
