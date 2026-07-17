package com.greenlife.promotion.entity;

import java.io.Serializable;
import java.util.Objects;
import jakarta.persistence.Embeddable;

@Embeddable
public class PromotionProductId implements Serializable {

    private static final long serialVersionUID = 1L;

    private Integer promotionId;
    private Integer plantId;

    public PromotionProductId() {}

    public PromotionProductId(Integer promotionId, Integer plantId) {
        this.promotionId = promotionId;
        this.plantId = plantId;
    }

    public Integer getPromotionId() { return promotionId; }
    public void setPromotionId(Integer promotionId) { this.promotionId = promotionId; }
    public Integer getPlantId() { return plantId; }
    public void setPlantId(Integer plantId) { this.plantId = plantId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PromotionProductId that = (PromotionProductId) o;
        return Objects.equals(promotionId, that.promotionId) &&
               Objects.equals(plantId, that.plantId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(promotionId, plantId);
    }
}
