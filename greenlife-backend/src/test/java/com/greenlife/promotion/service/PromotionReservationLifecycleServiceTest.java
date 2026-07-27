package com.greenlife.promotion.service;

import com.greenlife.exception.CustomException;
import com.greenlife.order.entity.Order;
import com.greenlife.promotion.entity.Promotion;
import com.greenlife.promotion.entity.PromotionBudgetReservation;
import com.greenlife.promotion.entity.enums.PromotionBudgetReservationStatus;
import com.greenlife.promotion.repository.PromotionBudgetReservationRepository;
import com.greenlife.promotion.repository.PromotionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PromotionReservationLifecycleServiceTest {

    @Mock
    private PromotionBudgetReservationRepository reservationRepository;

    @Mock
    private PromotionRepository promotionRepository;

    @InjectMocks
    private PromotionReservationLifecycleService lifecycleService;

    private Order order;
    private Promotion promo1;
    private Promotion promo2;

    @BeforeEach
    void setUp() {
        order = Order.builder().id(100).build();
        promo1 = Promotion.builder()
                .id(1)
                .reservedBudget(new BigDecimal("1000"))
                .consumedBudget(new BigDecimal("500"))
                .releasedBudget(new BigDecimal("200"))
                .build();
        promo2 = Promotion.builder()
                .id(2)
                .reservedBudget(new BigDecimal("2000"))
                .consumedBudget(new BigDecimal("800"))
                .releasedBudget(new BigDecimal("300"))
                .build();
    }

    @Test
    void testReservedToConsumed() {
        // Test 1 & 2: RESERVED -> CONSUMED, reserved decreases and consumed increases.
        PromotionBudgetReservation reservation = PromotionBudgetReservation.builder()
                .id(10)
                .order(order)
                .promotion(promo1)
                .totalDiscountAmount(new BigDecimal("300"))
                .status(PromotionBudgetReservationStatus.RESERVED)
                .build();

        when(reservationRepository.findByOrderId(100)).thenReturn(List.of(reservation));
        when(promotionRepository.findAndLockById(1)).thenReturn(Optional.of(promo1));

        lifecycleService.consumeForOrder(100);

        assertEquals(PromotionBudgetReservationStatus.CONSUMED, reservation.getStatus());
        assertNotNull(reservation.getConsumedAt());
        assertEquals(new BigDecimal("700"), promo1.getReservedBudget());
        assertEquals(new BigDecimal("800"), promo1.getConsumedBudget());

        verify(promotionRepository).save(promo1);
        verify(reservationRepository).save(reservation);
    }

    @Test
    void testDuplicateConsumeIsNoOp() {
        // Test 3: Duplicate consume is no-op.
        PromotionBudgetReservation reservation = PromotionBudgetReservation.builder()
                .id(10)
                .order(order)
                .promotion(promo1)
                .totalDiscountAmount(new BigDecimal("300"))
                .status(PromotionBudgetReservationStatus.CONSUMED)
                .build();

        when(reservationRepository.findByOrderId(100)).thenReturn(List.of(reservation));

        lifecycleService.consumeForOrder(100);

        assertEquals(PromotionBudgetReservationStatus.CONSUMED, reservation.getStatus());
        verify(promotionRepository, never()).findAndLockById(anyInt());
        verify(promotionRepository, never()).save(any());
        verify(reservationRepository, never()).save(any());
    }

    @Test
    void testMultipleReservationsForSamePromotionAggregateCorrectly() {
        // Test 4: Multiple reservations for same promotion aggregate correctly.
        PromotionBudgetReservation res1 = PromotionBudgetReservation.builder()
                .id(10)
                .order(order)
                .promotion(promo1)
                .totalDiscountAmount(new BigDecimal("300"))
                .status(PromotionBudgetReservationStatus.RESERVED)
                .build();

        PromotionBudgetReservation res2 = PromotionBudgetReservation.builder()
                .id(11)
                .order(order)
                .promotion(promo1)
                .totalDiscountAmount(new BigDecimal("400"))
                .status(PromotionBudgetReservationStatus.RESERVED)
                .build();

        when(reservationRepository.findByOrderId(100)).thenReturn(List.of(res1, res2));
        when(promotionRepository.findAndLockById(1)).thenReturn(Optional.of(promo1));

        lifecycleService.consumeForOrder(100);

        assertEquals(PromotionBudgetReservationStatus.CONSUMED, res1.getStatus());
        assertEquals(PromotionBudgetReservationStatus.CONSUMED, res2.getStatus());
        assertEquals(new BigDecimal("300"), promo1.getReservedBudget()); // 1000 - 300 - 400
        assertEquals(new BigDecimal("1200"), promo1.getConsumedBudget()); // 500 + 300 + 400
    }

    @Test
    void testMultiplePromotionsLockInAscendingIdOrder() {
        // Test 5: Multiple promotions lock in ascending ID order.
        PromotionBudgetReservation res1 = PromotionBudgetReservation.builder()
                .id(10)
                .order(order)
                .promotion(promo2) // ID 2
                .totalDiscountAmount(new BigDecimal("300"))
                .status(PromotionBudgetReservationStatus.RESERVED)
                .build();

        PromotionBudgetReservation res2 = PromotionBudgetReservation.builder()
                .id(11)
                .order(order)
                .promotion(promo1) // ID 1
                .totalDiscountAmount(new BigDecimal("400"))
                .status(PromotionBudgetReservationStatus.RESERVED)
                .build();

        when(reservationRepository.findByOrderId(100)).thenReturn(List.of(res1, res2));
        when(promotionRepository.findAndLockById(1)).thenReturn(Optional.of(promo1));
        when(promotionRepository.findAndLockById(2)).thenReturn(Optional.of(promo2));

        lifecycleService.consumeForOrder(100);

        InOrder inOrder = inOrder(promotionRepository);
        inOrder.verify(promotionRepository).findAndLockById(1);
        inOrder.verify(promotionRepository).findAndLockById(2);
    }

    @Test
    void testReservedToReleased() {
        // Test 6 & 7: RESERVED -> RELEASED, reserved decreases and released increases.
        PromotionBudgetReservation reservation = PromotionBudgetReservation.builder()
                .id(10)
                .order(order)
                .promotion(promo1)
                .totalDiscountAmount(new BigDecimal("300"))
                .status(PromotionBudgetReservationStatus.RESERVED)
                .build();

        when(reservationRepository.findByOrderId(100)).thenReturn(List.of(reservation));
        when(promotionRepository.findAndLockById(1)).thenReturn(Optional.of(promo1));

        lifecycleService.releaseForOrder(100, "Unpaid cancelled");

        assertEquals(PromotionBudgetReservationStatus.RELEASED, reservation.getStatus());
        assertNotNull(reservation.getReleasedAt());
        assertEquals(new BigDecimal("700"), promo1.getReservedBudget());
        assertEquals(new BigDecimal("500"), promo1.getReleasedBudget()); // 200 + 300
    }

    @Test
    void testDuplicateReleaseIsNoOp() {
        // Test 8: Duplicate release is no-op.
        PromotionBudgetReservation reservation = PromotionBudgetReservation.builder()
                .id(10)
                .order(order)
                .promotion(promo1)
                .totalDiscountAmount(new BigDecimal("300"))
                .status(PromotionBudgetReservationStatus.RELEASED)
                .build();

        when(reservationRepository.findByOrderId(100)).thenReturn(List.of(reservation));

        lifecycleService.releaseForOrder(100, "Unpaid cancelled");

        assertEquals(PromotionBudgetReservationStatus.RELEASED, reservation.getStatus());
        verify(promotionRepository, never()).findAndLockById(anyInt());
    }

    @Test
    void testConsumedIsNeverReleased() {
        // Test 9: CONSUMED is never released.
        PromotionBudgetReservation reservation = PromotionBudgetReservation.builder()
                .id(10)
                .order(order)
                .promotion(promo1)
                .totalDiscountAmount(new BigDecimal("300"))
                .status(PromotionBudgetReservationStatus.CONSUMED)
                .build();

        when(reservationRepository.findByOrderId(100)).thenReturn(List.of(reservation));

        lifecycleService.releaseForOrder(100, "Unpaid cancelled");

        assertEquals(PromotionBudgetReservationStatus.CONSUMED, reservation.getStatus());
        verify(promotionRepository, never()).findAndLockById(anyInt());
    }

    @Test
    void testCorruptedReservedBalanceRollsBack() {
        // Test 10: Corrupted reserved balance rolls back/fails.
        promo1.setReservedBudget(new BigDecimal("100")); // less than reservation amount 300
        PromotionBudgetReservation reservation = PromotionBudgetReservation.builder()
                .id(10)
                .order(order)
                .promotion(promo1)
                .totalDiscountAmount(new BigDecimal("300"))
                .status(PromotionBudgetReservationStatus.RESERVED)
                .build();

        when(reservationRepository.findByOrderId(100)).thenReturn(List.of(reservation));
        when(promotionRepository.findAndLockById(1)).thenReturn(Optional.of(promo1));

        assertThrows(CustomException.class, () -> lifecycleService.consumeForOrder(100));
    }

    @Test
    void testMissingReservationSucceedsAsNoOp() {
        // Test 11: Missing reservation succeeds as no-op.
        when(reservationRepository.findByOrderId(100)).thenReturn(List.of());

        assertDoesNotThrow(() -> lifecycleService.consumeForOrder(100));
        assertDoesNotThrow(() -> lifecycleService.releaseForOrder(100, "Any"));
        assertDoesNotThrow(() -> lifecycleService.expireForOrder(100, "Any"));
    }

    @Test
    void testTerminalStatusesAreNotChanged() {
        // Test 12: Terminal statuses are not changed.
        PromotionBudgetReservation res1 = PromotionBudgetReservation.builder()
                .id(10)
                .status(PromotionBudgetReservationStatus.RELEASED)
                .build();

        PromotionBudgetReservation res2 = PromotionBudgetReservation.builder()
                .id(11)
                .status(PromotionBudgetReservationStatus.EXPIRED)
                .build();

        when(reservationRepository.findByOrderId(100)).thenReturn(List.of(res1, res2));

        lifecycleService.consumeForOrder(100);

        assertEquals(PromotionBudgetReservationStatus.RELEASED, res1.getStatus());
        assertEquals(PromotionBudgetReservationStatus.EXPIRED, res2.getStatus());
        verify(promotionRepository, never()).findAndLockById(anyInt());
    }
}
