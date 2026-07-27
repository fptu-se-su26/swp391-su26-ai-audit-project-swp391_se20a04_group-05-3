package com.greenlife.plant.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

/**
 * DTO for Store Owner product create/update operations.
 * <p>
 * This DTO intentionally does NOT contain {@code storeId}.
 * The owning store is always derived from the authenticated user's
 * approved store on the backend — the frontend must never send storeId.
 * </p>
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreOwnerPlantRequest {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(max = 150, message = "Tên sản phẩm không được vượt quá 150 ký tự")
    private String name;

    @Size(max = 180, message = "Slug không được vượt quá 180 ký tự")
    private String slug; // optional; if blank, will be auto-generated from name

    @NotNull(message = "ID danh mục không được để trống")
    private Integer categoryId;

    private String description;

    @NotNull(message = "Giá không được để trống")
    @DecimalMin(value = "0.0", message = "Giá sản phẩm phải lớn hơn hoặc bằng 0")
    private BigDecimal price;

    @NotNull(message = "Số lượng kho không được để trống")
    @Min(value = 0, message = "Số lượng kho phải lớn hơn hoặc bằng 0")
    private Integer stock;

    @Size(max = 500, message = "Đường dẫn hình ảnh không được vượt quá 500 ký tự")
    private String imageUrl;

    @Size(max = 50, message = "Mức độ chăm sóc không được vượt quá 50 ký tự")
    private String careLevel;

    @Size(max = 100, message = "Yêu cầu ánh sáng không được vượt quá 100 ký tự")
    private String sunlight;

    @Size(max = 100, message = "Tần suất tưới không được vượt quá 100 ký tự")
    private String waterLevel;

    @Size(max = 100, message = "Mã SKU không được vượt quá 100 ký tự")
    private String sku;

    private String status; // ACTIVE, INACTIVE, OUT_OF_STOCK — optional; derived from stock if blank
}
