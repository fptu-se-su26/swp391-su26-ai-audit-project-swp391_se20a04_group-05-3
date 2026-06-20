package com.greenlife.dto;

import com.greenlife.entity.enums.BlogCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlogRequest {

    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 220, message = "Tiêu đề không được vượt quá 220 ký tự")
    private String title;

    @NotNull(message = "Thể loại không được để trống")
    private BlogCategory category;

    @Size(max = 500, message = "Tóm tắt không được vượt quá 500 ký tự")
    private String summary;

    @NotBlank(message = "Nội dung không được để trống")
    private String content;

    @Size(max = 500, message = "Đường dẫn ảnh không được vượt quá 500 ký tự")
    private String imageUrl;
}
