package com.greenlife.payment.entity.converter;

import com.greenlife.payment.entity.enums.PaymentStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class PaymentStatusConverter implements AttributeConverter<PaymentStatus, String> {

    @Override
    public String convertToDatabaseColumn(PaymentStatus status) {
        if (status == null) {
            return null;
        }
        switch (status) {
            case PENDING:
                return "UNPAID";
            case PAID:
                return "PAID";
            case FAILED:
                return "FAILED";
            case REFUNDED:
                return "REFUNDED";
            default:
                throw new IllegalArgumentException("Unknown PaymentStatus: " + status);
        }
    }

    @Override
    public PaymentStatus convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        switch (dbData) {
            case "UNPAID":
                return PaymentStatus.PENDING;
            case "PAID":
                return PaymentStatus.PAID;
            case "FAILED":
                return PaymentStatus.FAILED;
            case "REFUNDED":
                return PaymentStatus.REFUNDED;
            default:
                // Fallback for security/compatibility
                return PaymentStatus.PENDING;
        }
    }
}
