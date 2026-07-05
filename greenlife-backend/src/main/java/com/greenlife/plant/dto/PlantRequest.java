package com.greenlife.plant.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlantRequest {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(max = 150, message = "Tên sản phẩm không được vượt quá 150 ký tự")
    private String name;

    @NotBlank(message = "Slug không được để trống")
    @Size(max = 180, message = "Slug không được vượt quá 180 ký tự")
    private String slug;

    @NotNull(message = "ID cửa hàng không được để trống")
    private Integer storeId;

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

    private String status; // ACTIVE, INACTIVE, OUT_OF_STOCK
}
