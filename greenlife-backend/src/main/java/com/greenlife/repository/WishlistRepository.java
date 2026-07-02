package com.greenlife.repository;

import com.greenlife.entity.WishlistItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface WishlistRepository extends JpaRepository<WishlistItem, Integer> {

    Page<WishlistItem> findByCustomerIdOrderByAddedAtDesc(Integer customerId, Pageable pageable);

    boolean existsByCustomerIdAndPlantId(Integer customerId, Integer plantId);

    Optional<WishlistItem> findByCustomerIdAndPlantId(Integer customerId, Integer plantId);

    java.util.List<WishlistItem> findByPlantId(Integer plantId);
}
