package com.greenlife.category.service;

import com.greenlife.category.dto.CategoryRequest;
import com.greenlife.category.dto.CategoryResponse;
import com.greenlife.category.entity.Category;
import com.greenlife.exception.CustomException;
import com.greenlife.category.repository.CategoryRepository;
import com.greenlife.repository.PlantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final PlantRepository plantRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::mapToCategoryResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(Integer id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new CustomException("Danh mục không tồn tại", HttpStatus.NOT_FOUND));
        return mapToCategoryResponse(category);
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        if (categoryRepository.existsByNameIgnoreCase(request.getName().trim())) {
            throw new CustomException("Tên danh mục đã tồn tại", HttpStatus.BAD_REQUEST);
        }
        if (categoryRepository.existsBySlug(request.getSlug().trim())) {
            throw new CustomException("Slug danh mục đã tồn tại", HttpStatus.BAD_REQUEST);
        }

        Category category = Category.builder()
                .name(request.getName().trim())
                .slug(request.getSlug().trim())
                .description(request.getDescription())
                .createdAt(LocalDateTime.now())
                .build();

        Category saved = categoryRepository.save(category);
        return mapToCategoryResponse(saved);
    }

    @Transactional
    public CategoryResponse updateCategory(Integer id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new CustomException("Danh mục không tồn tại", HttpStatus.NOT_FOUND));

        String newName = request.getName().trim();
        String newSlug = request.getSlug().trim();

        if (!category.getName().equalsIgnoreCase(newName) && categoryRepository.existsByNameIgnoreCase(newName)) {
            throw new CustomException("Tên danh mục đã tồn tại", HttpStatus.BAD_REQUEST);
        }
        if (!category.getSlug().equalsIgnoreCase(newSlug) && categoryRepository.existsBySlug(newSlug)) {
            throw new CustomException("Slug danh mục đã tồn tại", HttpStatus.BAD_REQUEST);
        }

        category.setName(newName);
        category.setSlug(newSlug);
        category.setDescription(request.getDescription());
        category.setUpdatedAt(LocalDateTime.now());

        Category updated = categoryRepository.save(category);
        return mapToCategoryResponse(updated);
    }

    @Transactional
    public void deleteCategory(Integer id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new CustomException("Danh mục không tồn tại", HttpStatus.NOT_FOUND));

        if (plantRepository.existsByCategoryId(id)) {
            throw new CustomException("Category is currently in use and cannot be deleted", HttpStatus.BAD_REQUEST);
        }

        categoryRepository.delete(category);
    }

    public CategoryResponse mapToCategoryResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .description(category.getDescription())
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }
}
