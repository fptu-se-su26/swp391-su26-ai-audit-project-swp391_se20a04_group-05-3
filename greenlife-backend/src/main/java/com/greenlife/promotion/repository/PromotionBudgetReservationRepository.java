package com.greenlife.promotion.repository;

import com.greenlife.promotion.entity.PromotionBudgetReservation;
import com.greenlife.promotion.entity.enums.PromotionBudgetReservationStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface PromotionBudgetReservationRepository extends JpaRepository<PromotionBudgetReservation, Integer> {

    Optional<PromotionBudgetReservation> findByReservationKey(String reservationKey);

    List<PromotionBudgetReservation> findByOrderId(Integer orderId);

    List<PromotionBudgetReservation> findByPromotionIdAndStatus(
        Integer promotionId,
        PromotionBudgetReservationStatus status
    );

    /**
     * Pessimistically lock a budget reservation by its reservation key.
     * Note: This lock is only effective inside an active transaction boundary.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        select r
        from PromotionBudgetReservation r
        where r.reservationKey = :reservationKey
    """)
    Optional<PromotionBudgetReservation> findAndLockByReservationKey(@Param("reservationKey") String reservationKey);
}
