package com.greenlife.booking.repository;

import com.greenlife.booking.entity.PlantCareService;
import com.greenlife.booking.entity.enums.ServiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PlantCareServiceRepository extends JpaRepository<PlantCareService, Integer> {

    @Query("SELECT s FROM PlantCareService s WHERE s.status = :status AND s.store.status = com.greenlife.store.entity.enums.StoreStatus.APPROVED AND (:storeId IS NULL OR s.store.id = :storeId)")
    Page<PlantCareService> findActiveServices(@Param("storeId") Integer storeId, @Param("status") ServiceStatus status, Pageable pageable);

    @Query("SELECT s FROM PlantCareService s WHERE s.status = :status " +
           "AND s.store.status = com.greenlife.store.entity.enums.StoreStatus.APPROVED " +
           "AND (:storeId IS NULL OR s.store.id = :storeId) " +
           "AND (:city IS NULL OR LOWER(s.store.city) = LOWER(:city)) " +
           "AND (:district IS NULL OR LOWER(s.store.district) = LOWER(:district)) " +
           "AND (:keyword IS NULL OR LOWER(s.name) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND (:minPrice IS NULL OR s.price >= :minPrice) " +
           "AND (:maxPrice IS NULL OR s.price <= :maxPrice)")
    Page<PlantCareService> findActiveServicesWithFilters(
            @Param("storeId") Integer storeId,
            @Param("status") ServiceStatus status,
            @Param("city") String city,
            @Param("district") String district,
            @Param("keyword") String keyword,
            @Param("minPrice") java.math.BigDecimal minPrice,
            @Param("maxPrice") java.math.BigDecimal maxPrice,
            Pageable pageable);

    Page<PlantCareService> findByStoreId(Integer storeId, Pageable pageable);

    Page<PlantCareService> findByStoreIdIn(java.util.Collection<Integer> storeIds, Pageable pageable);
}
