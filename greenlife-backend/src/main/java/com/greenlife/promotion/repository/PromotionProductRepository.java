package com.greenlife.promotion.repository;

import com.greenlife.promotion.entity.Promotion;
import com.greenlife.promotion.entity.PromotionProduct;
import com.greenlife.promotion.entity.PromotionProductId;
import com.greenlife.promotion.entity.enums.PromotionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface PromotionProductRepository extends JpaRepository<PromotionProduct, PromotionProductId> {

    @Query("select pp from PromotionProduct pp where pp.id.promotionId in :promotionIds")
    List<PromotionProduct> findAllByPromotionIdIn(@Param("promotionIds") List<Integer> promotionIds);

    @Query("""
        select pp.promotion
        from PromotionProduct pp
        where pp.plant.id = :plantId
          and pp.promotion.status = :status
        order by pp.promotion.priority desc
    """)
    List<Promotion> findEligiblePromotionsByPlant(
        @Param("plantId") Integer plantId,
        @Param("status") PromotionStatus status
    );

    @Modifying
    @Query("delete from PromotionProduct pp where pp.id.promotionId = :promotionId")
    void deleteAllByPromotionId(@Param("promotionId") Integer promotionId);

    @Query("select pp.id.plantId from PromotionProduct pp where pp.id.promotionId = :promotionId order by pp.id.plantId asc")
    List<Integer> findPlantIdsByPromotionId(@Param("promotionId") Integer promotionId);
}
