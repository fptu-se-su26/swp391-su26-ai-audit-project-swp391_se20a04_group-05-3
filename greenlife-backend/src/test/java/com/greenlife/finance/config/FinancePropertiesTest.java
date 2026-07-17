package com.greenlife.finance.config;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.*;

class FinancePropertiesTest {

    @Test
    void testDisabledFailsClosed() {
        FinanceProperties props = new FinanceProperties();
        props.setEnabled(false);
        props.setSettlementMode(FinanceSettlementMode.PLATFORM_RECEIVES);
        props.setDefaultCommissionRateRaw("0.1");

        assertThrows(IllegalStateException.class, props::assertPostingConfigured);
    }

    @Test
    void testEnabledWithUnconfirmedFails() {
        FinanceProperties props = new FinanceProperties();
        props.setEnabled(true);
        props.setSettlementMode(FinanceSettlementMode.UNCONFIRMED);
        props.setDefaultCommissionRateRaw("0.1");

        assertThrows(IllegalStateException.class, props::assertPostingConfigured);
    }

    @Test
    void testEnabledWithMissingCommissionRateFails() {
        FinanceProperties props = new FinanceProperties();
        props.setEnabled(true);
        props.setSettlementMode(FinanceSettlementMode.PLATFORM_RECEIVES);
        props.setDefaultCommissionRateRaw(null);

        assertThrows(IllegalStateException.class, props::assertPostingConfigured);
    }

    @Test
    void testEnabledWithBlankCommissionRateFails() {
        FinanceProperties props = new FinanceProperties();
        props.setEnabled(true);
        props.setSettlementMode(FinanceSettlementMode.PLATFORM_RECEIVES);
        props.setDefaultCommissionRateRaw("   ");

        assertThrows(IllegalStateException.class, props::assertPostingConfigured);
    }

    @Test
    void testEnabledWithNonNumericCommissionRateFailsSafely() {
        FinanceProperties props = new FinanceProperties();
        props.setEnabled(true);
        props.setSettlementMode(FinanceSettlementMode.PLATFORM_RECEIVES);
        props.setDefaultCommissionRateRaw("not-a-number");

        assertThrows(IllegalStateException.class, props::assertPostingConfigured);
    }

    @Test
    void testEnabledWithNegativeCommissionRateFails() {
        FinanceProperties props = new FinanceProperties();
        props.setEnabled(true);
        props.setSettlementMode(FinanceSettlementMode.PLATFORM_RECEIVES);
        props.setDefaultCommissionRateRaw("-0.05");

        assertThrows(IllegalStateException.class, props::assertPostingConfigured);
    }

    @Test
    void testEnabledWithRateGreaterThanOneFails() {
        FinanceProperties props = new FinanceProperties();
        props.setEnabled(true);
        props.setSettlementMode(FinanceSettlementMode.PLATFORM_RECEIVES);
        props.setDefaultCommissionRateRaw("1.01");

        assertThrows(IllegalStateException.class, props::assertPostingConfigured);
    }

    @Test
    void testZeroCommissionRateSucceeds() {
        FinanceProperties props = new FinanceProperties();
        props.setEnabled(true);
        props.setSettlementMode(FinanceSettlementMode.PLATFORM_RECEIVES);
        props.setDefaultCommissionRateRaw("0");

        assertDoesNotThrow(props::assertPostingConfigured);
        assertEquals(0, props.getDefaultCommissionRate().compareTo(BigDecimal.ZERO));
    }

    @Test
    void testOneCommissionRateSucceeds() {
        FinanceProperties props = new FinanceProperties();
        props.setEnabled(true);
        props.setSettlementMode(FinanceSettlementMode.PLATFORM_RECEIVES);
        props.setDefaultCommissionRateRaw("1");

        assertDoesNotThrow(props::assertPostingConfigured);
        assertEquals(0, props.getDefaultCommissionRate().compareTo(BigDecimal.ONE));
    }

    @Test
    void testValidCommissionRateSucceeds() {
        FinanceProperties props = new FinanceProperties();
        props.setEnabled(true);
        props.setSettlementMode(FinanceSettlementMode.PLATFORM_RECEIVES);
        props.setDefaultCommissionRateRaw("0.1000");

        assertDoesNotThrow(props::assertPostingConfigured);
        assertEquals(0, props.getDefaultCommissionRate().compareTo(new BigDecimal("0.1")));
    }

    @Test
    void testPlatformReceivesSucceeds() {
        FinanceProperties props = new FinanceProperties();
        props.setEnabled(true);
        props.setSettlementMode(FinanceSettlementMode.PLATFORM_RECEIVES);
        props.setDefaultCommissionRateRaw("0.2");

        assertDoesNotThrow(props::assertPostingConfigured);
    }

    @Test
    void testStoreReceivesSucceeds() {
        FinanceProperties props = new FinanceProperties();
        props.setEnabled(true);
        props.setSettlementMode(FinanceSettlementMode.STORE_RECEIVES);
        props.setDefaultCommissionRateRaw("0.15");

        assertDoesNotThrow(props::assertPostingConfigured);
    }
}
