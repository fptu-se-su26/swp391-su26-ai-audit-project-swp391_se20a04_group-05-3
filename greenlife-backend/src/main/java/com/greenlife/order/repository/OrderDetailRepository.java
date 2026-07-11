package com.greenlife.order.repository;

import com.greenlife.order.entity.OrderDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import java.util.List;

@Repository
public interface OrderDetailRepository extends JpaRepository<OrderDetail, Integer> {
    
    @Query("SELECT od.plant.id, SUM(od.quantity) FROM OrderDetail od " +
           "WHERE od.order.status <> com.greenlife.order.entity.enums.OrderStatus.CANCELLED " +
           "GROUP BY od.plant.id " +
           "ORDER BY SUM(od.quantity) DESC")
    List<Object[]> findTopSellingPlants();
}
