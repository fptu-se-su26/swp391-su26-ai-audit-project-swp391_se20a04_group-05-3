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
public class AuthorBlogResponse {
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
    private String reviewerNote;
    private Boolean hasPublishedVersion;
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer version;
    private AuthorDto author;
    private List<RevisionDto> revisions;
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
    public static class RevisionDto {
        private Integer id;
        private Integer revisionNumber;
        private String title;
        private BlogStatus status;
        private LocalDateTime createdAt;
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
