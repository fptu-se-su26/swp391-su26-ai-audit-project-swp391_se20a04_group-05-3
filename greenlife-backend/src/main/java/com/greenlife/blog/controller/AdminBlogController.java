package com.greenlife.blog.controller;

import com.greenlife.blog.dto.*;
import com.greenlife.blog.entity.enums.BlogCategory;
import com.greenlife.blog.entity.enums.BlogStatus;
import com.greenlife.security.CurrentUserResolver;
import com.greenlife.user.entity.User;
import com.greenlife.blog.service.BlogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/blogs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminBlogController {

    private final BlogService blogService;
    private final CurrentUserResolver currentUserResolver;

    @GetMapping
    public ResponseEntity<Page<AdminBlogReviewResponse>> getAllBlogsAdmin(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "category", required = false) BlogCategory category,
            @RequestParam(value = "status", required = false) BlogStatus status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<AdminBlogReviewResponse> blogs = blogService.getAllBlogsAdmin(keyword, category, status, pageable);
        return ResponseEntity.ok(blogs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminBlogReviewResponse> getAdminBlogById(
            @PathVariable("id") Integer id
    ) {
        AdminBlogReviewResponse blog = blogService.getAdminBlogById(id);
        return ResponseEntity.ok(blog);
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<AdminBlogReviewResponse> approveBlog(
            @PathVariable("id") Integer id,
            @Valid @RequestBody ModerationDecisionRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User admin = currentUserResolver.resolveUser(userDetails);
        AdminBlogReviewResponse response = blogService.approveBlog(id, request, admin);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/request-changes")
    public ResponseEntity<AdminBlogReviewResponse> requestChanges(
            @PathVariable("id") Integer id,
            @Valid @RequestBody ModerationDecisionRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User admin = currentUserResolver.resolveUser(userDetails);
        AdminBlogReviewResponse response = blogService.requestChanges(id, request, admin);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<AdminBlogReviewResponse> rejectBlog(
            @PathVariable("id") Integer id,
            @Valid @RequestBody ModerationDecisionRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User admin = currentUserResolver.resolveUser(userDetails);
        AdminBlogReviewResponse response = blogService.rejectBlog(id, request, admin);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/archive")
    public ResponseEntity<BlogResponse> archiveBlog(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User admin = currentUserResolver.resolveUser(userDetails);
        BlogResponse response = blogService.archiveBlog(id, admin);
        return ResponseEntity.ok(response);
    }
}
