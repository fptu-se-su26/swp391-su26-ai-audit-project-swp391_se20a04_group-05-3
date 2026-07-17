package com.greenlife.order.entity;

import com.greenlife.plant.entity.Plant;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

import com.greenlife.promotion.entity.Promotion;
import com.greenlife.promotion.entity.enums.PromotionFundingSource;

@Entity
@Table(name = "order_details")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_id", nullable = false)
    private Plant plant;

    @Column(name = "product_name", nullable = false, length = 150)
    private String productName;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 0)
    private BigDecimal unitPrice;

    @Column(name = "line_total", nullable = false, precision = 12, scale = 0)
    private BigDecimal lineTotal;

    @Column(name = "base_unit_price", precision = 12, scale = 0)
    private BigDecimal baseUnitPrice;

    @Column(name = "store_funded_discount", precision = 12, scale = 0)
    private BigDecimal storeFundedDiscount;

    @Column(name = "platform_funded_discount", precision = 12, scale = 0)
    private BigDecimal platformFundedDiscount;

    @Column(name = "final_customer_price", precision = 12, scale = 0)
    private BigDecimal finalCustomerPrice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion_id")
    private Promotion promotion;

    @Enumerated(EnumType.STRING)
    @Column(name = "promotion_funding_source", length = 30)
    private PromotionFundingSource promotionFundingSource;

    @Column(name = "commission_rate", precision = 5, scale = 4)
    private BigDecimal commissionRate;

    @Column(name = "commission_base", precision = 12, scale = 0)
    private BigDecimal commissionBase;

    @Column(name = "commission_amount", precision = 12, scale = 0)
    private BigDecimal commissionAmount;

    @Column(name = "store_net_amount", precision = 12, scale = 0)
    private BigDecimal storeNetAmount;
}
