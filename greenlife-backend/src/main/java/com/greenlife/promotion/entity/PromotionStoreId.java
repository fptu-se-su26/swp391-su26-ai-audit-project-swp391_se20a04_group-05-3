package com.greenlife.promotion.entity;

import java.io.Serializable;
import java.util.Objects;
import jakarta.persistence.Embeddable;

@Embeddable
public class PromotionStoreId implements Serializable {
    
    private static final long serialVersionUID = 1L;

    private Integer promotionId;
    private Integer storeId;

    public PromotionStoreId() {}

    public PromotionStoreId(Integer promotionId, Integer storeId) {
        this.promotionId = promotionId;
        this.storeId = storeId;
    }

    public Integer getPromotionId() { return promotionId; }
    public void setPromotionId(Integer promotionId) { this.promotionId = promotionId; }
    public Integer getStoreId() { return storeId; }
    public void setStoreId(Integer storeId) { this.storeId = storeId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PromotionStoreId that = (PromotionStoreId) o;
        return Objects.equals(promotionId, that.promotionId) &&
               Objects.equals(storeId, that.storeId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(promotionId, storeId);
    }
}
