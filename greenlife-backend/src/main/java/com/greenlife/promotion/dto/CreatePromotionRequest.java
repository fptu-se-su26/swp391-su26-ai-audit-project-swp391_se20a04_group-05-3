package com.greenlife.promotion.dto;

import com.greenlife.promotion.entity.enums.PromotionDiscountType;
import com.greenlife.promotion.entity.enums.PromotionFundingSource;
import com.greenlife.promotion.entity.enums.PromotionScopeType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record CreatePromotionRequest(
    @NotBlank(message = "Tên chương trình khuyến mãi không được để trống")
    @Size(max = 150, message = "Tên chương trình không được vượt quá 150 ký tự")
    String name,

    @Size(max = 1000, message = "Mô tả không được vượt quá 1000 ký tự")
    String description,

    @NotNull(message = "Phạm vi khuyến mãi không được để trống")
    PromotionScopeType scopeType,

    @NotNull(message = "Loại giảm giá không được để trống")
    PromotionDiscountType discountType,

    @NotNull(message = "Giá trị giảm giá không được để trống")
    @DecimalMin(value = "1", message = "Giá trị giảm giá phải lớn hơn hoặc bằng 1")
    @Digits(integer = 12, fraction = 0, message = "Giá trị giảm giá nguyên không được chứa phần thập phân và tối đa 12 chữ số")
    BigDecimal discountValue,

    @DecimalMin(value = "0", message = "Giới hạn giảm giá tối đa phải lớn hơn hoặc bằng 0")
    @Digits(integer = 12, fraction = 0, message = "Giới hạn giảm giá tối đa nguyên không được chứa phần thập phân và tối đa 12 chữ số")
    BigDecimal maxDiscountAmount,

    @NotNull(message = "Nguồn tài trợ không được để trống")
    PromotionFundingSource fundingSource,

    @NotNull(message = "Tỷ lệ tài trợ của nền tảng không được để trống")
    @DecimalMin(value = "0.00", message = "Tỷ lệ tài trợ của nền tảng phải từ 0.00 trở lên")
    @DecimalMax(value = "100.00", message = "Tỷ lệ tài trợ của nền tảng không được vượt quá 100.00")
    @Digits(integer = 3, fraction = 2, message = "Tỷ lệ tài trợ tối đa 3 chữ số phần nguyên và 2 chữ số thập phân")
    BigDecimal platformFundingRatio,

    @NotNull(message = "Tỷ lệ tài trợ của nhà vườn không được để trống")
    @DecimalMin(value = "0.00", message = "Tỷ lệ tài trợ của nhà vườn phải từ 0.00 trở lên")
    @DecimalMax(value = "100.00", message = "Tỷ lệ tài trợ của nhà vườn không được vượt quá 100.00")
    @Digits(integer = 3, fraction = 2, message = "Tỷ lệ tài trợ tối đa 3 chữ số phần nguyên và 2 chữ số thập phân")
    BigDecimal storeFundingRatio,

    @NotNull(message = "Độ ưu tiên không được để trống")
    @PositiveOrZero(message = "Độ ưu tiên phải lớn hơn hoặc bằng 0")
    Integer priority,

    @NotNull(message = "Ngân sách không được để trống")
    @DecimalMin(value = "0", inclusive = false, message = "Ngân sách phải lớn hơn 0")
    @Digits(integer = 12, fraction = 0, message = "Ngân sách nguyên không được chứa phần thập phân và tối đa 12 chữ số")
    BigDecimal budget,

    List<Integer> storeIds,
    List<Integer> productIds
) {
    public CreatePromotionRequest(
        String name,
        String description,
        PromotionScopeType scopeType,
        PromotionDiscountType discountType,
        BigDecimal discountValue,
        BigDecimal maxDiscountAmount,
        PromotionFundingSource fundingSource,
        BigDecimal platformFundingRatio,
        BigDecimal storeFundingRatio,
        Integer priority,
        BigDecimal budget,
        List<Integer> storeIds,
        List<Integer> productIds
    ) {
        this.name = name;
        this.description = description;
        this.scopeType = scopeType;
        this.discountType = discountType;
        this.discountValue = discountValue;
        this.maxDiscountAmount = maxDiscountAmount;
        this.fundingSource = fundingSource;
        this.platformFundingRatio = platformFundingRatio;
        this.storeFundingRatio = storeFundingRatio;
        this.priority = priority;
        this.budget = budget;

        if (storeIds == null) {
            this.storeIds = List.of();
        } else {
            for (Integer id : storeIds) {
                if (id == null) {
                    throw new IllegalArgumentException("storeIds elements must not be null");
                }
            }
            this.storeIds = List.copyOf(storeIds);
        }

        if (productIds == null) {
            this.productIds = List.of();
        } else {
            for (Integer id : productIds) {
                if (id == null) {
                    throw new IllegalArgumentException("productIds elements must not be null");
                }
            }
            this.productIds = List.copyOf(productIds);
        }
    }
}
