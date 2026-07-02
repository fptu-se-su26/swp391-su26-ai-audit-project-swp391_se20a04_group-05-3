package com.greenlife.controller;

import com.greenlife.dto.BlogResponse;
import com.greenlife.entity.enums.BlogCategory;
import com.greenlife.entity.enums.BlogStatus;
import com.greenlife.service.BlogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/blogs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminBlogController {

    private final BlogService blogService;

    @GetMapping
    public ResponseEntity<Page<BlogResponse>> getAllBlogsAdmin(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "category", required = false) BlogCategory category,
            @RequestParam(value = "status", required = false) BlogStatus status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<BlogResponse> blogs = blogService.getAllBlogsAdmin(keyword, category, status, pageable);
        return ResponseEntity.ok(blogs);
    }
}
