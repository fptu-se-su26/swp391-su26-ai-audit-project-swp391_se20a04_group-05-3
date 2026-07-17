package com.greenlife.promotion.entity;

import com.greenlife.plant.entity.Plant;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "promotion_products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromotionProduct {

    @EmbeddedId
    private PromotionProductId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("promotionId")
    @JoinColumn(name = "promotion_id", nullable = false)
    private Promotion promotion;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("plantId")
    @JoinColumn(name = "plant_id", nullable = false)
    private Plant plant;
}
