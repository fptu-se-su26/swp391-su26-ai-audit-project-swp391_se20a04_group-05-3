package com.greenlife.order.repository;

import com.greenlife.order.entity.Order;
import com.greenlife.order.entity.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {

    List<Order> findByCustomerIdOrderByCreatedAtDesc(Integer customerId);

    Optional<Order> findByIdAndCustomerId(Integer id, Integer customerId);

    List<Order> findByStoreIdInOrderByCreatedAtDesc(List<Integer> storeIds);

    boolean existsByCustomerIdAndStatusAndOrderDetailsPlantId(Integer customerId, OrderStatus status, Integer plantId);

    boolean existsByCustomerIdAndStatusAndStoreId(Integer customerId, OrderStatus status, Integer storeId);
}
