package com.greenlife.promotion.repository;

import com.greenlife.promotion.entity.PromotionAuditHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PromotionAuditHistoryRepository extends JpaRepository<PromotionAuditHistory, Integer> {

    List<PromotionAuditHistory> findByPromotionIdOrderByCreatedAtDesc(Integer promotionId);
}
