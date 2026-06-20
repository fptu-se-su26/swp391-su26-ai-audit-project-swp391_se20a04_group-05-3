package com.greenlife.service;

import com.greenlife.dto.CheckoutRequest;
import com.greenlife.dto.OrderDetailResponse;
import com.greenlife.dto.OrderResponse;
import com.greenlife.dto.UpdateOrderStatusRequest;
import com.greenlife.entity.*;
import com.greenlife.entity.enums.OrderStatus;
import com.greenlife.entity.enums.PaymentStatus;
import com.greenlife.entity.enums.PlantStatus;
import com.greenlife.exception.CustomException;
import com.greenlife.repository.*;
import com.greenlife.util.VNPayUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.context.ApplicationEventPublisher;
import com.greenlife.event.OrderStatusEvent;
import com.greenlife.event.PaymentEvent;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final CartItemRepository cartItemRepository;
    private final PlantRepository plantRepository;
    private final UserRepository userRepository;
    private final StoreRepository storeRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final CustomerAddressRepository addressRepository;

    @Value("${vnpay.tmn-code}")
    private String vnpayTmnCode;

    @Value("${vnpay.hash-secret}")
    private String vnpayHashSecret;

    @Value("${vnpay.pay-url}")
    private String vnpayPayUrl;

    @Value("${vnpay.return-url}")
    private String vnpayReturnUrl;

    @Transactional
    public List<OrderResponse> checkout(Integer customerId, CheckoutRequest request) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new CustomException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));

        List<CartItem> cartItems = cartItemRepository.findByCustomerId(customerId);
        if (cartItems.isEmpty()) {
            throw new CustomException("Giỏ hàng của bạn đang trống", HttpStatus.BAD_REQUEST);
        }

        String recipientName;
        String recipientPhone;
        String shippingAddress;

        if (request.getAddressId() != null) {
            CustomerAddress address = addressRepository.findById(request.getAddressId())
                    .orElseThrow(() -> new CustomException("Địa chỉ không tồn tại", HttpStatus.BAD_REQUEST));
            if (!address.getCustomer().getId().equals(customerId)) {
                throw new CustomException("Bạn không có quyền sử dụng địa chỉ này", HttpStatus.FORBIDDEN);
            }
            recipientName = address.getRecipientName();
            recipientPhone = address.getPhone();
            shippingAddress = address.getAddressLine() + ", " + address.getWard() + ", " + address.getDistrict() + ", " + address.getCity();
        } else {
            if (request.getRecipientName() == null || request.getRecipientName().isBlank() ||
                request.getRecipientPhone() == null || request.getRecipientPhone().isBlank() ||
                request.getShippingAddress() == null || request.getShippingAddress().isBlank()) {
                throw new CustomException("Vui lòng cung cấp địa chỉ nhận hàng", HttpStatus.BAD_REQUEST);
            }
            recipientName = request.getRecipientName();
            recipientPhone = request.getRecipientPhone();
            shippingAddress = request.getShippingAddress();
        }

        // Group cart items by store
        Map<Store, List<CartItem>> itemsByStore = cartItems.stream()
                .collect(Collectors.groupingBy(item -> item.getPlant().getStore()));

        List<Order> createdOrders = new ArrayList<>();

        for (Map.Entry<Store, List<CartItem>> entry : itemsByStore.entrySet()) {
            Store store = entry.getKey();
            List<CartItem> storeCartItems = entry.getValue();

            BigDecimal orderSubtotal = BigDecimal.ZERO;
            List<OrderDetail> details = new ArrayList<>();

            String method = (request.getPaymentMethod() != null) ? request.getPaymentMethod() : "COD";

            Order order = Order.builder()
                    .customer(customer)
                    .store(store)
                    .recipientName(recipientName)
                    .recipientPhone(recipientPhone)
                    .shippingAddress(shippingAddress)
                    .note(request.getNote())
                    .paymentMethod(method)
                    .paymentStatus(PaymentStatus.PENDING)
                    .status(OrderStatus.PENDING)
                    .createdAt(LocalDateTime.now())
                    .shippingFee(BigDecimal.ZERO) // defaults to 0
                    .build();

            for (CartItem item : storeCartItems) {
                // Reload Plant from DB to ensure fresh price and stock (Price Revalidation Rule)
                Plant plant = plantRepository.findById(item.getPlant().getId())
                        .orElseThrow(() -> new CustomException("Sản phẩm không tồn tại", HttpStatus.NOT_FOUND));

                if (plant.getStatus() == PlantStatus.INACTIVE) {
                    throw new CustomException("Sản phẩm " + plant.getName() + " không hoạt động", HttpStatus.BAD_REQUEST);
                }

                // Stock validation
                if (item.getQuantity() > plant.getStock()) {
                    throw new CustomException("Sản phẩm " + plant.getName() + " không đủ tồn kho khả dụng", HttpStatus.BAD_REQUEST);
                }

                // Deduct stock
                plant.setStock(plant.getStock() - item.getQuantity());
                plantRepository.save(plant);

                BigDecimal unitPrice = plant.getPrice();
                BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));
                orderSubtotal = orderSubtotal.add(lineTotal);

                OrderDetail detail = OrderDetail.builder()
                        .order(order)
                        .plant(plant)
                        .productName(plant.getName())
                        .quantity(item.getQuantity())
                        .unitPrice(unitPrice)
                        .lineTotal(lineTotal)
                        .build();

                details.add(detail);
            }

            order.setSubtotal(orderSubtotal);
            order.setTotalAmount(orderSubtotal); // total = subtotal + shippingFee (which is 0)
            order.setOrderDetails(details);

            createdOrders.add(orderRepository.save(order));
        }

        // Clear user's cart
        cartItemRepository.deleteAll(cartItems);

        for (Order order : createdOrders) {
            eventPublisher.publishEvent(new OrderStatusEvent(
                    this,
                    order.getId(),
                    order.getCustomer().getId(),
                    order.getStore().getOwner().getId(),
                    OrderStatus.PENDING
            ));
        }

        return createdOrders.stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getCustomerOrders(Integer customerId) {
        List<Order> orders = orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
        return orders.stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OrderResponse getCustomerOrderDetail(Integer customerId, Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Đơn hàng không tồn tại", HttpStatus.NOT_FOUND));

        // Ownership validation
        if (!order.getCustomer().getId().equals(customerId)) {
            throw new CustomException("Bạn không có quyền truy cập đơn hàng này", HttpStatus.FORBIDDEN);
        }

        return mapToOrderResponse(order);
    }

    @Transactional
    public OrderResponse processVNPayCallback(Map<String, String> params) {
        // Verify signature
        if (!VNPayUtil.verifyCallbackSignature(params, vnpayHashSecret)) {
            throw new CustomException("Chữ ký thanh toán không hợp lệ", HttpStatus.BAD_REQUEST);
        }

        String txnRef = params.get("vnp_TxnRef");
        if (txnRef == null) {
            throw new CustomException("Mã tham chiếu giao dịch không hợp lệ", HttpStatus.BAD_REQUEST);
        }

        // Parse Order ID from TxnRef
        Integer orderId;
        try {
            orderId = Integer.parseInt(txnRef.split("_")[0]);
        } catch (Exception e) {
            throw new CustomException("Mã đơn hàng không hợp lệ", HttpStatus.BAD_REQUEST);
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Đơn hàng không tồn tại", HttpStatus.NOT_FOUND));

        // Duplicate callback protection
        if (order.getPaymentStatus() != PaymentStatus.PENDING) {
            return mapToOrderResponse(order);
        }

        String responseCode = params.get("vnp_ResponseCode");
        if ("00".equals(responseCode)) {
            order.setPaymentStatus(PaymentStatus.PAID);
            order.setStatus(OrderStatus.CONFIRMED);
            orderRepository.save(order);
            eventPublisher.publishEvent(new PaymentEvent(this, order.getId(), order.getCustomer().getId(), true));
            eventPublisher.publishEvent(new OrderStatusEvent(this, order.getId(), order.getCustomer().getId(), order.getStore().getOwner().getId(), OrderStatus.CONFIRMED));
        } else {
            order.setPaymentStatus(PaymentStatus.FAILED);
            // Failed VNPay callback: OrderStatus remains PENDING, inventory remains deducted
            order.setStatus(OrderStatus.PENDING);
            orderRepository.save(order);
            eventPublisher.publishEvent(new PaymentEvent(this, order.getId(), order.getCustomer().getId(), false));
        }

        return mapToOrderResponse(order);
    }

    public String getVNPayUrl(Order order, String ipAddress) {
        return VNPayUtil.generatePaymentUrl(
                order,
                ipAddress,
                vnpayTmnCode,
                vnpayHashSecret,
                vnpayPayUrl,
                vnpayReturnUrl
        );
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getStoreOwnerOrders(Integer ownerId) {
        List<Store> stores = storeRepository.findByOwnerId(ownerId);
        if (stores.isEmpty()) {
            return new ArrayList<>();
        }
        List<Integer> storeIds = stores.stream().map(Store::getId).collect(Collectors.toList());
        return orderRepository.findByStoreIdInOrderByCreatedAtDesc(storeIds).stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OrderResponse getStoreOwnerOrderDetail(Integer ownerId, Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Đơn hàng không tồn tại", HttpStatus.NOT_FOUND));

        List<Store> stores = storeRepository.findByOwnerId(ownerId);
        List<Integer> storeIds = stores.stream().map(Store::getId).collect(Collectors.toList());

        if (!storeIds.contains(order.getStore().getId())) {
            throw new CustomException("Bạn không có quyền truy cập đơn hàng của cửa hàng khác", HttpStatus.FORBIDDEN);
        }

        return mapToOrderResponse(order);
    }

    @Transactional
    public OrderResponse updateStoreOwnerOrderStatus(Integer ownerId, Integer orderId, String statusStr) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Đơn hàng không tồn tại", HttpStatus.NOT_FOUND));

        List<Store> stores = storeRepository.findByOwnerId(ownerId);
        List<Integer> storeIds = stores.stream().map(Store::getId).collect(Collectors.toList());

        if (!storeIds.contains(order.getStore().getId())) {
            throw new CustomException("Bạn không có quyền truy cập đơn hàng của cửa hàng khác", HttpStatus.FORBIDDEN);
        }

        OrderStatus targetStatus;
        try {
            targetStatus = OrderStatus.valueOf(statusStr.toUpperCase());
        } catch (Exception e) {
            throw new CustomException("Trạng thái không hợp lệ", HttpStatus.BAD_REQUEST);
        }

        validateTransition(order.getStatus(), targetStatus);

        if (targetStatus == OrderStatus.CANCELLED) {
            restoreInventory(order);
        }

        order.setStatus(targetStatus);
        boolean isCodDelivered = false;
        if (targetStatus == OrderStatus.DELIVERED && "COD".equalsIgnoreCase(order.getPaymentMethod())) {
            order.setPaymentStatus(PaymentStatus.PAID);
            isCodDelivered = true;
        }
        order.setUpdatedAt(LocalDateTime.now());

        Order saved = orderRepository.save(order);
        eventPublisher.publishEvent(new OrderStatusEvent(this, saved.getId(), saved.getCustomer().getId(), saved.getStore().getOwner().getId(), targetStatus));
        if (isCodDelivered) {
            eventPublisher.publishEvent(new PaymentEvent(this, saved.getId(), saved.getCustomer().getId(), true));
        }

        return mapToOrderResponse(saved);
    }

    @Transactional
    public OrderResponse cancelStoreOwnerOrder(Integer ownerId, Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Đơn hàng không tồn tại", HttpStatus.NOT_FOUND));

        List<Store> stores = storeRepository.findByOwnerId(ownerId);
        List<Integer> storeIds = stores.stream().map(Store::getId).collect(Collectors.toList());

        if (!storeIds.contains(order.getStore().getId())) {
            throw new CustomException("Bạn không có quyền truy cập đơn hàng của cửa hàng khác", HttpStatus.FORBIDDEN);
        }

        validateTransition(order.getStatus(), OrderStatus.CANCELLED);

        restoreInventory(order);

        order.setStatus(OrderStatus.CANCELLED);
        order.setUpdatedAt(LocalDateTime.now());

        Order saved = orderRepository.save(order);
        eventPublisher.publishEvent(new OrderStatusEvent(this, saved.getId(), saved.getCustomer().getId(), saved.getStore().getOwner().getId(), OrderStatus.CANCELLED));

        return mapToOrderResponse(saved);
    }

    @Transactional
    public OrderResponse cancelCustomerOrder(Integer customerId, Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Đơn hàng không tồn tại", HttpStatus.NOT_FOUND));

        if (!order.getCustomer().getId().equals(customerId)) {
            throw new CustomException("Bạn không có quyền hủy đơn hàng của người khác", HttpStatus.FORBIDDEN);
        }

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new CustomException("Chỉ có thể hủy đơn hàng ở trạng thái PENDING", HttpStatus.BAD_REQUEST);
        }

        restoreInventory(order);

        order.setStatus(OrderStatus.CANCELLED);
        order.setUpdatedAt(LocalDateTime.now());

        Order saved = orderRepository.save(order);
        eventPublisher.publishEvent(new OrderStatusEvent(this, saved.getId(), saved.getCustomer().getId(), saved.getStore().getOwner().getId(), OrderStatus.CANCELLED));

        return mapToOrderResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrdersForAdmin() {
        return orderRepository.findAll().stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderDetailsForAdmin(Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Đơn hàng không tồn tại", HttpStatus.NOT_FOUND));
        return mapToOrderResponse(order);
    }

    private void restoreInventory(Order order) {
        for (OrderDetail detail : order.getOrderDetails()) {
            Plant plant = detail.getPlant();
            plant.setStock(plant.getStock() + detail.getQuantity());
            plantRepository.save(plant);
        }
    }

    private void validateTransition(OrderStatus current, OrderStatus target) {
        if (current == target) {
            return;
        }
        if (current == OrderStatus.DELIVERED) {
            throw new CustomException("Không thể thay đổi trạng thái của đơn hàng đã giao thành công", HttpStatus.BAD_REQUEST);
        }
        if (current == OrderStatus.CANCELLED) {
            throw new CustomException("Không thể thay đổi trạng thái của đơn hàng đã hủy", HttpStatus.BAD_REQUEST);
        }

        if (target == OrderStatus.CANCELLED) {
            if (current == OrderStatus.SHIPPING) {
                throw new CustomException("Không thể hủy đơn hàng đang giao", HttpStatus.BAD_REQUEST);
            }
            if (current == OrderStatus.PENDING || current == OrderStatus.CONFIRMED) {
                return;
            }
            throw new CustomException("Thay đổi trạng thái không hợp lệ", HttpStatus.BAD_REQUEST);
        }

        if (current == OrderStatus.PENDING && target == OrderStatus.CONFIRMED) {
            return;
        }
        if (current == OrderStatus.CONFIRMED && target == OrderStatus.SHIPPING) {
            return;
        }
        if (current == OrderStatus.SHIPPING && target == OrderStatus.DELIVERED) {
            return;
        }

        throw new CustomException("Thay đổi trạng thái không hợp lệ", HttpStatus.BAD_REQUEST);
    }

    private OrderResponse mapToOrderResponse(Order order) {
        List<OrderDetailResponse> detailResponses = order.getOrderDetails().stream()
                .map(d -> OrderDetailResponse.builder()
                        .id(d.getId())
                        .plantId(d.getPlant().getId())
                        .productName(d.getProductName())
                        .quantity(d.getQuantity())
                        .unitPrice(d.getUnitPrice())
                        .lineTotal(d.getLineTotal())
                        .build())
                .collect(Collectors.toList());

        String paymentUrl = null;
        if ("VNPAY".equalsIgnoreCase(order.getPaymentMethod()) && order.getPaymentStatus() == PaymentStatus.PENDING) {
            paymentUrl = getVNPayUrl(order, "127.0.0.1");
        }

        return OrderResponse.builder()
                .id(order.getId())
                .storeId(order.getStore().getId())
                .storeName(order.getStore().getName())
                .recipientName(order.getRecipientName())
                .recipientPhone(order.getRecipientPhone())
                .shippingAddress(order.getShippingAddress())
                .subtotal(order.getSubtotal())
                .shippingFee(order.getShippingFee())
                .totalAmount(order.getTotalAmount())
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus() != null ? order.getPaymentStatus().name() : null)
                .status(order.getStatus().name())
                .note(order.getNote())
                .createdAt(order.getCreatedAt())
                .paymentUrl(paymentUrl)
                .details(detailResponses)
                .build();
    }
}
