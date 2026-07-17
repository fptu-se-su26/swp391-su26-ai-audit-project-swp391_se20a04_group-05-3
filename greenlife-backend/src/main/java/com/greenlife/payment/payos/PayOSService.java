package com.greenlife.payment.payos;

import com.greenlife.exception.CustomException;
import com.greenlife.order.repository.OrderRepository;
import com.greenlife.payment.payos.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

import com.greenlife.payment.service.PaymentAttemptLifecycleService;
import com.greenlife.payment.service.PayOSStatusReconciliationService;
import com.greenlife.payment.service.PayOSWebhookRegistrationService;
import com.greenlife.payment.service.PayOSWebhookProcessingService;
import com.greenlife.payment.service.internal.PreparedPaymentAttempt;
import com.greenlife.payment.service.internal.PreparedPaymentStatusQuery;
import org.springframework.dao.DataIntegrityViolationException;

@Service
@RequiredArgsConstructor
@Slf4j
public class PayOSService {

    private final OrderRepository orderRepository;
    private final PayOSConfig payOSConfig;
    private final PaymentAttemptLifecycleService paymentAttemptLifecycleService;
    private final PayOSStatusReconciliationService statusReconciliationService;
    private final PayOSWebhookRegistrationService webhookRegistrationService;
    private final PayOSWebhookProcessingService webhookProcessingService;
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

    public PayOSPaymentLinkData createPayOSPaymentLink(Integer orderId, String userEmail) {
        // Validate PayOS configuration keys (fail fast)
        if (payOSConfig.getClientId() == null || payOSConfig.getClientId().isBlank() ||
            payOSConfig.getApiKey() == null || payOSConfig.getApiKey().isBlank() ||
            payOSConfig.getChecksumKey() == null || payOSConfig.getChecksumKey().isBlank()) {
            throw new CustomException("Cổng thanh toán PayOS chưa được cấu hình đầy đủ thông tin", HttpStatus.SERVICE_UNAVAILABLE);
        }

        // 1. Prepare payment attempt (Transaction A)
        PreparedPaymentAttempt attempt = paymentAttemptLifecycleService.preparePayOSAttempt(orderId, userEmail);

        // 2. If reusable pending attempt exists, return it immediately (idempotent)
        if (attempt.reuseExistingLink()) {
            return PayOSPaymentLinkData.builder()
                    .orderCode(attempt.providerOrderCode())
                    .amount(attempt.amount())
                    .description("GL" + attempt.orderId())
                    .checkoutUrl(attempt.existingCheckoutUrl())
                    .qrCode(attempt.existingQrCode())
                    .payosLinkId(attempt.existingPaymentLinkId())
                    .paymentStatus("PENDING")
                    .build();
        }

        // 3. Make the API Call outside of the transaction block
        Long orderCode = attempt.providerOrderCode();
        long amountVal = attempt.amount().longValue();
        String description = "GL" + attempt.orderId();
        String cancelUrl = payOSConfig.getCancelUrl();
        String returnUrl = payOSConfig.getReturnUrl();

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
        } catch (Exception e) {
            log.error("Unexpected PayOS link generation error", e);
            paymentAttemptLifecycleService.markPayOSAttemptFailed(attempt.transactionId(), "NETWORK_ERROR", e.getMessage());
            throw new CustomException("Lỗi kết nối tới hệ thống PayOS: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
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
            log.info("PayOS orderCode {} is duplicate. Transitioning original attempt {} to FAILED and retrying once.", orderCode, attempt.transactionId());
            
            // Mark the original CREATED attempt as FAILED
            paymentAttemptLifecycleService.markPayOSAttemptFailed(attempt.transactionId(), "PROVIDER_ORDER_CODE_CONFLICT", "Duplicate order code returned by provider: " + desc);

            // Prepare a new attempt (Transaction A retry)
            attempt = paymentAttemptLifecycleService.preparePayOSAttempt(orderId, userEmail);
            orderCode = attempt.providerOrderCode();

            try {
                responseBody = callPayOSCreateLink(orderCode, amountVal, description, cancelUrl, returnUrl);
                if (responseBody != null) {
                    code = (String) responseBody.get("code");
                    desc = (String) responseBody.get("desc");
                }
            } catch (org.springframework.web.client.HttpClientErrorException ex) {
                log.error("PayOS API call failed on retry attempt 2", ex);
                try {
                    responseBody = new com.fasterxml.jackson.databind.ObjectMapper().readValue(ex.getResponseBodyAsString(), Map.class);
                    if (responseBody != null) {
                        code = (String) responseBody.get("code");
                        desc = (String) responseBody.get("desc");
                    }
                } catch (Exception parseEx) {
                    log.error("Failed to parse error response body on retry", parseEx);
                }
            } catch (Exception e) {
                log.error("Unexpected PayOS retry link generation error", e);
                paymentAttemptLifecycleService.markPayOSAttemptFailed(attempt.transactionId(), "NETWORK_ERROR", e.getMessage());
                throw new CustomException("Lỗi kết nối tới hệ thống PayOS: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
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

            if (payosLinkId == null || checkoutUrl == null) {
                paymentAttemptLifecycleService.markPayOSAttemptFailed(attempt.transactionId(), "INVALID_PROVIDER_RESPONSE", "Missing payment link ID or checkout URL from provider response");
                throw new CustomException("Không thể nhận phản hồi hợp lệ từ cổng thanh toán PayOS", HttpStatus.BAD_REQUEST);
            }

            // 4. Mark payment attempt pending (Transaction B)
            paymentAttemptLifecycleService.markPayOSAttemptPending(
                attempt.transactionId(),
                orderCode,
                payosLinkId,
                checkoutUrl,
                qrCode,
                null // reference is unknown at link creation time
            );

            return PayOSPaymentLinkData.builder()
                    .orderCode(orderCode)
                    .amount(attempt.amount())
                    .description(description)
                    .checkoutUrl(checkoutUrl)
                    .qrCode(qrCode)
                    .accountNumber(accountNumber)
                    .accountName(accountName)
                    .payosLinkId(payosLinkId)
                    .paymentStatus("PENDING")
                    .build();
        } else {
            String errorMsg = desc != null ? desc : "Không thể nhận phản hồi hợp lệ từ cổng thanh toán PayOS";
            log.error("PayOS API returned error code: {}, desc: {}", code, desc);
            paymentAttemptLifecycleService.markPayOSAttemptFailed(attempt.transactionId(), "PROVIDER_ERROR_" + code, errorMsg);
            throw new CustomException("PayOS API error: " + errorMsg, HttpStatus.BAD_REQUEST);
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

    public Map<String, Object> processPayOSWebhook(PayOSWebhookPayload payload) {
        log.info("Received PayOS Webhook request");

        // 1. Structural validation — before any DB work
        if (payload == null || payload.getData() == null) {
            log.warn("PayOS webhook payload is null or missing data block");
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Payload is null");
            return response;
        }

        PayOSWebhookData webhookData = payload.getData();
        String signature = payload.getSignature();

        // 2. Build signed fields map (deterministic field set, no secret included)
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

        // 3. Signature validation — must succeed before fingerprint or any DB operation
        boolean isSignatureValid = PayOSSignatureUtil.verifyWebhookSignature(signData, signature, payOSConfig.getChecksumKey());
        if (!isSignatureValid) {
            log.error("Webhook signature verification failed for orderCode: [INTERNAL:{}]", webhookData.getOrderCode());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Invalid signature");
            return response;
        }

        // 4. Compute deterministic canonical fingerprint (SHA-256, no secret, no raw payload log)
        String payloadHash = PayOSSignatureUtil.computeCanonicalFingerprint(signData);

        // 5. Register event — uses REQUIRES_NEW so unique-constraint violation surfaces cleanly
        Long eventId;
        try {
            eventId = webhookRegistrationService.registerNewEvent(
                    payloadHash,
                    null, // no proven provider event ID field in current PayOSWebhookData
                    webhookData.getOrderCode(),
                    webhookData.getPaymentLinkId(),
                    webhookData.getReference()
            );
        } catch (DataIntegrityViolationException dive) {
            // Duplicate delivery — find the first registrant outside the failed inner transaction
            var existingOpt = webhookRegistrationService.findExistingByPayloadHash(payloadHash);
            if (existingOpt.isEmpty()) {
                // Not a duplicate — rethrow; do not swallow unrelated DB errors
                log.error("Webhook registration failed and no existing event found by hash. Rethrowing.");
                throw dive;
            }
            eventId = existingOpt.get().getId();
            log.info("Duplicate webhook delivery detected; reusing existing event {}.", eventId);
        }

        // 6. Process the registered event — all state mutations happen inside that @Transactional boundary
        webhookProcessingService.processRegisteredEvent(eventId, payload);

        // 7. Return unchanged provider-compatible response
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return response;
    }

    /**
     * Queries the PayOS provider for the payment status of a given order code.
     * <p>
     * MUST be called outside any active database transaction.
     * Returns the raw provider response body map on success (code "00", non-null data),
     * or null on provider timeout/5xx/network ambiguity.
     * Does NOT throw on provider error — caller must handle null gracefully.
     * Does NOT log API keys or raw response body.
     * </p>
     *
     * @param payosOrderCode the PayOS order code to query
     * @return the parsed {@code data} map from the provider response, or null on failure
     */
    @SuppressWarnings("unchecked")
    Map<String, Object> queryPayOSPaymentInfo(Long payosOrderCode) {
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
                Map<String, Object> responseBody = responseEntity.getBody();
                // Only return the data map when provider code is "00"
                if ("00".equals(responseBody.get("code"))) {
                    Object dataObj = responseBody.get("data");
                    if (dataObj instanceof Map) {
                        return (Map<String, Object>) dataObj;
                    }
                }
                // Provider returned non-00 code — treat as temporary provider error
                log.warn("PayOS status query returned non-00 code for orderCode: {}", payosOrderCode);
            }
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            // 404 or other 4xx from PayOS
            if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
                // Return a synthetic data map with a terminal status so caller can map NOT_FOUND
                log.warn("PayOS status query returned 404 for orderCode: {}", payosOrderCode);
                return java.util.Collections.singletonMap("status", "NOT_FOUND");
            }
            log.warn("PayOS status query HTTP client error for orderCode: {} — status {}", payosOrderCode, e.getStatusCode());
        } catch (Exception e) {
            // Timeout / 5xx / network ambiguity — do NOT change local status
            log.error("PayOS status query network error for orderCode: {}", payosOrderCode);
        }
        return null;
    }

    /**
     * Returns the current PayOS payment status for the given order.
     * <p>
     * Transaction boundary: this method is NOT @Transactional. It orchestrates:
     * <ol>
     *   <li>prepareStatusQuery — read-only tx, commits before network.</li>
     *   <li>queryPayOSPaymentInfo — outside any transaction.</li>
     *   <li>applyProviderStatus — write tx, after network returns.</li>
     * </ol>
     * The existing PayOSStatusResponse API shape is preserved unchanged.
     * </p>
     */
    public PayOSStatusResponse getPayOSPaymentStatus(Long suppliedId, String userEmail) {
        // Phase 1: read-only transaction — resolves and validates, then commits
        PreparedPaymentStatusQuery context = statusReconciliationService.prepareStatusQuery(suppliedId, userEmail);

        // Fast path: already locally PAID — return without network call
        if (context.locallyPaid()) {
            log.info("Order {} is locally PAID; returning cached PAID status without provider GET.", context.orderId());
            return buildStatusResponse(context, "PAID", "CONFIRMED");
        }

        // Phase 2: PayOS GET — outside any database transaction
        Map<String, Object> providerData = queryPayOSPaymentInfo(context.providerOrderCode());

        if (providerData == null) {
            // Provider timeout/5xx/network ambiguity — do not change local status; return current state
            log.warn("Provider query returned null for orderCode: {}. Returning current local state.", context.providerOrderCode());
            return buildStatusResponse(context,
                    context.legacyPaymentStatus() != null ? context.legacyPaymentStatus() : "PENDING",
                    context.legacyOrderStatus());
        }

        // Handle provider NOT_FOUND: for CREATED/PENDING attempt, treat as terminal only if definitive
        String rawStatus = (String) providerData.get("status");
        if ("NOT_FOUND".equals(rawStatus)) {
            // 404 from PayOS — treat as FAILED/CANCELLED only for CREATED to unblock retry
            if (context.phase8Tracked()) {
                // Delegate so CREATED → FAILED releases future create-link retry; PENDING stays PENDING for safety
                statusReconciliationService.applyProviderStatus(context, java.util.Collections.singletonMap("status", "FAILED"));
            }
            return buildStatusResponse(context,
                    context.legacyPaymentStatus() != null ? context.legacyPaymentStatus() : "PENDING",
                    context.legacyOrderStatus());
        }

        // Phase 3: write transaction — apply provider status under lock
        try {
            statusReconciliationService.applyProviderStatus(context, providerData);
        } catch (Exception e) {
            // Reconciliation error — return current local state; do not expose internals
            log.error("Error applying provider status for order {}: {}", context.orderId(), e.getMessage());
            return buildStatusResponse(context,
                    context.legacyPaymentStatus() != null ? context.legacyPaymentStatus() : "PENDING",
                    context.legacyOrderStatus());
        }

        // Re-read final state from provider data for response construction
        // The applyProviderStatus has already committed; return updated status from provider data
        String appliedStatus = (rawStatus != null) ? rawStatus : (context.legacyPaymentStatus() != null ? context.legacyPaymentStatus() : "PENDING");
        String appliedOrderStatus = "PAID".equals(appliedStatus) ? "CONFIRMED" : context.legacyOrderStatus();

        return buildStatusResponse(context, appliedStatus, appliedOrderStatus);
    }

    /**
     * Constructs the existing PayOSStatusResponse API shape from prepared context and resolved status strings.
     * Does not expose PaymentTransaction internals.
     */
    private PayOSStatusResponse buildStatusResponse(PreparedPaymentStatusQuery context,
                                                     String paymentStatus, String orderStatus) {
        return PayOSStatusResponse.builder()
                .orderCode(context.providerOrderCode() != null ? context.providerOrderCode() : context.orderId().longValue())
                .paymentStatus(paymentStatus)
                .orderStatus(orderStatus)
                .amount(context.expectedAmount())
                .description("GL" + context.orderId())
                .checkoutUrl(context.checkoutUrl())
                .qrCode(context.qrCode())
                .build();
    }
}
