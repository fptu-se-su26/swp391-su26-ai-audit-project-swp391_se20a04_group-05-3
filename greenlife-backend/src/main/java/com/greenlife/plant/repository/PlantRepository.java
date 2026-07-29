package com.greenlife.plant.repository;

import com.greenlife.plant.entity.Plant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PlantRepository extends JpaRepository<Plant, Integer> {
    boolean existsByNameIgnoreCaseAndStoreId(String name, Integer storeId);
    boolean existsBySlugAndStoreId(String slug, Integer storeId);
    Optional<Plant> findByNameIgnoreCaseAndStoreId(String name, Integer storeId);
    Optional<Plant> findBySlugAndStoreId(String slug, Integer storeId);
    boolean existsByCategoryId(Integer categoryId);
    java.util.List<Plant> findByStoreId(Integer storeId);

    @Query("SELECT p FROM Plant p " +
           "LEFT JOIN p.category c " +
           "WHERE p.status IN (com.greenlife.plant.entity.enums.PlantStatus.ACTIVE, com.greenlife.plant.entity.enums.PlantStatus.OUT_OF_STOCK) " +
           "AND (:category IS NULL OR c.slug = :category) " +
           "AND (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Plant> findActiveAndOutOfStockPlants(
            @Param("search") String search,
            @Param("category") String category,
            Pageable pageable);

    @Query("SELECT p FROM Plant p " +
           "LEFT JOIN p.category c " +
           "JOIN p.store s " +
           "WHERE p.status IN (com.greenlife.plant.entity.enums.PlantStatus.ACTIVE, com.greenlife.plant.entity.enums.PlantStatus.OUT_OF_STOCK) " +
           "AND s.status = com.greenlife.store.entity.enums.StoreStatus.APPROVED " +
           "AND (:category IS NULL OR c.slug = :category) " +
           "AND (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Plant> findActiveAndOutOfStockPlantsByName(
            @Param("search") String search,
            @Param("category") String category,
            Pageable pageable);

    @Query("SELECT p FROM Plant p " +
           "LEFT JOIN p.category c " +
           "JOIN p.store s " +
           "WHERE p.status IN (com.greenlife.plant.entity.enums.PlantStatus.ACTIVE, com.greenlife.plant.entity.enums.PlantStatus.OUT_OF_STOCK) " +
           "AND s.status = com.greenlife.store.entity.enums.StoreStatus.APPROVED " +
           "AND (:category IS NULL OR c.slug = :category) " +
           "AND (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND s.id = :storeId")
    Page<Plant> findActiveAndOutOfStockPlantsByStore(
            @Param("search") String search,
            @Param("category") String category,
            @Param("storeId") Integer storeId,
            Pageable pageable);
}
