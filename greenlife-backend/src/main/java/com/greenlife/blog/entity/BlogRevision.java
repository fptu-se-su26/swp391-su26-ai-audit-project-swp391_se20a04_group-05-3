package com.greenlife.blog.entity;

import com.greenlife.user.entity.User;
import com.greenlife.blog.entity.enums.BlogCategory;
import com.greenlife.blog.entity.enums.BlogStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "blog_revisions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlogRevision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blog_id", nullable = false)
    private Blog blog;

    @Column(name = "revision_number", nullable = false)
    private Integer revisionNumber;

    @Column(nullable = false, length = 220)
    private String title;

    @Column(length = 500)
    private String summary;

    @Lob
    @Column(name = "content_html", columnDefinition = "NVARCHAR(MAX)")
    private String contentHtml;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 60)
    private BlogCategory category;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BlogStatus status;

    @Column(name = "source_type", nullable = false, length = 30)
    private String sourceType; // DIRECT, DOCX, MD, TXT

    @Column(name = "source_file_name", length = 255)
    private String sourceFileName;

    @Column(name = "reviewer_note", length = 1000)
    private String reviewerNote;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id")
    private User reviewer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Version
    @Column(nullable = false)
    @Builder.Default
    private Integer version = 0;

    @Column(nullable = false)
    @Builder.Default
    private Boolean deleted = false;
}
