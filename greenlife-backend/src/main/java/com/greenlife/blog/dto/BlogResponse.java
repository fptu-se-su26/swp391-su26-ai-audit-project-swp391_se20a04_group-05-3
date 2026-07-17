package com.greenlife.blog.dto;

import com.greenlife.blog.entity.enums.BlogCategory;
import com.greenlife.blog.entity.enums.BlogStatus;
import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlogResponse {
    private Integer id;
    private String title;
    private String slug;
    private BlogCategory category;
    private String summary;
    private String content;
    private String imageUrl;
    private Integer readingTime;
    private BlogStatus status;
    private BlogStatus currentRevisionStatus;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private AuthorDto author;
    private Integer version;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuthorDto {
        private Integer id;
        private String fullName;
        private String email;
    }
}
