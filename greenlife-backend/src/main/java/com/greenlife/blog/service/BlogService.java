package com.greenlife.blog.service;

import com.greenlife.blog.dto.*;
import com.greenlife.blog.entity.Blog;
import com.greenlife.blog.entity.BlogRevision;
import com.greenlife.blog.entity.BlogModerationHistory;
import com.greenlife.user.entity.User;
import com.greenlife.blog.entity.enums.BlogCategory;
import com.greenlife.blog.entity.enums.BlogStatus;
import com.greenlife.auth.entity.enums.SecurityAuditAction;
import com.greenlife.auth.service.SecurityAuditService;
import com.greenlife.exception.CustomException;
import com.greenlife.blog.repository.BlogRepository;
import com.greenlife.blog.repository.BlogRevisionRepository;
import com.greenlife.blog.repository.BlogModerationHistoryRepository;
import com.greenlife.blog.repository.specification.BlogSpecifications;
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
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BlogService {

    private final BlogRepository blogRepository;
    private final BlogRevisionRepository blogRevisionRepository;
    private final BlogModerationHistoryRepository blogModerationHistoryRepository;
    private final SecurityAuditService securityAuditService;
    private final DocumentImportService documentImportService;

    @Transactional
    public AuthorBlogResponse createBlog(CreateBlogRequest request, User author) {
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

        blog = blogRepository.save(blog);

        // Create first revision
        BlogRevision revision = BlogRevision.builder()
                .blog(blog)
                .revisionNumber(1)
                .title(request.getTitle())
                .summary(request.getSummary())
                .contentHtml(request.getContent())
                .category(request.getCategory())
                .imageUrl(request.getImageUrl())
                .status(BlogStatus.DRAFT)
                .sourceType(request.getSourceType() != null ? request.getSourceType() : "DIRECT")
                .sourceFileName(request.getSourceFileName())
                .createdBy(author)
                .createdAt(LocalDateTime.now())
                .deleted(false)
                .build();

        revision = blogRevisionRepository.save(revision);

        blog.setCurrentRevision(revision);
        blog = blogRepository.saveAndFlush(blog);

        try {
            String roleName = author.getRole() != null ? author.getRole().getName() : "User";
            String desc = String.format("%s %s created blog ID %d", capitalize(roleName), author.getEmail(), blog.getId());
            securityAuditService.recordSecurityAudit(author, SecurityAuditAction.ADMIN_ACTION, desc);
        } catch (Exception e) {
            log.error("Failed to write security audit log for blog creation", e);
        }

        return mapToAuthorBlogResponse(blog);
    }

    @Transactional
    public AuthorBlogResponse createDraftRevision(Integer id, User currentUser) {
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new CustomException("Blog không tồn tại", HttpStatus.NOT_FOUND));
        validateOwnership(blog, currentUser, "Không có quyền tạo bản chỉnh sửa bài viết này");

        BlogRevision current = blog.getCurrentRevision();
        if (current != null && (current.getStatus() == BlogStatus.DRAFT || current.getStatus() == BlogStatus.CHANGES_REQUESTED)) {
            return mapToAuthorBlogResponse(blog);
        }
        if (current != null && current.getStatus() == BlogStatus.PENDING_REVIEW) {
            throw new CustomException("Bài viết đang trong trạng thái chờ duyệt. Không thể chỉnh sửa.", HttpStatus.BAD_REQUEST);
        }

        List<BlogRevision> revisions = blogRevisionRepository.findByBlogIdOrderByRevisionNumberDesc(blog.getId());
        int nextRevNum = 1;
        String title = blog.getTitle();
        String summary = blog.getSummary();
        String content = blog.getContent();
        String imageUrl = blog.getImageUrl();
        BlogCategory category = blog.getCategory();
        String sourceType = "DIRECT";
        String sourceFileName = null;

        if (!revisions.isEmpty()) {
            BlogRevision latest = revisions.get(0);
            nextRevNum = latest.getRevisionNumber() + 1;
            title = latest.getTitle();
            summary = latest.getSummary();
            content = latest.getContentHtml();
            imageUrl = latest.getImageUrl();
            category = latest.getCategory();
            sourceType = latest.getSourceType();
            sourceFileName = latest.getSourceFileName();
        }

        BlogRevision newRevision = BlogRevision.builder()
                .blog(blog)
                .revisionNumber(nextRevNum)
                .title(title)
                .summary(summary)
                .contentHtml(content)
                .category(category)
                .imageUrl(imageUrl)
                .status(BlogStatus.DRAFT)
                .sourceType(sourceType)
                .sourceFileName(sourceFileName)
                .createdBy(currentUser)
                .createdAt(LocalDateTime.now())
                .deleted(false)
                .build();

        newRevision = blogRevisionRepository.save(newRevision);
        blog.setCurrentRevision(newRevision);
        blog = blogRepository.saveAndFlush(blog);

        return mapToAuthorBlogResponse(blog);
    }

    @Transactional
    public AuthorBlogResponse updateBlog(Integer id, UpdateBlogDraftRequest request, User currentUser) {
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new CustomException("Blog không tồn tại", HttpStatus.NOT_FOUND));
        validateOwnership(blog, currentUser, "Không có quyền chỉnh sửa bài viết này");

        BlogRevision revision = blog.getCurrentRevision();
        if (revision == null) {
            throw new CustomException("Không tìm thấy bản nháp để chỉnh sửa", HttpStatus.NOT_FOUND);
        }

        if (revision.getStatus() == BlogStatus.PENDING_REVIEW) {
            throw new CustomException("Bài viết đang chờ duyệt, không thể chỉnh sửa", HttpStatus.BAD_REQUEST);
        }
        if (revision.getStatus() == BlogStatus.REJECTED) {
            throw new CustomException("Bài viết đã bị từ chối không thể chỉnh sửa trực tiếp. Vui lòng tạo bản sửa đổi mới.", HttpStatus.BAD_REQUEST);
        }
        if (revision.getStatus() == BlogStatus.PUBLISHED || revision.getStatus() == BlogStatus.ARCHIVED) {
            throw new CustomException("Bài viết đã được đăng hoặc lưu trữ không thể chỉnh sửa trực tiếp. Vui lòng tạo bản sửa đổi mới.", HttpStatus.BAD_REQUEST);
        }

        if (!revision.getVersion().equals(request.getVersion())) {
            throw new CustomException("Dữ liệu bài viết đã được thay đổi bởi một phiên khác. Vui lòng tải lại và thử lại.", HttpStatus.CONFLICT);
        }

        revision.setTitle(request.getTitle());
        revision.setCategory(request.getCategory());
        revision.setSummary(request.getSummary());
        revision.setContentHtml(request.getContent());
        revision.setImageUrl(request.getImageUrl());
        if (request.getSourceType() != null) {
            revision.setSourceType(request.getSourceType());
        }
        if (request.getSourceFileName() != null) {
            revision.setSourceFileName(request.getSourceFileName());
        }
        revision.setUpdatedAt(LocalDateTime.now());
        
        if (revision.getStatus() == BlogStatus.CHANGES_REQUESTED || revision.getStatus() == BlogStatus.REJECTED) {
            revision.setStatus(BlogStatus.DRAFT);
        }

        blogRevisionRepository.saveAndFlush(revision);

        if (blog.getStatus() != BlogStatus.PUBLISHED) {
            blog.setTitle(request.getTitle());
            blog.setCategory(request.getCategory());
            blog.setSummary(request.getSummary());
            blog.setContent(request.getContent());
            blog.setImageUrl(request.getImageUrl());
            blog.setReadingTime(calculateReadingTime(request.getContent()));
            blog.setUpdatedAt(LocalDateTime.now());
            blogRepository.saveAndFlush(blog);
        }

        return mapToAuthorBlogResponse(blog);
    }

    @Transactional
    public AuthorBlogResponse submitBlog(Integer id, SubmitBlogRequest request, User currentUser) {
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new CustomException("Blog không tồn tại", HttpStatus.NOT_FOUND));
        validateOwnership(blog, currentUser, "Không có quyền gửi bài viết này");

        BlogRevision revision = blog.getCurrentRevision();
        if (revision == null) {
            throw new CustomException("Không tìm thấy bản nháp để gửi duyệt", HttpStatus.NOT_FOUND);
        }

        if (revision.getStatus() != BlogStatus.DRAFT && revision.getStatus() != BlogStatus.CHANGES_REQUESTED) {
            throw new CustomException("Trạng thái bài viết không hợp lệ để gửi duyệt", HttpStatus.BAD_REQUEST);
        }

        if (!revision.getVersion().equals(request.getVersion())) {
            throw new CustomException("Dữ liệu bài viết đã được thay đổi bởi một phiên khác. Vui lòng tải lại và thử lại.", HttpStatus.CONFLICT);
        }

        if (isEmpty(revision.getTitle()) || isEmpty(revision.getSummary()) || isEmpty(revision.getContentHtml()) || isEmpty(revision.getImageUrl())) {
            throw new CustomException("Bài viết chưa đủ thông tin để gửi duyệt", HttpStatus.BAD_REQUEST);
        }

        revision.setStatus(BlogStatus.PENDING_REVIEW);
        revision.setSubmittedAt(LocalDateTime.now());
        revision.setUpdatedAt(LocalDateTime.now());
        blogRevisionRepository.saveAndFlush(revision);

        BlogModerationHistory history = BlogModerationHistory.builder()
                .blog(blog)
                .revision(revision)
                .actor(currentUser)
                .action("SUBMITTED")
                .createdAt(LocalDateTime.now())
                .build();
        blogModerationHistoryRepository.save(history);

        return mapToAuthorBlogResponse(blog);
    }

    @Transactional
    public AuthorBlogResponse withdrawBlog(Integer id, SubmitBlogRequest request, User currentUser) {
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new CustomException("Blog không tồn tại", HttpStatus.NOT_FOUND));
        validateOwnership(blog, currentUser, "Không có quyền rút bài viết này");

        BlogRevision revision = blog.getCurrentRevision();
        if (revision == null) {
            throw new CustomException("Không tìm thấy bản nháp", HttpStatus.NOT_FOUND);
        }

        if (revision.getStatus() != BlogStatus.PENDING_REVIEW) {
            throw new CustomException("Bài viết không ở trạng thái chờ duyệt", HttpStatus.BAD_REQUEST);
        }

        if (!revision.getVersion().equals(request.getVersion())) {
            throw new CustomException("Dữ liệu bài viết đã được thay đổi bởi một phiên khác. Vui lòng tải lại và thử lại.", HttpStatus.CONFLICT);
        }

        revision.setStatus(BlogStatus.DRAFT);
        revision.setUpdatedAt(LocalDateTime.now());
        blogRevisionRepository.saveAndFlush(revision);

        BlogModerationHistory history = BlogModerationHistory.builder()
                .blog(blog)
                .revision(revision)
                .actor(currentUser)
                .action("WITHDRAWN")
                .createdAt(LocalDateTime.now())
                .build();
        blogModerationHistoryRepository.save(history);

        return mapToAuthorBlogResponse(blog);
    }

    @Transactional
    public void deleteBlog(Integer id, User currentUser) {
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new CustomException("Blog không tồn tại", HttpStatus.NOT_FOUND));

        validateOwnershipOrAdmin(blog, currentUser, "Không có quyền xóa bài viết này");

        boolean isAdmin = currentUser.getRole() != null && "ADMIN".equals(currentUser.getRole().getName());
        if (!isAdmin && blog.getStatus() == BlogStatus.PUBLISHED) {
            throw new CustomException("Không thể xóa bài viết đã được xuất bản công khai", HttpStatus.BAD_REQUEST);
        }

        blog.setDeleted(true);
        blog.setUpdatedAt(LocalDateTime.now());
        blogRepository.saveAndFlush(blog);

        List<BlogRevision> revisions = blogRevisionRepository.findByBlogIdOrderByRevisionNumberDesc(blog.getId());
        for (BlogRevision rev : revisions) {
            rev.setDeleted(true);
            blogRevisionRepository.save(rev);
        }
        blogRevisionRepository.flush();

        try {
            String roleName = currentUser.getRole() != null ? currentUser.getRole().getName() : "User";
            String desc = String.format("%s %s deleted blog ID %d", capitalize(roleName), currentUser.getEmail(), id);
            securityAuditService.recordSecurityAudit(currentUser, SecurityAuditAction.ADMIN_ACTION, desc);
        } catch (Exception e) {
            log.error("Failed to write security audit log for blog deletion", e);
        }
    }

    @Transactional
    public AdminBlogReviewResponse approveBlog(Integer id, ModerationDecisionRequest request, User admin) {
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new CustomException("Blog không tồn tại", HttpStatus.NOT_FOUND));

        BlogRevision revision = blog.getCurrentRevision();
        if (revision == null || revision.getStatus() != BlogStatus.PENDING_REVIEW) {
            throw new CustomException("Bài viết không ở trạng thái chờ duyệt", HttpStatus.BAD_REQUEST);
        }

        if (!revision.getVersion().equals(request.getVersion())) {
            throw new CustomException("Dữ liệu bài viết đã được thay đổi bởi một phiên khác. Vui lòng tải lại và thử lại.", HttpStatus.CONFLICT);
        }

        String cleanHtml = documentImportService.sanitizeHtml(revision.getContentHtml());
        revision.setContentHtml(cleanHtml);

        revision.setStatus(BlogStatus.PUBLISHED);
        revision.setReviewer(admin);
        revision.setReviewedAt(LocalDateTime.now());
        revision.setReviewerNote(request.getNote());
        blogRevisionRepository.saveAndFlush(revision);

        blog.setTitle(revision.getTitle());
        blog.setCategory(revision.getCategory());
        blog.setSummary(revision.getSummary());
        blog.setContent(revision.getContentHtml());
        blog.setImageUrl(revision.getImageUrl());
        blog.setReadingTime(calculateReadingTime(revision.getContentHtml()));
        blog.setStatus(BlogStatus.PUBLISHED);
        if (blog.getPublishedAt() == null) {
            blog.setPublishedAt(LocalDateTime.now());
        }
        blog.setUpdatedAt(LocalDateTime.now());
        blog.setPublishedRevision(revision);
        blogRepository.saveAndFlush(blog);

        BlogModerationHistory history = BlogModerationHistory.builder()
                .blog(blog)
                .revision(revision)
                .actor(admin)
                .action("APPROVED")
                .note(request.getNote())
                .createdAt(LocalDateTime.now())
                .build();
        blogModerationHistoryRepository.save(history);

        try {
            String desc = String.format("Admin %s approved blog ID %d (revision %d)", admin.getEmail(), blog.getId(), revision.getRevisionNumber());
            securityAuditService.recordSecurityAudit(admin, SecurityAuditAction.ADMIN_ACTION, desc);
        } catch (Exception e) {
            log.error("Failed to write security audit log for blog approval", e);
        }

        return mapToAdminBlogReviewResponse(blog);
    }

    @Transactional
    public AdminBlogReviewResponse requestChanges(Integer id, ModerationDecisionRequest request, User admin) {
        if (isEmpty(request.getNote())) {
            throw new CustomException("Phải cung cấp lý do yêu cầu chỉnh sửa", HttpStatus.BAD_REQUEST);
        }

        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new CustomException("Blog không tồn tại", HttpStatus.NOT_FOUND));

        BlogRevision revision = blog.getCurrentRevision();
        if (revision == null || revision.getStatus() != BlogStatus.PENDING_REVIEW) {
            throw new CustomException("Bài viết không ở trạng thái chờ duyệt", HttpStatus.BAD_REQUEST);
        }

        if (!revision.getVersion().equals(request.getVersion())) {
            throw new CustomException("Dữ liệu bài viết đã được thay đổi bởi một phiên khác. Vui lòng tải lại và thử lại.", HttpStatus.CONFLICT);
        }

        revision.setStatus(BlogStatus.CHANGES_REQUESTED);
        revision.setReviewer(admin);
        revision.setReviewedAt(LocalDateTime.now());
        revision.setReviewerNote(request.getNote());
        blogRevisionRepository.saveAndFlush(revision);

        if (blog.getStatus() != BlogStatus.PUBLISHED) {
            blog.setStatus(BlogStatus.DRAFT);
            blogRepository.saveAndFlush(blog);
        }

        BlogModerationHistory history = BlogModerationHistory.builder()
                .blog(blog)
                .revision(revision)
                .actor(admin)
                .action("CHANGES_REQUESTED")
                .note(request.getNote())
                .createdAt(LocalDateTime.now())
                .build();
        blogModerationHistoryRepository.save(history);

        try {
            String desc = String.format("Admin %s requested changes for blog ID %d (revision %d): %s", admin.getEmail(), blog.getId(), revision.getRevisionNumber(), request.getNote());
            securityAuditService.recordSecurityAudit(admin, SecurityAuditAction.ADMIN_ACTION, desc);
        } catch (Exception e) {
            log.error("Failed to write security audit log for blog changes request", e);
        }

        return mapToAdminBlogReviewResponse(blog);
    }

    @Transactional
    public AdminBlogReviewResponse rejectBlog(Integer id, ModerationDecisionRequest request, User admin) {
        if (isEmpty(request.getNote())) {
            throw new CustomException("Phải cung cấp lý do từ chối", HttpStatus.BAD_REQUEST);
        }

        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new CustomException("Blog không tồn tại", HttpStatus.NOT_FOUND));

        BlogRevision revision = blog.getCurrentRevision();
        if (revision == null || revision.getStatus() != BlogStatus.PENDING_REVIEW) {
            throw new CustomException("Bài viết không ở trạng thái chờ duyệt", HttpStatus.BAD_REQUEST);
        }

        if (!revision.getVersion().equals(request.getVersion())) {
            throw new CustomException("Dữ liệu bài viết đã được thay đổi bởi một phiên khác. Vui lòng tải lại và thử lại.", HttpStatus.CONFLICT);
        }

        revision.setStatus(BlogStatus.REJECTED);
        revision.setReviewer(admin);
        revision.setReviewedAt(LocalDateTime.now());
        revision.setReviewerNote(request.getNote());
        blogRevisionRepository.saveAndFlush(revision);

        if (blog.getStatus() != BlogStatus.PUBLISHED) {
            blog.setStatus(BlogStatus.DRAFT);
            blogRepository.saveAndFlush(blog);
        }

        BlogModerationHistory history = BlogModerationHistory.builder()
                .blog(blog)
                .revision(revision)
                .actor(admin)
                .action("REJECTED")
                .note(request.getNote())
                .createdAt(LocalDateTime.now())
                .build();
        blogModerationHistoryRepository.save(history);

        try {
            String desc = String.format("Admin %s rejected blog ID %d (revision %d): %s", admin.getEmail(), blog.getId(), revision.getRevisionNumber(), request.getNote());
            securityAuditService.recordSecurityAudit(admin, SecurityAuditAction.ADMIN_ACTION, desc);
        } catch (Exception e) {
            log.error("Failed to write security audit log for blog rejection", e);
        }

        return mapToAdminBlogReviewResponse(blog);
    }

    @Transactional
    public BlogResponse archiveBlog(Integer id, User currentUser) {
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new CustomException("Blog không tồn tại", HttpStatus.NOT_FOUND));

        validateOwnershipOrAdmin(blog, currentUser, "Không có quyền lưu trữ bài viết này");

        blog.setStatus(BlogStatus.ARCHIVED);
        blog.setUpdatedAt(LocalDateTime.now());
        Blog saved = blogRepository.saveAndFlush(blog);

        BlogRevision current = blog.getCurrentRevision();
        if (current != null) {
            current.setStatus(BlogStatus.ARCHIVED);
            blogRevisionRepository.saveAndFlush(current);
        }

        BlogModerationHistory history = BlogModerationHistory.builder()
                .blog(blog)
                .revision(current)
                .actor(currentUser)
                .action("ARCHIVED")
                .createdAt(LocalDateTime.now())
                .build();
        blogModerationHistoryRepository.save(history);

        try {
            String desc = String.format("%s archived blog ID %d", currentUser.getEmail(), saved.getId());
            securityAuditService.recordSecurityAudit(currentUser, SecurityAuditAction.ADMIN_ACTION, desc);
        } catch (Exception e) {
            log.error("Failed to write security audit log for blog archive", e);
        }

        return mapToResponse(saved);
    }

    @Transactional
    public BlogResponse revertToDraft(Integer id, User currentUser) {
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new CustomException("Blog không tồn tại", HttpStatus.NOT_FOUND));

        validateOwnershipOrAdmin(blog, currentUser, "Không có quyền chuyển bài viết này thành bản nháp");

        blog.setStatus(BlogStatus.DRAFT);
        blog.setUpdatedAt(LocalDateTime.now());
        Blog saved = blogRepository.saveAndFlush(blog);

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<BlogResponse> getPublicBlogs(String keyword, BlogCategory category, Pageable pageable) {
        int pageSize = Math.min(pageable.getPageSize(), 50);
        Pageable restrictedPageable = PageRequest.of(pageable.getPageNumber(), pageSize, pageable.getSort());

        Specification<Blog> spec = Specification.allOf(
                BlogSpecifications.fetchAuthor(),
                BlogSpecifications.hasStatus(BlogStatus.PUBLISHED),
                BlogSpecifications.hasCategory(category),
                BlogSpecifications.hasKeyword(keyword)
        );

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
    public AuthorBlogResponse getAuthorBlogById(Integer id, User currentUser) {
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new CustomException("Blog không tồn tại", HttpStatus.NOT_FOUND));
        validateOwnership(blog, currentUser, "Không có quyền xem chi tiết bài viết này");
        return mapToAuthorBlogResponse(blog);
    }

    @Transactional(readOnly = true)
    public AdminBlogReviewResponse getAdminBlogById(Integer id) {
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new CustomException("Blog không tồn tại", HttpStatus.NOT_FOUND));
        return mapToAdminBlogReviewResponse(blog);
    }

    @Transactional(readOnly = true)
    public BlogResponse getBlogBySlug(String slug, User currentUser) {
        Blog blog = blogRepository.findBySlug(slug)
                .orElseThrow(() -> new CustomException("Blog không tồn tại", HttpStatus.NOT_FOUND));

        validateVisibility(blog, currentUser);
        return mapToResponse(blog);
    }

    @Transactional(readOnly = true)
    public Page<AuthorBlogResponse> getMyBlogs(String keyword, BlogCategory category, BlogStatus status, User currentUser, Pageable pageable) {
        int pageSize = Math.min(pageable.getPageSize(), 50);
        Pageable restrictedPageable = PageRequest.of(pageable.getPageNumber(), pageSize, pageable.getSort());

        Specification<Blog> spec = Specification.allOf(
                BlogSpecifications.fetchAuthor(),
                BlogSpecifications.hasAuthor(currentUser.getId()),
                BlogSpecifications.hasCategory(category),
                BlogSpecifications.hasStatus(status),
                BlogSpecifications.hasKeyword(keyword)
        );

        return blogRepository.findAll(spec, restrictedPageable).map(this::mapToAuthorBlogResponse);
    }

    @Transactional(readOnly = true)
    public Page<AdminBlogReviewResponse> getAllBlogsAdmin(String keyword, BlogCategory category, BlogStatus status, Pageable pageable) {
        int pageSize = Math.min(pageable.getPageSize(), 50);
        Pageable restrictedPageable = PageRequest.of(pageable.getPageNumber(), pageSize, pageable.getSort());

        Specification<Blog> spec = Specification.allOf(
                BlogSpecifications.fetchAuthor(),
                BlogSpecifications.hasCategory(category),
                BlogSpecifications.hasStatus(status),
                BlogSpecifications.hasKeyword(keyword)
        );

        return blogRepository.findAll(spec, restrictedPageable).map(this::mapToAdminBlogReviewResponse);
    }

    public List<BlogCategory> getCategories() {
        return Arrays.asList(BlogCategory.values());
    }

    private void validateOwnershipOrAdmin(Blog blog, User currentUser, String forbiddenMessage) {
        boolean isAdmin = currentUser.getRole() != null && "ADMIN".equals(currentUser.getRole().getName());
        boolean isAuthor = blog.getAuthor().getId().equals(currentUser.getId());
        if (!isAdmin && !isAuthor) {
            throw new CustomException(forbiddenMessage, HttpStatus.FORBIDDEN);
        }
    }

    private void validateOwnership(Blog blog, User currentUser, String forbiddenMessage) {
        if (!blog.getAuthor().getId().equals(currentUser.getId())) {
            throw new CustomException(forbiddenMessage, HttpStatus.FORBIDDEN);
        }
    }

    private void validateVisibility(Blog blog, User currentUser) {
        if (blog.getStatus() == BlogStatus.PUBLISHED) {
            return;
        }
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
                .currentRevisionStatus(blog.getCurrentRevision() != null ? blog.getCurrentRevision().getStatus() : null)
                .publishedAt(blog.getPublishedAt())
                .createdAt(blog.getCreatedAt())
                .updatedAt(blog.getUpdatedAt())
                .author(authorDto)
                .version(blog.getCurrentRevision() != null ? blog.getCurrentRevision().getVersion() : blog.getVersion())
                .build();
    }

    public AuthorBlogResponse mapToAuthorBlogResponse(Blog blog) {
        if (blog == null) return null;
        
        AuthorBlogResponse.AuthorDto authorDto = null;
        if (blog.getAuthor() != null) {
            authorDto = AuthorBlogResponse.AuthorDto.builder()
                    .id(blog.getAuthor().getId())
                    .fullName(blog.getAuthor().getFullName())
                    .email(blog.getAuthor().getEmail())
                    .build();
        }

        BlogRevision rev = blog.getCurrentRevision();
        String title = blog.getTitle();
        BlogCategory category = blog.getCategory();
        String summary = blog.getSummary();
        String content = blog.getContent();
        String imageUrl = blog.getImageUrl();
        Integer readingTime = blog.getReadingTime();
        BlogStatus currentRevisionStatus = null;
        String reviewerNote = null;
        LocalDateTime submittedAt = null;
        LocalDateTime reviewedAt = null;
        Integer revisionVersion = blog.getVersion();

        if (rev != null) {
            title = rev.getTitle();
            category = rev.getCategory();
            summary = rev.getSummary();
            content = rev.getContentHtml();
            imageUrl = rev.getImageUrl();
            readingTime = calculateReadingTime(rev.getContentHtml());
            currentRevisionStatus = rev.getStatus();
            reviewerNote = rev.getReviewerNote();
            submittedAt = rev.getSubmittedAt();
            reviewedAt = rev.getReviewedAt();
            revisionVersion = rev.getVersion();
        }

        List<AuthorBlogResponse.RevisionDto> revisionDtos = new ArrayList<>();
        List<BlogRevision> revisions = blogRevisionRepository.findByBlogIdOrderByRevisionNumberDesc(blog.getId());
        for (BlogRevision r : revisions) {
            revisionDtos.add(AuthorBlogResponse.RevisionDto.builder()
                    .id(r.getId())
                    .revisionNumber(r.getRevisionNumber())
                    .title(r.getTitle())
                    .status(r.getStatus())
                    .createdAt(r.getCreatedAt())
                    .build());
        }

        List<AuthorBlogResponse.ModerationHistoryDto> historyDtos = new ArrayList<>();
        List<BlogModerationHistory> history = blogModerationHistoryRepository.findByBlogIdOrderByCreatedAtDesc(blog.getId());
        for (BlogModerationHistory h : history) {
            historyDtos.add(AuthorBlogResponse.ModerationHistoryDto.builder()
                    .id(h.getId())
                    .actorName(h.getActor().getFullName())
                    .action(h.getAction())
                    .note(h.getNote())
                    .createdAt(h.getCreatedAt())
                    .build());
        }

        return AuthorBlogResponse.builder()
                .id(blog.getId())
                .title(title)
                .slug(blog.getSlug())
                .category(category)
                .summary(summary)
                .content(content)
                .imageUrl(imageUrl)
                .readingTime(readingTime)
                .status(blog.getStatus())
                .currentRevisionStatus(currentRevisionStatus)
                .reviewerNote(reviewerNote)
                .hasPublishedVersion(blog.getPublishedRevision() != null)
                .submittedAt(submittedAt)
                .reviewedAt(reviewedAt)
                .createdAt(blog.getCreatedAt())
                .updatedAt(blog.getUpdatedAt())
                .version(revisionVersion)
                .author(authorDto)
                .revisions(revisionDtos)
                .history(historyDtos)
                .build();
    }

    public AdminBlogReviewResponse mapToAdminBlogReviewResponse(Blog blog) {
        if (blog == null) return null;

        AdminBlogReviewResponse.AuthorDto authorDto = null;
        String authorRole = "CUSTOMER";
        boolean hasStoreBadge = false;

        if (blog.getAuthor() != null) {
            authorDto = AdminBlogReviewResponse.AuthorDto.builder()
                    .id(blog.getAuthor().getId())
                    .fullName(blog.getAuthor().getFullName())
                    .email(blog.getAuthor().getEmail())
                    .build();
            if (blog.getAuthor().getRole() != null) {
                authorRole = blog.getAuthor().getRole().getName();
                if ("STORE_OWNER".equals(authorRole)) {
                    hasStoreBadge = true;
                }
            }
        }

        BlogRevision rev = blog.getCurrentRevision();
        String title = blog.getTitle();
        BlogCategory category = blog.getCategory();
        String summary = blog.getSummary();
        String content = blog.getContent();
        String imageUrl = blog.getImageUrl();
        Integer readingTime = blog.getReadingTime();
        BlogStatus currentRevisionStatus = null;
        LocalDateTime submittedAt = null;
        Integer revisionVersion = blog.getVersion();
        String reviewerNote = null;

        if (rev != null) {
            title = rev.getTitle();
            category = rev.getCategory();
            summary = rev.getSummary();
            content = rev.getContentHtml();
            imageUrl = rev.getImageUrl();
            readingTime = calculateReadingTime(rev.getContentHtml());
            currentRevisionStatus = rev.getStatus();
            submittedAt = rev.getSubmittedAt();
            revisionVersion = rev.getVersion();
            reviewerNote = rev.getReviewerNote();
        }

        AdminBlogReviewResponse.PreviewDto previousPublished = null;
        BlogRevision pubRev = blog.getPublishedRevision();
        if (pubRev != null) {
            previousPublished = AdminBlogReviewResponse.PreviewDto.builder()
                    .title(pubRev.getTitle())
                    .summary(pubRev.getSummary())
                    .content(pubRev.getContentHtml())
                    .imageUrl(pubRev.getImageUrl())
                    .category(pubRev.getCategory())
                    .build();
        }

        List<AdminBlogReviewResponse.ModerationHistoryDto> historyDtos = new ArrayList<>();
        List<BlogModerationHistory> history = blogModerationHistoryRepository.findByBlogIdOrderByCreatedAtDesc(blog.getId());
        for (BlogModerationHistory h : history) {
            historyDtos.add(AdminBlogReviewResponse.ModerationHistoryDto.builder()
                    .id(h.getId())
                    .actorName(h.getActor().getFullName())
                    .action(h.getAction())
                    .note(h.getNote())
                    .createdAt(h.getCreatedAt())
                    .build());
        }

        return AdminBlogReviewResponse.builder()
                .id(blog.getId())
                .author(authorDto)
                .authorRole(authorRole)
                .hasStoreBadge(hasStoreBadge)
                .title(title)
                .slug(blog.getSlug())
                .category(category)
                .summary(summary)
                .content(content)
                .imageUrl(imageUrl)
                .readingTime(readingTime)
                .status(blog.getStatus())
                .currentRevisionStatus(currentRevisionStatus)
                .reviewerNote(reviewerNote)
                .version(revisionVersion)
                .submittedAt(submittedAt)
                .createdAt(blog.getCreatedAt())
                .previousPublished(previousPublished)
                .history(historyDtos)
                .build();
    }
}
