package com.greenlife.service;

import com.greenlife.dto.BlogRequest;
import com.greenlife.dto.BlogResponse;
import com.greenlife.entity.Blog;
import com.greenlife.entity.User;
import com.greenlife.entity.enums.BlogCategory;
import com.greenlife.entity.enums.BlogStatus;
import com.greenlife.entity.enums.SecurityAuditAction;
import com.greenlife.exception.CustomException;
import com.greenlife.repository.BlogRepository;
import com.greenlife.repository.specification.BlogSpecifications;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BlogService {

    private final BlogRepository blogRepository;
    private final SecurityAuditService securityAuditService;

    @Transactional
    public BlogResponse createBlog(BlogRequest request, User author) {
        String slug = generateUniqueSlug(request.getTitle());
        int readingTime = calculateReadingTime(request.getContent());

        Blog blog = Blog.builder()
                .author(author)
                .title(request.getTitle())
                .slug(slug)
                .category(request.getCategory())
                .summary(request.getSummary())
                .content(request.getContent())
                .imageUrl(request.getImageUrl())
                .readingTime(readingTime)
                .status(BlogStatus.DRAFT)
                .deleted(false)
                .build();

        Blog saved = blogRepository.save(blog);

        // Isolated audit logging
        try {
            String roleName = author.getRole() != null ? author.getRole().getName() : "User";
            String desc = String.format("%s %s created blog ID %d", capitalize(roleName), author.getEmail(), saved.getId());
            securityAuditService.recordSecurityAudit(author, SecurityAuditAction.ADMIN_ACTION, desc);
        } catch (Exception e) {
            log.error("Failed to write security audit log for blog creation", e);
        }

        return mapToResponse(saved);
    }

    @Transactional
    public BlogResponse updateBlog(Integer id, BlogRequest request, User currentUser) {
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new CustomException("Blog không tồn tại", HttpStatus.NOT_FOUND));

        validateOwnershipOrAdmin(blog, currentUser, "Không có quyền chỉnh sửa bài viết này");

        // Update fields but leave slug completely unchanged
        blog.setTitle(request.getTitle());
        blog.setCategory(request.getCategory());
        blog.setSummary(request.getSummary());
        blog.setContent(request.getContent());
        blog.setImageUrl(request.getImageUrl());
        blog.setReadingTime(calculateReadingTime(request.getContent()));
        blog.setUpdatedAt(LocalDateTime.now());

        Blog saved = blogRepository.saveAndFlush(blog);

        // Isolated audit logging
        try {
            String roleName = currentUser.getRole() != null ? currentUser.getRole().getName() : "User";
            String desc = String.format("%s %s updated blog ID %d", capitalize(roleName), currentUser.getEmail(), saved.getId());
            securityAuditService.recordSecurityAudit(currentUser, SecurityAuditAction.ADMIN_ACTION, desc);
        } catch (Exception e) {
            log.error("Failed to write security audit log for blog update", e);
        }

        return mapToResponse(saved);
    }

    @Transactional
    public void deleteBlog(Integer id, User currentUser) {
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new CustomException("Blog không tồn tại", HttpStatus.NOT_FOUND));

        validateOwnershipOrAdmin(blog, currentUser, "Không có quyền xóa bài viết này");

        // Participate in optimistic locking by updating state and using save
        blog.setDeleted(true);
        blog.setUpdatedAt(LocalDateTime.now());
        blogRepository.saveAndFlush(blog);

        // Isolated audit logging
        try {
            String roleName = currentUser.getRole() != null ? currentUser.getRole().getName() : "User";
            String desc = String.format("%s %s deleted blog ID %d", capitalize(roleName), currentUser.getEmail(), id);
            securityAuditService.recordSecurityAudit(currentUser, SecurityAuditAction.ADMIN_ACTION, desc);
        } catch (Exception e) {
            log.error("Failed to write security audit log for blog deletion", e);
        }
    }

    @Transactional
    public BlogResponse publishBlog(Integer id, User currentUser) {
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new CustomException("Blog không tồn tại", HttpStatus.NOT_FOUND));

        validateOwnershipOrAdmin(blog, currentUser, "Không có quyền xuất bản bài viết này");

        // Validation for completeness before publishing
        if (isEmpty(blog.getTitle()) || isEmpty(blog.getSummary()) || isEmpty(blog.getContent()) || isEmpty(blog.getImageUrl())) {
            throw new CustomException("Blog chưa đủ thông tin để xuất bản", HttpStatus.BAD_REQUEST);
        }

        blog.setStatus(BlogStatus.PUBLISHED);
        blog.setPublishedAt(LocalDateTime.now());
        blog.setUpdatedAt(LocalDateTime.now());

        Blog saved = blogRepository.saveAndFlush(blog);

        // Isolated audit logging
        try {
            String desc = String.format("Admin/Store Owner %s published blog ID %d", currentUser.getEmail(), saved.getId());
            securityAuditService.recordSecurityAudit(currentUser, SecurityAuditAction.ADMIN_ACTION, desc);
        } catch (Exception e) {
            log.error("Failed to write security audit log for blog publish", e);
        }

        return mapToResponse(saved);
    }

    @Transactional
    public BlogResponse archiveBlog(Integer id, User currentUser) {
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new CustomException("Blog không tồn tại", HttpStatus.NOT_FOUND));

        validateOwnershipOrAdmin(blog, currentUser, "Không có quyền lưu trữ bài viết này");

        blog.setStatus(BlogStatus.ARCHIVED);
        blog.setUpdatedAt(LocalDateTime.now());

        Blog saved = blogRepository.saveAndFlush(blog);

        // Isolated audit logging
        try {
            String desc = String.format("Admin/Store Owner %s archived blog ID %d", currentUser.getEmail(), saved.getId());
            securityAuditService.recordSecurityAudit(currentUser, SecurityAuditAction.ADMIN_ACTION, desc);
        } catch (Exception e) {
            log.error("Failed to write security audit log for blog archive", e);
        }

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<BlogResponse> getPublicBlogs(String keyword, BlogCategory category, Pageable pageable) {
        int pageSize = Math.min(pageable.getPageSize(), 50);
        Pageable restrictedPageable = PageRequest.of(pageable.getPageNumber(), pageSize, pageable.getSort());

        Specification<Blog> spec = Specification.where(BlogSpecifications.fetchAuthor())
                .and(BlogSpecifications.hasStatus(BlogStatus.PUBLISHED))
                .and(BlogSpecifications.hasCategory(category))
                .and(BlogSpecifications.hasKeyword(keyword));

        return blogRepository.findAll(spec, restrictedPageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public BlogResponse getBlogById(Integer id, User currentUser) {
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new CustomException("Blog không tồn tại", HttpStatus.NOT_FOUND));

        validateVisibility(blog, currentUser);
        return mapToResponse(blog);
    }

    @Transactional(readOnly = true)
    public BlogResponse getBlogBySlug(String slug, User currentUser) {
        Blog blog = blogRepository.findBySlug(slug)
                .orElseThrow(() -> new CustomException("Blog không tồn tại", HttpStatus.NOT_FOUND));

        validateVisibility(blog, currentUser);
        return mapToResponse(blog);
    }

    @Transactional(readOnly = true)
    public Page<BlogResponse> getMyBlogs(String keyword, BlogCategory category, BlogStatus status, User currentUser, Pageable pageable) {
        int pageSize = Math.min(pageable.getPageSize(), 50);
        Pageable restrictedPageable = PageRequest.of(pageable.getPageNumber(), pageSize, pageable.getSort());

        Specification<Blog> spec = Specification.where(BlogSpecifications.fetchAuthor())
                .and(BlogSpecifications.hasAuthor(currentUser.getId()))
                .and(BlogSpecifications.hasCategory(category))
                .and(BlogSpecifications.hasStatus(status))
                .and(BlogSpecifications.hasKeyword(keyword));

        return blogRepository.findAll(spec, restrictedPageable).map(this::mapToResponse);
    }

    public List<BlogCategory> getCategories() {
        return Arrays.asList(BlogCategory.values());
    }

    // Helper utilities
    private void validateOwnershipOrAdmin(Blog blog, User currentUser, String forbiddenMessage) {
        boolean isAdmin = currentUser.getRole() != null && "ADMIN".equals(currentUser.getRole().getName());
        boolean isAuthor = blog.getAuthor().getId().equals(currentUser.getId());
        if (!isAdmin && !isAuthor) {
            throw new CustomException(forbiddenMessage, HttpStatus.FORBIDDEN);
        }
    }

    private void validateVisibility(Blog blog, User currentUser) {
        if (blog.getStatus() == BlogStatus.PUBLISHED) {
            return;
        }
        // If blog is draft or archived, only author or admin can view
        if (currentUser == null) {
            throw new CustomException("Blog không tồn tại", HttpStatus.NOT_FOUND);
        }
        boolean isAdmin = currentUser.getRole() != null && "ADMIN".equals(currentUser.getRole().getName());
        boolean isAuthor = blog.getAuthor().getId().equals(currentUser.getId());
        if (!isAdmin && !isAuthor) {
            throw new CustomException("Blog không tồn tại", HttpStatus.NOT_FOUND);
        }
    }

    private String generateUniqueSlug(String title) {
        String baseSlug = generateSlug(title);
        String slug = baseSlug;
        int suffix = 1;
        while (blogRepository.countBySlugIncludingDeleted(slug) > 0) {
            suffix++;
            slug = baseSlug + "-" + suffix;
        }
        return slug;
    }

    private String generateSlug(String title) {
        if (title == null) return "";
        String normalized = title.trim().toLowerCase();
        normalized = removeAccents(normalized);
        normalized = normalized.replaceAll("[^a-z0-9\\s\\-]", "");
        normalized = normalized.replaceAll("[\\s\\-]+", "-");
        normalized = normalized.replaceAll("^\\-+", "").replaceAll("\\-+$", "");
        return normalized;
    }

    private String removeAccents(String str) {
        if (str == null) return null;
        char[] charArr = str.toCharArray();
        StringBuilder sb = new StringBuilder();
        for (char c : charArr) {
            sb.append(removeAccentChar(c));
        }
        return sb.toString();
    }

    private char removeAccentChar(char c) {
        switch (c) {
            case 'à': case 'á': case 'ạ': case 'ả': case 'ã': case 'â': case 'ầ': case 'ấ': case 'ậ': case 'ẩ': case 'ẫ': case 'ă': case 'ằ': case 'ắ': case 'ặ': case 'ẳ': case 'ẵ':
                return 'a';
            case 'è': case 'é': case 'ẹ': case 'ẻ': case 'ẽ': case 'ê': case 'ề': case 'ế': case 'ệ': case 'ể': case 'ễ':
                return 'e';
            case 'ì': case 'í': case 'ị': case 'ỉ': case 'ĩ':
                return 'i';
            case 'ò': case 'ó': case 'ọ': case 'ỏ': case 'õ': case 'ô': case 'ồ': case 'ố': case 'ộ': case 'ổ': case 'ỗ': case 'ơ': case 'ờ': case 'ớ': case 'ợ': case 'ở': case 'ỡ':
                return 'o';
            case 'ù': case 'ú': case 'ụ': case 'ủ': case 'ũ': case 'ư': case 'ừ': case 'ứ': case 'ự': case 'ử': case 'ữ':
                return 'u';
            case 'ỳ': case 'ý': case 'ỵ': case 'ỷ': case 'ỹ':
                return 'y';
            case 'đ':
                return 'd';
            default:
                return c;
        }
    }

    private int calculateReadingTime(String content) {
        if (content == null || content.trim().isEmpty()) {
            return 1;
        }
        String stripped = content.replaceAll("<[^>]*>", "");
        String[] words = stripped.trim().split("\\s+");
        int wordCount = words.length;
        if (wordCount == 0) return 1;
        return Math.max(1, (int) Math.ceil((double) wordCount / 200.0));
    }

    private boolean isEmpty(String str) {
        return str == null || str.trim().isEmpty();
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return str;
        // e.g. store_owner -> Store Owner
        String[] parts = str.toLowerCase().split("_");
        StringBuilder sb = new StringBuilder();
        for (String part : parts) {
            if (sb.length() > 0) sb.append(" ");
            sb.append(Character.toUpperCase(part.charAt(0))).append(part.substring(1));
        }
        return sb.toString();
    }

    private BlogResponse mapToResponse(Blog blog) {
        if (blog == null) return null;
        BlogResponse.AuthorDto authorDto = null;
        if (blog.getAuthor() != null) {
            authorDto = BlogResponse.AuthorDto.builder()
                    .id(blog.getAuthor().getId())
                    .fullName(blog.getAuthor().getFullName())
                    .email(blog.getAuthor().getEmail())
                    .build();
        }
        return BlogResponse.builder()
                .id(blog.getId())
                .title(blog.getTitle())
                .slug(blog.getSlug())
                .category(blog.getCategory())
                .summary(blog.getSummary())
                .content(blog.getContent())
                .imageUrl(blog.getImageUrl())
                .readingTime(blog.getReadingTime())
                .status(blog.getStatus())
                .publishedAt(blog.getPublishedAt())
                .createdAt(blog.getCreatedAt())
                .updatedAt(blog.getUpdatedAt())
                .author(authorDto)
                .version(blog.getVersion())
                .build();
    }
}
