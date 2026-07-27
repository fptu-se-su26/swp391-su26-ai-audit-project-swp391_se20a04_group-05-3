package com.greenlife.order.repository;

import com.greenlife.order.entity.Order;
import com.greenlife.order.entity.enums.OrderStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {

    @EntityGraph(attributePaths = {"store", "orderDetails", "orderDetails.plant"})
    List<Order> findByCustomerIdOrderByCreatedAtDesc(Integer customerId);

    Optional<Order> findByIdAndCustomerId(Integer id, Integer customerId);

    @EntityGraph(attributePaths = {"store", "orderDetails", "orderDetails.plant"})
    List<Order> findByStoreIdInOrderByCreatedAtDesc(List<Integer> storeIds);

    boolean existsByCustomerIdAndStatusAndOrderDetailsPlantId(Integer customerId, OrderStatus status, Integer plantId);

    boolean existsByCustomerIdAndStatusAndStoreId(Integer customerId, OrderStatus status, Integer storeId);

    Optional<Order> findByPayosOrderCode(Long payosOrderCode);

    /**
     * Effective only inside an active transaction.
     * Used to serialize payment-attempt creation for one order.
     */
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select o from Order o where o.id = :orderId")
    Optional<Order> findAndLockById(@org.springframework.data.repository.query.Param("orderId") Integer orderId);

    /**
     * Effective only inside an active transaction.
     * Used in the webhook transitional-legacy path to lock an order by its PayOS-assigned order code.
     */
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select o from Order o where o.payosOrderCode = :providerOrderCode")
    Optional<Order> findAndLockByPayosOrderCode(@org.springframework.data.repository.query.Param("providerOrderCode") Long providerOrderCode);
}

