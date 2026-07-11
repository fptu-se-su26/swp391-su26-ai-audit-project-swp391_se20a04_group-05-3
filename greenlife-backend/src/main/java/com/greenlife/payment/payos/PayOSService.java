package com.greenlife.payment.payos;

import com.greenlife.exception.CustomException;
import com.greenlife.order.entity.Order;
import com.greenlife.order.entity.enums.OrderStatus;
import com.greenlife.order.event.OrderStatusEvent;
import com.greenlife.order.repository.OrderRepository;
import com.greenlife.payment.entity.enums.PaymentStatus;
import com.greenlife.payment.event.PaymentEvent;
import com.greenlife.payment.payos.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
@Slf4j
public class PayOSService {

    private final OrderRepository orderRepository;
    private final PayOSConfig payOSConfig;
    private final ApplicationEventPublisher eventPublisher;
    private final RestTemplate restTemplate = new RestTemplate();

    private static final String PAYOS_API_URL = "https://api-merchant.payos.vn/v2/payment-requests";

    private Long generateUniquePayosOrderCode() {
        int retries = 0;
        while (retries < 5) {
            long timestampSec = System.currentTimeMillis() / 1000;
            int randomNum = ThreadLocalRandom.current().nextInt(100, 1000);
            long candidateCode = timestampSec * 1000 + randomNum;
            
            if (orderRepository.findByPayosOrderCode(candidateCode).isEmpty()) {
                return candidateCode;
            }
            retries++;
        }
        throw new CustomException("Không thể tạo mã thanh toán duy nhất sau nhiều lần thử", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Transactional
    public PayOSPaymentLinkData createPayOSPaymentLink(Integer orderId, String userEmail) {
        // 1. Find order
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Đơn hàng không tồn tại", HttpStatus.NOT_FOUND));

        // 2. Verify ownership
        if (!order.getCustomer().getEmail().equalsIgnoreCase(userEmail)) {
            throw new CustomException("Bạn không có quyền truy cập đơn hàng này", HttpStatus.FORBIDDEN);
        }

        // 3. Verify payment method
        if (!"PAYOS".equalsIgnoreCase(order.getPaymentMethod())) {
            throw new CustomException("Phương thức thanh toán của đơn hàng không phải là PayOS", HttpStatus.BAD_REQUEST);
        }

        // 4. Verify payment status
        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            throw new CustomException("Đơn hàng đã được thanh toán", HttpStatus.BAD_REQUEST);
        }

        // 5. Idempotency check
        if (order.getPayosLinkId() != null && order.getPayosCheckoutUrl() != null && order.getPaymentStatus() == PaymentStatus.PENDING) {
            log.info("Returning existing PayOS payment link for order: {}", orderId);
            return PayOSPaymentLinkData.builder()
                    .orderCode(order.getPayosOrderCode() != null ? order.getPayosOrderCode() : order.getId().longValue())
                    .amount(order.getTotalAmount())
                    .description("GL" + order.getId())
                    .checkoutUrl(order.getPayosCheckoutUrl())
                    .qrCode(order.getPayosQrCode())
                    .payosLinkId(order.getPayosLinkId())
                    .paymentStatus(order.getPaymentStatus().name())
                    .build();
        }

        // Validate PayOS configuration keys
        if (payOSConfig.getClientId() == null || payOSConfig.getClientId().isBlank() ||
            payOSConfig.getApiKey() == null || payOSConfig.getApiKey().isBlank() ||
            payOSConfig.getChecksumKey() == null || payOSConfig.getChecksumKey().isBlank()) {
            throw new CustomException("Cổng thanh toán PayOS chưa được cấu hình đầy đủ thông tin", HttpStatus.SERVICE_UNAVAILABLE);
        }

        // Ensure payosOrderCode is generated
        if (order.getPayosOrderCode() == null) {
            order.setPayosOrderCode(generateUniquePayosOrderCode());
            order = orderRepository.save(order);
        }

        try {
            Long orderCode = order.getPayosOrderCode();
            long amountVal = order.getTotalAmount().longValue();
            String description = "GL" + order.getId();
            String cancelUrl = payOSConfig.getCancelUrl();
            String returnUrl = payOSConfig.getReturnUrl();

            // We wrap the API call and retry once if it is duplicate
            Map responseBody = null;
            String code = null;
            String desc = null;

            try {
                responseBody = callPayOSCreateLink(orderCode, amountVal, description, cancelUrl, returnUrl);
                if (responseBody != null) {
                    code = (String) responseBody.get("code");
                    desc = (String) responseBody.get("desc");
                }
            } catch (org.springframework.web.client.HttpClientErrorException ex) {
                log.warn("PayOS API call failed on attempt 1", ex);
                try {
                    responseBody = new com.fasterxml.jackson.databind.ObjectMapper().readValue(ex.getResponseBodyAsString(), Map.class);
                    if (responseBody != null) {
                        code = (String) responseBody.get("code");
                        desc = (String) responseBody.get("desc");
                    }
                } catch (Exception parseEx) {
                    log.error("Failed to parse error response body", parseEx);
                }
            }

            boolean isDuplicate = false;
            if (code != null && !"00".equals(code)) {
                isDuplicate = desc != null && (
                    desc.toLowerCase().contains("duplicate") ||
                    desc.toLowerCase().contains("tồn tại") ||
                    desc.toLowerCase().contains("trùng") ||
                    desc.toLowerCase().contains("already exists") ||
                    desc.toLowerCase().contains("đã thanh toán")
                );
            }

            if (isDuplicate) {
                log.info("PayOS orderCode {} is duplicate. Regenerating and retrying once.", orderCode);
                Long newCode = generateUniquePayosOrderCode();
                order.setPayosOrderCode(newCode);
                order = orderRepository.save(order);
                orderCode = newCode;

                try {
                    responseBody = callPayOSCreateLink(orderCode, amountVal, description, cancelUrl, returnUrl);
                    if (responseBody != null) {
                        code = (String) responseBody.get("code");
                        desc = (String) responseBody.get("desc");
                    }
                } catch (org.springframework.web.client.HttpClientErrorException ex) {
                    log.error("PayOS API call failed on attempt 2", ex);
                    try {
                        responseBody = new com.fasterxml.jackson.databind.ObjectMapper().readValue(ex.getResponseBodyAsString(), Map.class);
                        if (responseBody != null) {
                            code = (String) responseBody.get("code");
                            desc = (String) responseBody.get("desc");
                        }
                    } catch (Exception parseEx) {
                        log.error("Failed to parse error response body", parseEx);
                    }
                }
            }

            if (responseBody != null && "00".equals(code) && responseBody.get("data") != null) {
                @SuppressWarnings("rawtypes")
                Map dataMap = (Map) responseBody.get("data");

                String payosLinkId = (String) dataMap.get("paymentLinkId");
                String checkoutUrl = (String) dataMap.get("checkoutUrl");
                String qrCode = (String) dataMap.get("qrCode");
                String accountNumber = (String) dataMap.get("accountNumber");
                String accountName = (String) dataMap.get("accountName");

                // Save payment details to order
                order.setPaymentProvider("PAYOS");
                order.setPayosLinkId(payosLinkId);
                order.setPayosCheckoutUrl(checkoutUrl);
                order.setPayosQrCode(qrCode);
                order.setUpdatedAt(LocalDateTime.now());
                orderRepository.save(order);

                return PayOSPaymentLinkData.builder()
                        .orderCode(orderCode)
                        .amount(order.getTotalAmount())
                        .description(description)
                        .checkoutUrl(checkoutUrl)
                        .qrCode(qrCode)
                        .accountNumber(accountNumber)
                        .accountName(accountName)
                        .payosLinkId(payosLinkId)
                        .paymentStatus(order.getPaymentStatus().name())
                        .build();
            } else {
                String errorMsg = desc != null ? desc : "Không thể nhận phản hồi hợp lệ từ cổng thanh toán PayOS";
                log.error("PayOS API returned error code: {}, desc: {}", code, desc);
                throw new CustomException("PayOS API error: " + errorMsg, HttpStatus.BAD_REQUEST);
            }
        } catch (CustomException ce) {
            throw ce;
        } catch (Exception e) {
            log.error("Failed to create PayOS payment link", e);
            throw new CustomException("Lỗi kết nối tới hệ thống PayOS: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private Map<String, Object> callPayOSCreateLink(Long payosOrderCode, long amountVal, String description, String cancelUrl, String returnUrl) throws Exception {
        Map<String, Object> signData = new HashMap<>();
        signData.put("amount", amountVal);
        signData.put("cancelUrl", cancelUrl);
        signData.put("description", description);
        signData.put("orderCode", payosOrderCode);
        signData.put("returnUrl", returnUrl);

        String signature = PayOSSignatureUtil.generateSignature(signData, payOSConfig.getChecksumKey());

        // Build request body
        Map<String, Object> requestBody = new HashMap<>(signData);
        requestBody.put("signature", signature);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-client-id", payOSConfig.getClientId());
        headers.set("x-api-key", payOSConfig.getApiKey());

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        log.info("Sending payment link creation request to PayOS for orderCode: {}", payosOrderCode);
        @SuppressWarnings("rawtypes")
        ResponseEntity<Map> responseEntity = restTemplate.postForEntity(PAYOS_API_URL, entity, Map.class);
        if (responseEntity.getStatusCode() == HttpStatus.OK && responseEntity.getBody() != null) {
            return responseEntity.getBody();
        }
        return null;
    }

    @Transactional
    public Map<String, Object> processPayOSWebhook(PayOSWebhookPayload payload) {
        log.info("Received PayOS Webhook request");

        if (payload == null || payload.getData() == null) {
            log.warn("PayOS webhook request payload is null or empty");
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Payload is null");
            return response;
        }

        PayOSWebhookData webhookData = payload.getData();
        String signature = payload.getSignature();

        // 1. Signature Verification
        Map<String, Object> signData = new HashMap<>();
        signData.put("amount", webhookData.getAmount().longValue());
        signData.put("description", webhookData.getDescription());
        signData.put("orderCode", webhookData.getOrderCode());
        signData.put("accountNumber", webhookData.getAccountNumber());
        signData.put("reference", webhookData.getReference());
        signData.put("transactionDateTime", webhookData.getTransactionDateTime());
        signData.put("currency", webhookData.getCurrency());
        signData.put("paymentLinkId", webhookData.getPaymentLinkId());
        signData.put("code", webhookData.getCode());
        signData.put("desc", webhookData.getDesc());

        // We isolate the validation logic and flag it in case of verification discrepancy
        boolean isSignatureValid = PayOSSignatureUtil.verifyWebhookSignature(signData, signature, payOSConfig.getChecksumKey());
        if (!isSignatureValid) {
            log.error("NEEDS_PAYOS_DOC_CONFIRMATION: Webhook signature verification failed for orderCode: {}", webhookData.getOrderCode());
            // We return 200 to PayOS to avoid retry storm, but we do not update DB state
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Invalid signature");
            return response;
        }

        // 2. Find order by payosOrderCode
        Long payosCode = webhookData.getOrderCode();
        Order order = orderRepository.findByPayosOrderCode(payosCode).orElse(null);
        if (order == null) {
            // fallback to ID check for backwards compatibility with old orders
            order = orderRepository.findById(payosCode.intValue()).orElse(null);
        }

        if (order == null) {
            log.warn("Order not found for webhook orderCode: {}", payosCode);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Order not found");
            return response;
        }

        // 3. Idempotency Check
        if (order.getPaymentStatus() != PaymentStatus.PENDING) {
            log.info("Order: {} payment status already processed: {}", order.getId(), order.getPaymentStatus());
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Already processed");
            return response;
        }

        // 4. Amount Verification
        BigDecimal webhookAmount = webhookData.getAmount();
        if (order.getTotalAmount().compareTo(webhookAmount) != 0) {
            log.error("PAYMENT_SECURITY_RISK: Webhook amount mismatch for order: {}. Expected: {}, Received: {}",
                    order.getId(), order.getTotalAmount(), webhookAmount);
            order.setPaymentStatus(PaymentStatus.FAILED);
            order.setUpdatedAt(LocalDateTime.now());
            orderRepository.save(order);

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Amount mismatch");
            return response;
        }

        // 5. Update status
        if (payload.getSuccess() != null && payload.getSuccess() && "00".equals(webhookData.getCode())) {
            log.info("PayOS payment succeeded for order: {}", order.getId());
            order.setPaymentStatus(PaymentStatus.PAID);
            order.setStatus(OrderStatus.CONFIRMED);
            order.setUpdatedAt(LocalDateTime.now());
            orderRepository.save(order);

            // Publish events
            eventPublisher.publishEvent(new PaymentEvent(this, order.getId(), order.getCustomer().getId(), true));
            eventPublisher.publishEvent(new OrderStatusEvent(this, order.getId(), order.getCustomer().getId(), order.getStore().getOwner().getId(), OrderStatus.CONFIRMED));
        } else {
            log.info("PayOS payment failed/cancelled for order: {}", order.getId());
            order.setPaymentStatus(PaymentStatus.FAILED);
            order.setUpdatedAt(LocalDateTime.now());
            orderRepository.save(order);

            eventPublisher.publishEvent(new PaymentEvent(this, order.getId(), order.getCustomer().getId(), false));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return response;
    }

    private Map<String, Object> queryPayOSPaymentInfo(Long payosOrderCode) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("x-client-id", payOSConfig.getClientId());
            headers.set("x-api-key", payOSConfig.getApiKey());
            
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            String url = PAYOS_API_URL + "/" + payosOrderCode;
            
            log.info("Sending payment status query to PayOS for orderCode: {}", payosOrderCode);
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> responseEntity = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            if (responseEntity.getStatusCode() == HttpStatus.OK && responseEntity.getBody() != null) {
                return responseEntity.getBody();
            }
        } catch (Exception e) {
            log.error("Failed to query PayOS payment status for orderCode: " + payosOrderCode, e);
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private void reconcilePaymentStatus(Order order) {
        if (order.getPayosOrderCode() == null) {
            return;
        }
        Map<String, Object> responseBody = queryPayOSPaymentInfo(order.getPayosOrderCode());
        if (responseBody == null || !"00".equals(responseBody.get("code"))) {
            return;
        }
        Map<String, Object> data = (Map<String, Object>) responseBody.get("data");
        if (data == null) {
            return;
        }
        String status = (String) data.get("status");
        if (status == null) {
            return;
        }

        log.info("Reconciliation status for order {} from PayOS is: {}", order.getId(), status);

        if ("PAID".equals(status)) {
            // Verify amount
            Object amountObj = data.get("amount");
            long remoteAmount = 0;
            if (amountObj instanceof Number) {
                remoteAmount = ((Number) amountObj).longValue();
            } else if (amountObj instanceof String) {
                remoteAmount = Long.parseLong((String) amountObj);
            }

            long localAmount = order.getTotalAmount().longValue();
            if (remoteAmount == localAmount) {
                log.info("Payment verified. Updating order {} payment status to PAID", order.getId());
                order.setPaymentStatus(PaymentStatus.PAID);
                order.setStatus(OrderStatus.CONFIRMED);
                order.setUpdatedAt(LocalDateTime.now());
                orderRepository.save(order);

                // Publish events
                eventPublisher.publishEvent(new PaymentEvent(this, order.getId(), order.getCustomer().getId(), true));
                eventPublisher.publishEvent(new OrderStatusEvent(this, order.getId(), order.getCustomer().getId(), order.getStore().getOwner().getId(), OrderStatus.CONFIRMED));
            } else {
                log.error("PayOS amount mismatch! Local: {}, Remote: {}", localAmount, remoteAmount);
            }
        } else if ("CANCELLED".equals(status)) {
            log.info("Payment cancelled. Updating order {} payment status to FAILED", order.getId());
            order.setPaymentStatus(PaymentStatus.FAILED);
            order.setUpdatedAt(LocalDateTime.now());
            orderRepository.save(order);

            eventPublisher.publishEvent(new PaymentEvent(this, order.getId(), order.getCustomer().getId(), false));
        }
    }

    @Transactional
    public PayOSStatusResponse getPayOSPaymentStatus(Long orderId, String userEmail) {
        // Primary lookup: by GreenLife order.id
        Order order = orderRepository.findById(orderId.intValue()).orElse(null);

        // Fallback: caller may pass payosOrderCode instead of GreenLife orderId
        if (order == null) {
            order = orderRepository.findByPayosOrderCode(orderId).orElse(null);
        }

        if (order == null) {
            throw new CustomException("Đơn hàng không tồn tại", HttpStatus.NOT_FOUND);
        }

        // Enforce ownership
        if (!order.getCustomer().getEmail().equalsIgnoreCase(userEmail)) {
            throw new CustomException("Bạn không có quyền truy cập đơn hàng này", HttpStatus.FORBIDDEN);
        }

        // Query status from PayOS if pending local
        if (order.getPaymentStatus() == PaymentStatus.PENDING) {
            reconcilePaymentStatus(order);
        }

        return PayOSStatusResponse.builder()
                .orderCode(order.getPayosOrderCode() != null ? order.getPayosOrderCode() : order.getId().longValue())
                .paymentStatus(order.getPaymentStatus() != null ? order.getPaymentStatus().name() : null)
                .orderStatus(order.getStatus() != null ? order.getStatus().name() : null)
                .amount(order.getTotalAmount())
                .description("GL" + order.getId())
                .checkoutUrl(order.getPayosCheckoutUrl())
                .qrCode(order.getPayosQrCode())
                .build();
    }
}
