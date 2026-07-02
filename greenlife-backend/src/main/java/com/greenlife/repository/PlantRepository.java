package com.greenlife.repository;

import com.greenlife.entity.Plant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PlantRepository extends JpaRepository<Plant, Integer> {
    boolean existsByNameIgnoreCaseAndStoreId(String name, Integer storeId);
    boolean existsBySlugAndStoreId(String slug, Integer storeId);
    boolean existsByCategoryId(Integer categoryId);

    @Query("SELECT p FROM Plant p " +
           "LEFT JOIN p.category c " +
           "WHERE p.status IN (com.greenlife.entity.enums.PlantStatus.ACTIVE, com.greenlife.entity.enums.PlantStatus.OUT_OF_STOCK) " +
           "AND (:category IS NULL OR c.slug = :category) " +
           "AND (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Plant> findActiveAndOutOfStockPlants(
            @Param("search") String search,
            @Param("category") String category,
            Pageable pageable);
}
