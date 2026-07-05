package com.greenlife.wishlist.repository;

import com.greenlife.wishlist.entity.WishlistItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface WishlistRepository extends JpaRepository<WishlistItem, Integer> {
    Page<WishlistItem> findByCustomerIdOrderByAddedAtDesc(Integer customerId, Pageable pageable);
    Optional<WishlistItem> findByCustomerIdAndPlantId(Integer customerId, Integer plantId);
    boolean existsByCustomerIdAndPlantId(Integer customerId, Integer plantId);
    List<WishlistItem> findByPlantId(Integer plantId);
}
