package com.greenlife.blog.dto;

import com.greenlife.blog.entity.enums.BlogCategory;
import com.greenlife.blog.entity.enums.BlogStatus;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminBlogReviewResponse {
    private Integer id;
    private AuthorDto author;
    private String authorRole;
    private Boolean hasStoreBadge;
    private String title;
    private String slug;
    private BlogCategory category;
    private String summary;
    private String content;
    private String imageUrl;
    private Integer readingTime;
    private BlogStatus status;
    private BlogStatus currentRevisionStatus;
    private String reviewerNote;
    private Integer version;
    private LocalDateTime submittedAt;
    private LocalDateTime createdAt;
    private PreviewDto previousPublished;
    private List<ModerationHistoryDto> history;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuthorDto {
        private Integer id;
        private String fullName;
        private String email;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PreviewDto {
        private String title;
        private String summary;
        private String content;
        private String imageUrl;
        private BlogCategory category;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ModerationHistoryDto {
        private Integer id;
        private String actorName;
        private String action;
        private String note;
        private LocalDateTime createdAt;
    }
}
