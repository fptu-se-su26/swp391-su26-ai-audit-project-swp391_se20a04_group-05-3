package com.greenlife.promotion.repository;

import com.greenlife.promotion.entity.Promotion;
import com.greenlife.promotion.entity.enums.PromotionScopeType;
import com.greenlife.promotion.entity.enums.PromotionStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface PromotionRepository extends JpaRepository<Promotion, Integer> {

    List<Promotion> findByStatusOrderByPriorityDescIdAsc(PromotionStatus status);

    List<Promotion> findByStatusAndScopeTypeOrderByPriorityDesc(
        PromotionStatus status,
        PromotionScopeType scopeType
    );

    List<Promotion> findByStatusOrderByPriorityDesc(PromotionStatus status);

    Page<Promotion> findByStatus(PromotionStatus status, Pageable pageable);

    Page<Promotion> findByScopeType(PromotionScopeType scopeType, Pageable pageable);

    Page<Promotion> findByStatusAndScopeType(PromotionStatus status, PromotionScopeType scopeType, Pageable pageable);

    /**
     * Pessimistically lock a promotion by its ID to protect activation/end transitions and budget counters.
     * Note: This lock is only effective inside an active transaction boundary.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Promotion p where p.id = :id")
    Optional<Promotion> findAndLockById(@Param("id") Integer id);
}
