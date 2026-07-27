package com.greenlife.finance.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import java.math.BigDecimal;

@Configuration
@Getter
@Setter
public class FinanceProperties {

    @Value("${greenlife.finance.enabled:false}")
    private boolean enabled;

    @Value("${greenlife.finance.settlement-mode:UNCONFIRMED}")
    private FinanceSettlementMode settlementMode;

    @Value("${greenlife.finance.default-commission-rate:#{null}}")
    private String defaultCommissionRateRaw;

    public BigDecimal getDefaultCommissionRate() {
        if (defaultCommissionRateRaw == null || defaultCommissionRateRaw.trim().isEmpty()) {
            return null;
        }
        try {
            return new BigDecimal(defaultCommissionRateRaw.trim());
        } catch (NumberFormatException e) {
            throw new IllegalStateException("Invalid finance default-commission-rate format: " + defaultCommissionRateRaw, e);
        }
    }

    public void assertPostingConfigured() {
        if (!enabled) {
            throw new IllegalStateException("Finance posting is disabled (greenlife.finance.enabled is false).");
        }
        if (settlementMode == FinanceSettlementMode.UNCONFIRMED) {
            throw new IllegalStateException("Finance settlement mode is UNCONFIRMED.");
        }
        BigDecimal rate = getDefaultCommissionRate();
        if (rate == null) {
            throw new IllegalStateException("Finance default-commission-rate is required when finance is enabled.");
        }
        if (rate.compareTo(BigDecimal.ZERO) < 0 || rate.compareTo(BigDecimal.ONE) > 0) {
            throw new IllegalStateException("Finance default-commission-rate must be between 0.0 and 1.0, found: " + rate);
        }
    }
}
