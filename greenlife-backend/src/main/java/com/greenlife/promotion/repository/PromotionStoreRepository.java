package com.greenlife.promotion.repository;

import com.greenlife.promotion.entity.Promotion;
import com.greenlife.promotion.entity.PromotionStore;
import com.greenlife.promotion.entity.PromotionStoreId;
import com.greenlife.promotion.entity.enums.PromotionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface PromotionStoreRepository extends JpaRepository<PromotionStore, PromotionStoreId> {

    @Query("select ps from PromotionStore ps where ps.id.promotionId in :promotionIds")
    List<PromotionStore> findAllByPromotionIdIn(@Param("promotionIds") List<Integer> promotionIds);

    @Query("""
        select ps.promotion
        from PromotionStore ps
        where ps.store.id = :storeId
          and ps.promotion.status = :status
        order by ps.promotion.priority desc
    """)
    List<Promotion> findEligiblePromotionsByStore(
        @Param("storeId") Integer storeId,
        @Param("status") PromotionStatus status
    );

    @Modifying
    @Query("delete from PromotionStore ps where ps.id.promotionId = :promotionId")
    void deleteAllByPromotionId(@Param("promotionId") Integer promotionId);

    @Query("select ps.id.storeId from PromotionStore ps where ps.id.promotionId = :promotionId order by ps.id.storeId asc")
    List<Integer> findStoreIdsByPromotionId(@Param("promotionId") Integer promotionId);
}
