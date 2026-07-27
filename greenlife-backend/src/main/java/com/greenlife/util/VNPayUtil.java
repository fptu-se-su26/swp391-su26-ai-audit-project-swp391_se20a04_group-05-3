package com.greenlife.util;

import com.greenlife.order.entity.Order;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

public class VNPayUtil {

    public static String generatePaymentUrl(
            Order order,
            String ipAddress,
            String tmnCode,
            String hashSecret,
            String payUrl,
            String returnUrl
    ) {
        Map<String, String> vnpParams = new HashMap<>();
        vnpParams.put("vnp_Version", "2.1.0");
        vnpParams.put("vnp_Command", "pay");
        vnpParams.put("vnp_TmnCode", tmnCode);
        
        // Amount must be multiplied by 100 for VNPay (VND cents)
        BigDecimal amount = order.getTotalAmount().multiply(new BigDecimal("100")).setScale(0);
        vnpParams.put("vnp_Amount", amount.toString());
        
        vnpParams.put("vnp_CurrCode", "VND");
        
        // Transaction reference should include order ID and a timestamp to avoid duplicates in VNPay sandbox
        String txnRef = order.getId() + "_" + System.currentTimeMillis();
        vnpParams.put("vnp_TxnRef", txnRef);
        
        vnpParams.put("vnp_OrderInfo", "Thanh toan don hang " + order.getId());
        vnpParams.put("vnp_OrderType", "other");
        vnpParams.put("vnp_Locale", "vn");
        vnpParams.put("vnp_ReturnUrl", returnUrl);
        vnpParams.put("vnp_IpAddr", (ipAddress == null || ipAddress.isEmpty()) ? "127.0.0.1" : ipAddress);
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        vnpParams.put("vnp_CreateDate", formatter.format(LocalDateTime.now()));

        // Sort parameters alphabetically by key
        List<String> fieldNames = new ArrayList<>(vnpParams.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnpParams.get(fieldName);
            if ((fieldValue != null) && (!fieldValue.isEmpty())) {
                // Build hash data
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                // Build query
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII));
                query.append('=');
                query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));

                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }

        String queryUrl = query.toString();
        String secureHash = hmacSHA512(hashSecret, hashData.toString());
        queryUrl += "&vnp_SecureHash=" + secureHash;

        return payUrl + "?" + queryUrl;
    }

    public static boolean verifyCallbackSignature(Map<String, String> fields, String hashSecret) {
        String secureHash = fields.get("vnp_SecureHash");
        if (secureHash == null) {
            return false;
        }

        // Remove hash parameters before computing local signature
        Map<String, String> signedFields = new HashMap<>(fields);
        signedFields.remove("vnp_SecureHash");
        signedFields.remove("vnp_SecureHashType");

        List<String> fieldNames = new ArrayList<>(signedFields.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = signedFields.get(fieldName);
            if ((fieldValue != null) && (!fieldValue.isEmpty())) {
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                if (itr.hasNext()) {
                    hashData.append('&');
                }
            }
        }

        String localHash = hmacSHA512(hashSecret, hashData.toString());
        return localHash.equalsIgnoreCase(secureHash);
    }

    public static String hmacSHA512(final String key, final String data) {
        try {
            if (key == null || data == null) {
                return "";
            }
            final Mac hmac512 = Mac.getInstance("HmacSHA512");
            byte[] hmacKeyBytes = key.getBytes(StandardCharsets.UTF_8);
            final SecretKeySpec secretKey = new SecretKeySpec(hmacKeyBytes, "HmacSHA512");
            hmac512.init(secretKey);
            byte[] dataBytes = data.getBytes(StandardCharsets.UTF_8);
            byte[] result = hmac512.doFinal(dataBytes);
            StringBuilder sb = new StringBuilder(2 * result.length);
            for (byte b : result) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception ex) {
            return "";
        }
    }
}
