package com.greenlife.order.service;

import com.greenlife.order.dto.CheckoutRequest;
import com.greenlife.order.dto.OrderDetailResponse;
import com.greenlife.order.dto.OrderResponse;
import com.greenlife.order.entity.*;
import com.greenlife.store.entity.Store;
import com.greenlife.user.entity.User;
import com.greenlife.user.entity.CustomerAddress;
import com.greenlife.store.repository.StoreRepository;

import com.greenlife.order.entity.enums.OrderStatus;
import com.greenlife.payment.entity.enums.PaymentStatus;
import com.greenlife.plant.entity.enums.PlantStatus;
import com.greenlife.plant.entity.Plant;
import com.greenlife.plant.repository.PlantRepository;
import com.greenlife.exception.CustomException;
import com.greenlife.order.repository.*;
import com.greenlife.user.repository.UserRepository;
import com.greenlife.user.repository.CustomerAddressRepository;
import com.greenlife.common.service.FileStorageService;
import org.springframework.web.multipart.MultipartFile;
import com.greenlife.order.dto.ReturnRequestRequest;
import com.greenlife.util.VNPayUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.context.ApplicationEventPublisher;
import com.greenlife.order.event.OrderStatusEvent;
import com.greenlife.payment.event.PaymentEvent;

import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;
    private final PlantRepository plantRepository;
    private final UserRepository userRepository;
    private final StoreRepository storeRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final CustomerAddressRepository addressRepository;
    private final FileStorageService fileStorageService;

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
        if ("VNPAY".equalsIgnoreCase(request.getPaymentMethod())) {
            throw new CustomException("VNPay hiện đã tạm ngưng. Vui lòng chọn COD hoặc PayOS.", HttpStatus.BAD_REQUEST);
        }

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
        Set<Integer> seen = new HashSet<>();
        List<Order> uniqueOrders = new ArrayList<>();
        for (Order o : orders) {
            if (seen.add(o.getId())) {
                uniqueOrders.add(o);
            }
        }
        return uniqueOrders.stream()
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

        // Verify payment amount matches order amount
        String amountParam = params.get("vnp_Amount");
        if (amountParam != null) {
            try {
                java.math.BigDecimal vnpAmount = new java.math.BigDecimal(amountParam).divide(new java.math.BigDecimal("100"));
                if (order.getTotalAmount().compareTo(vnpAmount) != 0) {
                    log.error("PAYMENT_SECURITY_RISK: VNPay callback amount mismatch for order: {}. Expected: {}, Received: {}",
                            order.getId(), order.getTotalAmount(), vnpAmount);
                    throw new CustomException("Số tiền thanh toán không khớp với giá trị đơn hàng", HttpStatus.BAD_REQUEST);
                }
            } catch (NumberFormatException e) {
                throw new CustomException("Số tiền thanh toán không hợp lệ", HttpStatus.BAD_REQUEST);
            }
        }

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
    @SuppressWarnings("null")
    public List<OrderResponse> getStoreOwnerOrders(Integer ownerId) {
        List<Store> stores = storeRepository.findByOwnerId(ownerId);
        if (stores.isEmpty()) {
            return new ArrayList<>();
        }
        List<Integer> storeIds = stores.stream().map(Store::getId).collect(Collectors.toList());
        List<Order> orders = orderRepository.findByStoreIdInOrderByCreatedAtDesc(storeIds);
        Set<Integer> seen = new HashSet<>();
        List<Order> uniqueOrders = new ArrayList<>();
        for (Order o : orders) {
            if (seen.add(o.getId())) {
                uniqueOrders.add(o);
            }
        }
        return uniqueOrders.stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("null")
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
    @SuppressWarnings("null")
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
    @SuppressWarnings("null")
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

        if (order.getStatus() == OrderStatus.SHIPPING) {
            throw new CustomException("Đơn hàng đang được giao nên không thể hủy. Bạn có thể yêu cầu trả hàng/hoàn tiền sau khi giao hàng thành công.", HttpStatus.BAD_REQUEST);
        }

        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.CONFIRMED) {
            throw new CustomException("Chỉ có thể hủy đơn hàng ở trạng thái chờ xác nhận hoặc đang chuẩn bị hàng.", HttpStatus.BAD_REQUEST);
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
        if (current == OrderStatus.RECEIVED) {
            throw new CustomException("Không thể thay đổi trạng thái của đơn hàng đã nhận", HttpStatus.BAD_REQUEST);
        }
        if (current == OrderStatus.RETURN_REQUESTED) {
            if (target == OrderStatus.RETURN_APPROVED || target == OrderStatus.RETURN_REJECTED) {
                return;
            }
            throw new CustomException("Không thể thay đổi trạng thái của đơn hàng đang yêu cầu trả hàng", HttpStatus.BAD_REQUEST);
        }
        if (current == OrderStatus.RETURN_APPROVED || current == OrderStatus.RETURN_REJECTED) {
            throw new CustomException("Đơn hàng trả về đã được xử lý", HttpStatus.BAD_REQUEST);
        }

        if (target == OrderStatus.RECEIVED || target == OrderStatus.RETURN_REQUESTED) {
            throw new CustomException("Không thể chuyển đơn hàng sang trạng thái nhận hoặc trả hàng từ phía cửa hàng", HttpStatus.BAD_REQUEST);
        }
        if (target == OrderStatus.RETURN_APPROVED || target == OrderStatus.RETURN_REJECTED) {
            if (current != OrderStatus.RETURN_REQUESTED) {
                throw new CustomException("Không thể chuyển sang trạng thái này", HttpStatus.BAD_REQUEST);
            }
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

    @Transactional
    public OrderResponse confirmReceivedCustomerOrder(Integer customerId, Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Đơn hàng không tồn tại", HttpStatus.NOT_FOUND));

        if (!order.getCustomer().getId().equals(customerId)) {
            throw new CustomException("Bạn không có quyền xác nhận đơn hàng của người khác", HttpStatus.FORBIDDEN);
        }

        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new CustomException("Chỉ có thể xác nhận nhận hàng khi đơn hàng ở trạng thái DELIVERED", HttpStatus.BAD_REQUEST);
        }

        order.setStatus(OrderStatus.RECEIVED);
        order.setUpdatedAt(LocalDateTime.now());

        Order saved = orderRepository.save(order);
        eventPublisher.publishEvent(new OrderStatusEvent(this, saved.getId(), saved.getCustomer().getId(), saved.getStore().getOwner().getId(), OrderStatus.RECEIVED));

        return mapToOrderResponse(saved);
    }

    @Transactional
    public OrderResponse requestReturnCustomerOrder(Integer customerId, Integer orderId, ReturnRequestRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Đơn hàng không tồn tại", HttpStatus.NOT_FOUND));

        if (!order.getCustomer().getId().equals(customerId)) {
            throw new CustomException("Bạn không có quyền yêu cầu trả hàng cho đơn hàng của người khác", HttpStatus.FORBIDDEN);
        }

        if (order.getStatus() != OrderStatus.DELIVERED && order.getStatus() != OrderStatus.RECEIVED) {
            throw new CustomException("Chỉ có thể yêu cầu trả hàng/hoàn tiền khi đơn hàng ở trạng thái DELIVERED hoặc RECEIVED", HttpStatus.BAD_REQUEST);
        }

        if (request == null) {
            throw new CustomException("Yêu cầu không hợp lệ", HttpStatus.BAD_REQUEST);
        }

        String reasonCode = request.getReasonCode();
        if (reasonCode == null || reasonCode.trim().isEmpty()) {
            throw new CustomException("Vui lòng chọn lý do hoàn hàng.", HttpStatus.BAD_REQUEST);
        }
        reasonCode = reasonCode.trim();

        Set<String> validCodes = Set.of(
            "PRODUCT_DAMAGED", "WRONG_DESCRIPTION", "WRONG_PRODUCT", 
            "MISSING_ITEMS", "PLANT_DEAD", "NO_LONGER_NEEDED", "OTHER"
        );
        if (!validCodes.contains(reasonCode)) {
            throw new CustomException("Mã lý do không hợp lệ", HttpStatus.BAD_REQUEST);
        }

        String reasonText = request.getReasonText();
        if ("OTHER".equals(reasonCode)) {
            if (reasonText == null || reasonText.trim().isEmpty()) {
                throw new CustomException("Vui lòng nhập mô tả cho lý do khác.", HttpStatus.BAD_REQUEST);
            }
        }

        if (reasonText != null && reasonText.trim().length() > 500) {
            throw new CustomException("Mô tả không được vượt quá 500 ký tự.", HttpStatus.BAD_REQUEST);
        }

        List<String> evidenceImages = request.getEvidenceImages();
        if (evidenceImages != null && evidenceImages.size() > 5) {
            throw new CustomException("Bạn chỉ có thể tải lên tối đa 5 ảnh.", HttpStatus.BAD_REQUEST);
        }

        order.setStatus(OrderStatus.RETURN_REQUESTED);
        order.setReturnRequestReasonCode(reasonCode);
        order.setReturnRequestReason(reasonText != null ? reasonText.trim() : null);
        order.setUpdatedAt(LocalDateTime.now());

        // Clear existing return evidence if any
        order.getReturnEvidences().clear();
        if (evidenceImages != null) {
            for (String imageUrl : evidenceImages) {
                OrderReturnEvidence evidence = OrderReturnEvidence.builder()
                        .order(order)
                        .imageUrl(imageUrl)
                        .createdAt(LocalDateTime.now())
                        .build();
                order.getReturnEvidences().add(evidence);
            }
        }

        Order saved = orderRepository.save(order);
        eventPublisher.publishEvent(new OrderStatusEvent(this, saved.getId(), saved.getCustomer().getId(), saved.getStore().getOwner().getId(), OrderStatus.RETURN_REQUESTED));

        return mapToOrderResponse(saved);
    }

    @Transactional
    public String uploadReturnEvidence(Integer customerId, Integer orderId, MultipartFile file) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Đơn hàng không tồn tại", HttpStatus.NOT_FOUND));

        if (!order.getCustomer().getId().equals(customerId)) {
            throw new CustomException("Bạn không có quyền upload hình ảnh cho đơn hàng này", HttpStatus.FORBIDDEN);
        }

        if (order.getStatus() != OrderStatus.DELIVERED && order.getStatus() != OrderStatus.RECEIVED) {
            throw new CustomException("Chỉ có thể tải lên hình ảnh minh chứng khi đơn hàng ở trạng thái DELIVERED hoặc RECEIVED", HttpStatus.BAD_REQUEST);
        }

        if (file == null || file.isEmpty()) {
            throw new CustomException("Tệp tải lên không được để trống", HttpStatus.BAD_REQUEST);
        }

        return fileStorageService.storeReturnEvidence(file);
    }

    @Transactional
    @SuppressWarnings("null")
    public OrderResponse approveReturnRequestStoreOwner(Integer ownerId, Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Đơn hàng không tồn tại", HttpStatus.NOT_FOUND));

        List<Store> stores = storeRepository.findByOwnerId(ownerId);
        List<Integer> storeIds = stores.stream().map(Store::getId).collect(Collectors.toList());

        if (!storeIds.contains(order.getStore().getId())) {
            throw new CustomException("Bạn không có quyền truy cập đơn hàng của cửa hàng khác", HttpStatus.FORBIDDEN);
        }

        if (order.getStatus() != OrderStatus.RETURN_REQUESTED) {
            throw new CustomException("Chỉ có thể chấp nhận yêu cầu trả hàng khi trạng thái đơn hàng là RETURN_REQUESTED", HttpStatus.BAD_REQUEST);
        }

        order.setStatus(OrderStatus.RETURN_APPROVED);
        order.setUpdatedAt(LocalDateTime.now());

        Order saved = orderRepository.save(order);
        eventPublisher.publishEvent(new OrderStatusEvent(this, saved.getId(), saved.getCustomer().getId(), saved.getStore().getOwner().getId(), OrderStatus.RETURN_APPROVED));

        return mapToOrderResponse(saved);
    }

    @Transactional
    @SuppressWarnings("null")
    public OrderResponse rejectReturnRequestStoreOwner(Integer ownerId, Integer orderId, String reason) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Đơn hàng không tồn tại", HttpStatus.NOT_FOUND));

        List<Store> stores = storeRepository.findByOwnerId(ownerId);
        List<Integer> storeIds = stores.stream().map(Store::getId).collect(Collectors.toList());

        if (!storeIds.contains(order.getStore().getId())) {
            throw new CustomException("Bạn không có quyền truy cập đơn hàng của cửa hàng khác", HttpStatus.FORBIDDEN);
        }

        if (order.getStatus() != OrderStatus.RETURN_REQUESTED) {
            throw new CustomException("Chỉ có thể từ chối yêu cầu trả hàng khi trạng thái đơn hàng là RETURN_REQUESTED", HttpStatus.BAD_REQUEST);
        }

        if (reason == null || reason.trim().isEmpty()) {
            throw new CustomException("Lý do từ chối không được để trống", HttpStatus.BAD_REQUEST);
        }

        order.setStatus(OrderStatus.RETURN_REJECTED);
        order.setReturnRejectReason(reason.trim());
        order.setUpdatedAt(LocalDateTime.now());

        Order saved = orderRepository.save(order);
        eventPublisher.publishEvent(new OrderStatusEvent(this, saved.getId(), saved.getCustomer().getId(), saved.getStore().getOwner().getId(), OrderStatus.RETURN_REJECTED));

        return mapToOrderResponse(saved);
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
                        .imageUrl(d.getPlant() != null ? d.getPlant().getImageUrl() : null)
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
                .returnRejectReason(order.getReturnRejectReason())
                .returnRequestReason(order.getReturnRequestReason())
                .returnRequestReasonCode(order.getReturnRequestReasonCode())
                .evidenceImages(order.getReturnEvidences() != null ?
                        order.getReturnEvidences().stream().map(OrderReturnEvidence::getImageUrl).collect(Collectors.toList()) :
                        new ArrayList<>())
                .createdAt(order.getCreatedAt())
                .paymentUrl(paymentUrl)
                .paymentProvider(order.getPaymentProvider())
                .payosCheckoutUrl(order.getPayosCheckoutUrl())
                .payosQrCode(order.getPayosQrCode())
                .payosOrderCode(order.getPayosOrderCode())
                .details(detailResponses)
                .build();
    }
}
