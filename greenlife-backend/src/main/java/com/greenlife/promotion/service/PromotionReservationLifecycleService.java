package com.greenlife.promotion.service;

import com.greenlife.exception.CustomException;
import com.greenlife.promotion.entity.Promotion;
import com.greenlife.promotion.entity.PromotionBudgetReservation;
import com.greenlife.promotion.entity.enums.PromotionBudgetReservationStatus;
import com.greenlife.promotion.repository.PromotionBudgetReservationRepository;
import com.greenlife.promotion.repository.PromotionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PromotionReservationLifecycleService {

    private final PromotionBudgetReservationRepository reservationRepository;
    private final PromotionRepository promotionRepository;

    @Transactional
    public void consumeForOrder(Integer orderId) {
        log.info("Consuming promotion reservations for order: {}", orderId);
        List<PromotionBudgetReservation> reservations = reservationRepository.findByOrderId(orderId);
        
        List<PromotionBudgetReservation> reservedList = reservations.stream()
                .filter(r -> r.getStatus() == PromotionBudgetReservationStatus.RESERVED)
                .collect(Collectors.toList());

        if (reservedList.isEmpty()) {
            log.info("No active RESERVED promotion reservations found for order: {}", orderId);
            return;
        }

        // Collect promotion IDs from RESERVED rows
        List<Integer> promoIds = reservedList.stream()
                .map(r -> r.getPromotion().getId())
                .distinct()
                .sorted()
                .collect(Collectors.toList());

        // Lock promotions in ascending order
        Map<Integer, Promotion> lockedPromotions = new HashMap<>();
        for (Integer promoId : promoIds) {
            Promotion promotion = promotionRepository.findAndLockById(promoId)
                    .orElseThrow(() -> new CustomException("Khuyến mãi không tồn tại: " + promoId, HttpStatus.NOT_FOUND));
            lockedPromotions.put(promoId, promotion);
        }

        // Apply counter updates
        for (PromotionBudgetReservation res : reservedList) {
            BigDecimal amount = res.getTotalDiscountAmount();
            if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
                throw new CustomException("Số tiền khuyến mãi không hợp lệ: " + amount, HttpStatus.INTERNAL_SERVER_ERROR);
            }

            Promotion promotion = lockedPromotions.get(res.getPromotion().getId());
            if (promotion == null) {
                throw new CustomException("Khuyến mãi không khớp cho lượng đặt chỗ", HttpStatus.INTERNAL_SERVER_ERROR);
            }

            BigDecimal reservedBudget = promotion.getReservedBudget() != null ? promotion.getReservedBudget() : BigDecimal.ZERO;
            BigDecimal consumedBudget = promotion.getConsumedBudget() != null ? promotion.getConsumedBudget() : BigDecimal.ZERO;

            if (reservedBudget.compareTo(amount) < 0) {
                log.error("Promotion budget corrupted: reservedBudget {} is less than reservation amount {} for promotion {}", reservedBudget, amount, promotion.getId());
                throw new CustomException("Số dư ngân sách đặt trước của khuyến mãi không đủ để tiêu dùng", HttpStatus.INTERNAL_SERVER_ERROR);
            }

            promotion.setReservedBudget(reservedBudget.subtract(amount));
            promotion.setConsumedBudget(consumedBudget.add(amount));

            if (promotion.getReservedBudget().compareTo(BigDecimal.ZERO) < 0 || promotion.getConsumedBudget().compareTo(BigDecimal.ZERO) < 0) {
                throw new CustomException("Ngân sách của khuyến mãi không được âm sau khi cập nhật", HttpStatus.INTERNAL_SERVER_ERROR);
            }

            res.setStatus(PromotionBudgetReservationStatus.CONSUMED);
            res.setConsumedAt(LocalDateTime.now());

            promotionRepository.save(promotion);
            reservationRepository.save(res);
        }
        
        reservationRepository.flush();
        promotionRepository.flush();
    }

    @Transactional
    public void releaseForOrder(Integer orderId, String reason) {
        log.info("Releasing promotion reservations for order: {}, reason: {}", orderId, reason);
        List<PromotionBudgetReservation> reservations = reservationRepository.findByOrderId(orderId);
        
        List<PromotionBudgetReservation> reservedList = reservations.stream()
                .filter(r -> r.getStatus() == PromotionBudgetReservationStatus.RESERVED)
                .collect(Collectors.toList());

        if (reservedList.isEmpty()) {
            log.info("No active RESERVED promotion reservations found to release for order: {}", orderId);
            return;
        }

        // Collect promotion IDs from RESERVED rows
        List<Integer> promoIds = reservedList.stream()
                .map(r -> r.getPromotion().getId())
                .distinct()
                .sorted()
                .collect(Collectors.toList());

        // Lock promotions in ascending order
        Map<Integer, Promotion> lockedPromotions = new HashMap<>();
        for (Integer promoId : promoIds) {
            Promotion promotion = promotionRepository.findAndLockById(promoId)
                    .orElseThrow(() -> new CustomException("Khuyến mãi không tồn tại: " + promoId, HttpStatus.NOT_FOUND));
            lockedPromotions.put(promoId, promotion);
        }

        // Apply counter updates
        for (PromotionBudgetReservation res : reservedList) {
            BigDecimal amount = res.getTotalDiscountAmount();
            if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
                throw new CustomException("Số tiền khuyến mãi không hợp lệ: " + amount, HttpStatus.INTERNAL_SERVER_ERROR);
            }

            Promotion promotion = lockedPromotions.get(res.getPromotion().getId());
            if (promotion == null) {
                throw new CustomException("Khuyến mãi không khớp cho lượng đặt chỗ", HttpStatus.INTERNAL_SERVER_ERROR);
            }

            BigDecimal reservedBudget = promotion.getReservedBudget() != null ? promotion.getReservedBudget() : BigDecimal.ZERO;
            BigDecimal releasedBudget = promotion.getReleasedBudget() != null ? promotion.getReleasedBudget() : BigDecimal.ZERO;

            if (reservedBudget.compareTo(amount) < 0) {
                log.error("Promotion budget corrupted during release: reservedBudget {} is less than reservation amount {} for promotion {}", reservedBudget, amount, promotion.getId());
                throw new CustomException("Số dư ngân sách đặt trước của khuyến mãi không đủ để giải phóng", HttpStatus.INTERNAL_SERVER_ERROR);
            }

            promotion.setReservedBudget(reservedBudget.subtract(amount));
            promotion.setReleasedBudget(releasedBudget.add(amount));

            if (promotion.getReservedBudget().compareTo(BigDecimal.ZERO) < 0 || promotion.getReleasedBudget().compareTo(BigDecimal.ZERO) < 0) {
                throw new CustomException("Ngân sách của khuyến mãi không được âm sau khi giải phóng", HttpStatus.INTERNAL_SERVER_ERROR);
            }

            res.setStatus(PromotionBudgetReservationStatus.RELEASED);
            res.setReleasedAt(LocalDateTime.now());

            promotionRepository.save(promotion);
            reservationRepository.save(res);
        }

        reservationRepository.flush();
        promotionRepository.flush();
    }

    @Transactional
    public void expireForOrder(Integer orderId, String reason) {
        log.info("Expiring promotion reservations for order: {}, reason: {}", orderId, reason);
        List<PromotionBudgetReservation> reservations = reservationRepository.findByOrderId(orderId);
        
        List<PromotionBudgetReservation> reservedList = reservations.stream()
                .filter(r -> r.getStatus() == PromotionBudgetReservationStatus.RESERVED)
                .collect(Collectors.toList());

        if (reservedList.isEmpty()) {
            log.info("No active RESERVED promotion reservations found to expire for order: {}", orderId);
            return;
        }

        // Collect promotion IDs from RESERVED rows
        List<Integer> promoIds = reservedList.stream()
                .map(r -> r.getPromotion().getId())
                .distinct()
                .sorted()
                .collect(Collectors.toList());

        // Lock promotions in ascending order
        Map<Integer, Promotion> lockedPromotions = new HashMap<>();
        for (Integer promoId : promoIds) {
            Promotion promotion = promotionRepository.findAndLockById(promoId)
                    .orElseThrow(() -> new CustomException("Khuyến mãi không tồn tại: " + promoId, HttpStatus.NOT_FOUND));
            lockedPromotions.put(promoId, promotion);
        }

        // Apply counter updates
        for (PromotionBudgetReservation res : reservedList) {
            BigDecimal amount = res.getTotalDiscountAmount();
            if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
                throw new CustomException("Số tiền khuyến mãi không hợp lệ: " + amount, HttpStatus.INTERNAL_SERVER_ERROR);
            }

            Promotion promotion = lockedPromotions.get(res.getPromotion().getId());
            if (promotion == null) {
                throw new CustomException("Khuyến mãi không khớp cho lượng đặt chỗ", HttpStatus.INTERNAL_SERVER_ERROR);
            }

            BigDecimal reservedBudget = promotion.getReservedBudget() != null ? promotion.getReservedBudget() : BigDecimal.ZERO;
            BigDecimal releasedBudget = promotion.getReleasedBudget() != null ? promotion.getReleasedBudget() : BigDecimal.ZERO;

            if (reservedBudget.compareTo(amount) < 0) {
                log.error("Promotion budget corrupted during expiry: reservedBudget {} is less than reservation amount {} for promotion {}", reservedBudget, amount, promotion.getId());
                throw new CustomException("Số dư ngân sách đặt trước của khuyến mãi không đủ để hết hạn", HttpStatus.INTERNAL_SERVER_ERROR);
            }

            promotion.setReservedBudget(reservedBudget.subtract(amount));
            promotion.setReleasedBudget(releasedBudget.add(amount));

            if (promotion.getReservedBudget().compareTo(BigDecimal.ZERO) < 0 || promotion.getReleasedBudget().compareTo(BigDecimal.ZERO) < 0) {
                throw new CustomException("Ngân sách của khuyến mãi không được âm sau khi hết hạn", HttpStatus.INTERNAL_SERVER_ERROR);
            }

            res.setStatus(PromotionBudgetReservationStatus.EXPIRED);
            res.setReleasedAt(LocalDateTime.now());

            promotionRepository.save(promotion);
            reservationRepository.save(res);
        }

        reservationRepository.flush();
        promotionRepository.flush();
    }
}
