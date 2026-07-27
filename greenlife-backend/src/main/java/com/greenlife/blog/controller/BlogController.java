package com.greenlife.blog.controller;

import com.greenlife.blog.dto.*;
import com.greenlife.user.entity.User;
import com.greenlife.blog.entity.enums.BlogCategory;
import com.greenlife.blog.entity.enums.BlogStatus;
import com.greenlife.security.CurrentUserResolver;
import com.greenlife.blog.service.BlogService;
import com.greenlife.blog.service.DocumentImportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/blogs")
@RequiredArgsConstructor
public class BlogController {

    private final BlogService blogService;
    private final DocumentImportService documentImportService;
    private final CurrentUserResolver currentUserResolver;

    @GetMapping
    public ResponseEntity<Page<BlogResponse>> getPublicBlogs(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "category", required = false) BlogCategory category,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<BlogResponse> blogs = blogService.getPublicBlogs(keyword, category, pageable);
        return ResponseEntity.ok(blogs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BlogResponse> getBlogById(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUserOptional(userDetails);
        BlogResponse blog = blogService.getBlogById(id, user);
        return ResponseEntity.ok(blog);
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<BlogResponse> getBlogBySlug(
            @PathVariable("slug") String slug,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUserOptional(userDetails);
        BlogResponse blog = blogService.getBlogBySlug(slug, user);
        return ResponseEntity.ok(blog);
    }

    @GetMapping("/categories")
    public ResponseEntity<List<BlogCategory>> getCategories() {
        return ResponseEntity.ok(blogService.getCategories());
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STORE_OWNER', 'ADMIN')")
    public ResponseEntity<Page<AuthorBlogResponse>> getMyBlogs(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "category", required = false) BlogCategory category,
            @RequestParam(value = "status", required = false) BlogStatus status,
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        Page<AuthorBlogResponse> blogs = blogService.getMyBlogs(keyword, category, status, user, pageable);
        return ResponseEntity.ok(blogs);
    }

    @GetMapping("/my/{id}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STORE_OWNER', 'ADMIN')")
    public ResponseEntity<AuthorBlogResponse> getAuthorBlogById(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        AuthorBlogResponse blog = blogService.getAuthorBlogById(id, user);
        return ResponseEntity.ok(blog);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STORE_OWNER', 'ADMIN')")
    public ResponseEntity<AuthorBlogResponse> createBlog(
            @Valid @RequestBody CreateBlogRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        AuthorBlogResponse blog = blogService.createBlog(request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(blog);
    }

    @PostMapping("/{id}/revisions")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STORE_OWNER', 'ADMIN')")
    public ResponseEntity<AuthorBlogResponse> createDraftRevision(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        AuthorBlogResponse blog = blogService.createDraftRevision(id, user);
        return ResponseEntity.ok(blog);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STORE_OWNER', 'ADMIN')")
    public ResponseEntity<AuthorBlogResponse> updateBlog(
            @PathVariable("id") Integer id,
            @Valid @RequestBody UpdateBlogDraftRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        AuthorBlogResponse blog = blogService.updateBlog(id, request, user);
        return ResponseEntity.ok(blog);
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STORE_OWNER', 'ADMIN')")
    public ResponseEntity<AuthorBlogResponse> submitBlog(
            @PathVariable("id") Integer id,
            @Valid @RequestBody SubmitBlogRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        AuthorBlogResponse blog = blogService.submitBlog(id, request, user);
        return ResponseEntity.ok(blog);
    }

    @PostMapping("/{id}/withdraw")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STORE_OWNER', 'ADMIN')")
    public ResponseEntity<AuthorBlogResponse> withdrawBlog(
            @PathVariable("id") Integer id,
            @Valid @RequestBody SubmitBlogRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        AuthorBlogResponse blog = blogService.withdrawBlog(id, request, user);
        return ResponseEntity.ok(blog);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STORE_OWNER', 'ADMIN')")
    public ResponseEntity<Void> deleteBlog(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = currentUserResolver.resolveUser(userDetails);
        blogService.deleteBlog(id, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/import-document")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STORE_OWNER', 'ADMIN')")
    public ResponseEntity<ImportDocumentResponse> importDocument(
            @RequestParam("file") MultipartFile file
    ) {
        ImportDocumentResponse response = documentImportService.importDocument(file);
        return ResponseEntity.ok(response);
    }
}
