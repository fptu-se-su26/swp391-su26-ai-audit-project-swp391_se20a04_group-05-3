package com.greenlife.controller;

import com.greenlife.dto.BlogRequest;
import com.greenlife.dto.BlogResponse;
import com.greenlife.entity.User;
import com.greenlife.entity.enums.BlogCategory;
import com.greenlife.entity.enums.BlogStatus;
import com.greenlife.exception.CustomException;
import com.greenlife.repository.UserRepository;
import com.greenlife.service.BlogService;
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

import java.util.List;

@RestController
@RequestMapping("/api/blogs")
@RequiredArgsConstructor
public class BlogController {

    private final BlogService blogService;
    private final UserRepository userRepository;

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
        User user = resolveUserOptional(userDetails);
        BlogResponse blog = blogService.getBlogById(id, user);
        return ResponseEntity.ok(blog);
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<BlogResponse> getBlogBySlug(
            @PathVariable("slug") String slug,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = resolveUserOptional(userDetails);
        BlogResponse blog = blogService.getBlogBySlug(slug, user);
        return ResponseEntity.ok(blog);
    }

    @GetMapping("/categories")
    public ResponseEntity<List<BlogCategory>> getCategories() {
        return ResponseEntity.ok(blogService.getCategories());
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('STORE_OWNER', 'ADMIN')")
    public ResponseEntity<Page<BlogResponse>> getMyBlogs(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "category", required = false) BlogCategory category,
            @RequestParam(value = "status", required = false) BlogStatus status,
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        User user = resolveUserRequired(userDetails);
        Page<BlogResponse> blogs = blogService.getMyBlogs(keyword, category, status, user, pageable);
        return ResponseEntity.ok(blogs);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('STORE_OWNER', 'ADMIN')")
    public ResponseEntity<BlogResponse> createBlog(
            @Valid @RequestBody BlogRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = resolveUserRequired(userDetails);
        BlogResponse blog = blogService.createBlog(request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(blog);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('STORE_OWNER', 'ADMIN')")
    public ResponseEntity<BlogResponse> updateBlog(
            @PathVariable("id") Integer id,
            @Valid @RequestBody BlogRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = resolveUserRequired(userDetails);
        BlogResponse blog = blogService.updateBlog(id, request, user);
        return ResponseEntity.ok(blog);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('STORE_OWNER', 'ADMIN')")
    public ResponseEntity<Void> deleteBlog(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = resolveUserRequired(userDetails);
        blogService.deleteBlog(id, user);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('STORE_OWNER', 'ADMIN')")
    public ResponseEntity<BlogResponse> publishBlog(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = resolveUserRequired(userDetails);
        BlogResponse blog = blogService.publishBlog(id, user);
        return ResponseEntity.ok(blog);
    }

    @PatchMapping("/{id}/archive")
    @PreAuthorize("hasAnyRole('STORE_OWNER', 'ADMIN')")
    public ResponseEntity<BlogResponse> archiveBlog(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = resolveUserRequired(userDetails);
        BlogResponse blog = blogService.archiveBlog(id, user);
        return ResponseEntity.ok(blog);
    }

    // Resolvers
    private User resolveUserOptional(UserDetails userDetails) {
        if (userDetails == null) {
            return null;
        }
        return userRepository.findByEmail(userDetails.getUsername()).orElse(null);
    }

    private User resolveUserRequired(UserDetails userDetails) {
        if (userDetails == null) {
            throw new CustomException("Chưa đăng nhập", HttpStatus.UNAUTHORIZED);
        }
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new CustomException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));
    }
}
