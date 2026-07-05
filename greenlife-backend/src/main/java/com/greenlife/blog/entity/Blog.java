package com.greenlife.blog.entity;

import com.greenlife.user.entity.User;
import com.greenlife.blog.entity.enums.BlogCategory;
import com.greenlife.blog.entity.enums.BlogStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import java.time.LocalDateTime;

@Entity
@Table(name = "blogs")
@SQLDelete(sql = "UPDATE blogs SET deleted = 1 WHERE id = ? AND version = ?")
@SQLRestriction("deleted = 0")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Blog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false, length = 220)
    private String title;

    @Column(nullable = false, unique = true, length = 240)
    private String slug;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 60)
    private BlogCategory category;

    @Column(length = 500)
    private String summary;

    @Lob
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String content;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "reading_time")
    private Integer readingTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private BlogStatus status = BlogStatus.DRAFT;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(nullable = false)
    @Builder.Default
    private Boolean deleted = false;

    @Version
    @Column(nullable = false)
    @Builder.Default
    private Integer version = 0;
}
