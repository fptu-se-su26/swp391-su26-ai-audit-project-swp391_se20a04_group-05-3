package com.greenlife.payment.service;

import com.greenlife.exception.CustomException;
import com.greenlife.order.entity.Order;
import com.greenlife.order.entity.OrderDetail;
import com.greenlife.order.repository.CartItemRepository;
import com.greenlife.plant.entity.Plant;
import com.greenlife.plant.repository.PlantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Centralized service responsible for common paid-finalization operations of PayOS orders.
 * Validates/decrements plant stock and deletes purchased cart items.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PayOSOrderFinalizationService {

    private final PlantRepository plantRepository;
    private final CartItemRepository cartItemRepository;

    /**
     * Executes common finalization logic for a verified paid order:
     * 1. Validates available stock and decrements plant stock for each OrderDetail.
     * 2. Deletes purchased cart items for the customer.
     *
     * @param order the verified paid Order to finalize
     */
    public void finalizeVerifiedPaidOrder(Order order) {
        decrementStockForPaidOrder(order);
        deletePurchasedCartItems(order);
    }

    private void decrementStockForPaidOrder(Order order) {
        if (order == null || order.getOrderDetails() == null || order.getOrderDetails().isEmpty()) {
            return;
        }
        for (OrderDetail detail : order.getOrderDetails()) {
            Plant plant = detail.getPlant();
            if (plant != null) {
                if (plant.getStock() < detail.getQuantity()) {
                    log.error("INSUFFICIENT_STOCK: Order {} plant {} stock {} is less than required {}",
                            order.getId(), plant.getId(), plant.getStock(), detail.getQuantity());
                    throw new CustomException(
                            "Sản phẩm " + plant.getName() + " không đủ tồn kho khả dụng", HttpStatus.BAD_REQUEST);
                }
                plant.setStock(plant.getStock() - detail.getQuantity());
                plantRepository.save(plant);
            }
        }
    }

    private void deletePurchasedCartItems(Order order) {
        if (order == null || order.getCustomer() == null || order.getOrderDetails() == null || order.getOrderDetails().isEmpty()) {
            return;
        }
        List<Integer> plantIds = order.getOrderDetails().stream()
                .map(detail -> detail.getPlant() != null ? detail.getPlant().getId() : null)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        if (!plantIds.isEmpty()) {
            cartItemRepository.deleteByCustomerIdAndPlantIdIn(order.getCustomer().getId(), plantIds);
        }
    }
}
