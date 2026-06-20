package com.greenlife.repository;

import com.greenlife.entity.Review;
import com.greenlife.entity.enums.ReviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Integer> {

    Page<Review> findByPlantIdAndStatus(Integer plantId, ReviewStatus status, Pageable pageable);

    Page<Review> findByStoreIdAndStatus(Integer storeId, ReviewStatus status, Pageable pageable);

    @Query("SELECT r FROM Review r WHERE r.store.id IN :storeIds OR r.plant.store.id IN :storeIds")
    Page<Review> findByStoreIdInOrPlantStoreIdIn(@Param("storeIds") List<Integer> storeIds, Pageable pageable);

    boolean existsByCustomerIdAndPlantId(Integer customerId, Integer plantId);

    boolean existsByCustomerIdAndStoreId(Integer customerId, Integer storeId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.plant.id = :plantId AND r.status = :status")
    Optional<Double> findAverageRatingByPlantIdAndStatus(@Param("plantId") Integer plantId, @Param("status") ReviewStatus status);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.store.id = :storeId AND r.status = :status")
    Optional<Double> findAverageRatingByStoreIdAndStatus(@Param("storeId") Integer storeId, @Param("status") ReviewStatus status);

    long countByPlantIdAndStatus(Integer plantId, ReviewStatus status);

    long countByStoreIdAndStatus(Integer storeId, ReviewStatus status);
}
