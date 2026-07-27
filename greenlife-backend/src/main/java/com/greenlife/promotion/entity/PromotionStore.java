package com.greenlife.promotion.entity;

import com.greenlife.store.entity.Store;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "promotion_stores")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromotionStore {

    @EmbeddedId
    private PromotionStoreId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("promotionId")
    @JoinColumn(name = "promotion_id", nullable = false)
    private Promotion promotion;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("storeId")
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;
}
