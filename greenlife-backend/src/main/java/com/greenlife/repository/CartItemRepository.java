package com.greenlife.repository;

import com.greenlife.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Integer> {

    List<CartItem> findByCustomerId(Integer customerId);

    Optional<CartItem> findByCustomerIdAndPlantId(Integer customerId, Integer plantId);

    Optional<CartItem> findByIdAndCustomerId(Integer id, Integer customerId);
}
