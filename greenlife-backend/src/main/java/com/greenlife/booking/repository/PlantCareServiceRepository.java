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

    Page<PlantCareService> findByStoreId(Integer storeId, Pageable pageable);
}
