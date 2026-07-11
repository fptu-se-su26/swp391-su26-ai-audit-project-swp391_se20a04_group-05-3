package com.greenlife.payment.payos;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.*;

public class PayOSSignatureUtil {

    public static String generateSignature(Map<String, Object> data, String checksumKey) throws Exception {
        String sortedDataString = getSortedDataString(data);
        return hmacSHA256(sortedDataString, checksumKey);
    }

    public static boolean verifyWebhookSignature(Map<String, Object> data, String signature, String checksumKey) {
        try {
            String calculatedSignature = generateSignature(data, checksumKey);
            return calculatedSignature.equalsIgnoreCase(signature);
        } catch (Exception e) {
            return false;
        }
    }

    public static String getSortedDataString(Map<String, Object> data) {
        List<String> sortedKeys = new ArrayList<>(data.keySet());
        Collections.sort(sortedKeys);

        StringBuilder sb = new StringBuilder();
        for (String key : sortedKeys) {
            Object val = data.get(key);
            if (val != null) {
                if (sb.length() > 0) {
                    sb.append("&");
                }
                sb.append(key).append("=").append(val.toString());
            }
        }
        return sb.toString();
    }

    public static String hmacSHA256(String data, String key) throws Exception {
        SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(secretKeySpec);
        byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        for (byte b : rawHmac) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
