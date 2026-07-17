package com.greenlife.finance.service;

import com.greenlife.finance.dto.LedgerJournalCommand;
import com.greenlife.finance.dto.LedgerPostingCommand;
import com.greenlife.finance.entity.enums.FinancialAccountCode;
import com.greenlife.finance.entity.enums.FinancialAccountOwnerType;
import com.greenlife.finance.entity.enums.FinancialCurrency;
import com.greenlife.finance.exception.FinanceValidationException;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class LedgerCommandValidatorTest {

    private final LedgerCommandValidator validator = new LedgerCommandValidator();

    private LedgerJournalCommand createValidBaseline() {
        List<LedgerPostingCommand> postings = List.of(
                new LedgerPostingCommand(
                        FinancialAccountCode.PLATFORM_CASH,
                        FinancialAccountOwnerType.PLATFORM,
                        null,
                        null,
                        new BigDecimal("100"),
                        BigDecimal.ZERO,
                        FinancialCurrency.VND
                ),
                new LedgerPostingCommand(
                        FinancialAccountCode.PLATFORM_COMMISSION_REVENUE,
                        FinancialAccountOwnerType.PLATFORM,
                        null,
                        null,
                        BigDecimal.ZERO,
                        new BigDecimal("100"),
                        FinancialCurrency.VND
                )
        );

        return new LedgerJournalCommand(
                "PAYMENT_PAID",
                "PAYMENT_PAID:123",
                null, null, null, null, null, null,
                "Valid description",
                1,
                postings
        );
    }

    @Test
    void testValidBaselineSucceeds() {
        assertDoesNotThrow(() -> validator.validate(createValidBaseline()));
    }

    @Test
    void testNullCommandRejected() {
        assertThrows(FinanceValidationException.class, () -> validator.validate(null));
    }

    @Test
    void testInvalidBusinessEventTypeRejected() {
        LedgerJournalCommand command = new LedgerJournalCommand(
                "payment_paid", "PAYMENT_PAID:123", null, null, null, null, null, null, "desc", 1, createValidBaseline().postings()
        );
        assertThrows(FinanceValidationException.class, () -> validator.validate(command));

        LedgerJournalCommand command2 = new LedgerJournalCommand(
                " PAYMENT_PAID", "PAYMENT_PAID:123", null, null, null, null, null, null, "desc", 1, createValidBaseline().postings()
        );
        assertThrows(FinanceValidationException.class, () -> validator.validate(command2));
    }

    @Test
    void testOverLengthBusinessEventTypeRejected() {
        String longEventType = "A".repeat(51);
        LedgerJournalCommand command = new LedgerJournalCommand(
                longEventType, "PAYMENT_PAID:123", null, null, null, null, null, null, "desc", 1, createValidBaseline().postings()
        );
        assertThrows(FinanceValidationException.class, () -> validator.validate(command));
    }

    @Test
    void testInvalidBusinessReferenceRejected() {
        LedgerJournalCommand command = new LedgerJournalCommand(
                "PAYMENT_PAID", "payment_paid:123", null, null, null, null, null, null, "desc", 1, createValidBaseline().postings()
        );
        assertThrows(FinanceValidationException.class, () -> validator.validate(command));

        LedgerJournalCommand command2 = new LedgerJournalCommand(
                "PAYMENT_PAID", " PAYMENT_PAID:123", null, null, null, null, null, null, "desc", 1, createValidBaseline().postings()
        );
        assertThrows(FinanceValidationException.class, () -> validator.validate(command2));
    }

    @Test
    void testOverLengthBusinessReferenceRejected() {
        String longReference = "A".repeat(151);
        LedgerJournalCommand command = new LedgerJournalCommand(
                "PAYMENT_PAID", longReference, null, null, null, null, null, null, "desc", 1, createValidBaseline().postings()
        );
        assertThrows(FinanceValidationException.class, () -> validator.validate(command));
    }

    @Test
    void testValidBusinessIdentifiersAccepted() {
        LedgerJournalCommand cmd1 = new LedgerJournalCommand(
                "PAYMENT_PAID", "PAYMENT_PAID:123", null, null, null, null, null, null, "desc", 1, createValidBaseline().postings()
        );
        assertDoesNotThrow(() -> validator.validate(cmd1));

        LedgerJournalCommand cmd2 = new LedgerJournalCommand(
                "ORDER_EARNINGS_RELEASED", "ORDER_EARNINGS_RELEASED:456", null, null, null, null, null, null, "desc", 1, createValidBaseline().postings()
        );
        assertDoesNotThrow(() -> validator.validate(cmd2));

        LedgerJournalCommand cmd3 = new LedgerJournalCommand(
                "COD_PAYMENT_COLLECTED", "COD_PAYMENT_COLLECTED:789", null, null, null, null, null, null, "desc", 1, createValidBaseline().postings()
        );
        assertDoesNotThrow(() -> validator.validate(cmd3));
    }

    @Test
    void testOverLengthDescriptionRejected() {
        String longDesc = "A".repeat(501);
        LedgerJournalCommand command = new LedgerJournalCommand(
                "PAYMENT_PAID", "PAYMENT_PAID:123", null, null, null, null, null, null, longDesc, 1, createValidBaseline().postings()
        );
        assertThrows(FinanceValidationException.class, () -> validator.validate(command));
    }

    @Test
    void testOptionalIdsRejectedWhenNonPositive() {
        assertThrows(FinanceValidationException.class, () -> validator.validate(new LedgerJournalCommand(
                "PAYMENT_PAID", "PAYMENT_PAID:123", 0, null, null, null, null, null, "desc", 1, createValidBaseline().postings()
        )));
        assertThrows(FinanceValidationException.class, () -> validator.validate(new LedgerJournalCommand(
                "PAYMENT_PAID", "PAYMENT_PAID:123", -5, null, null, null, null, null, "desc", 1, createValidBaseline().postings()
        )));
        assertThrows(FinanceValidationException.class, () -> validator.validate(new LedgerJournalCommand(
                "PAYMENT_PAID", "PAYMENT_PAID:123", null, 0, null, null, null, null, "desc", 1, createValidBaseline().postings()
        )));
        assertThrows(FinanceValidationException.class, () -> validator.validate(new LedgerJournalCommand(
                "PAYMENT_PAID", "PAYMENT_PAID:123", null, null, 0, null, null, null, "desc", 1, createValidBaseline().postings()
        )));
        assertThrows(FinanceValidationException.class, () -> validator.validate(new LedgerJournalCommand(
                "PAYMENT_PAID", "PAYMENT_PAID:123", null, null, null, 0, null, null, "desc", 1, createValidBaseline().postings()
        )));
        assertThrows(FinanceValidationException.class, () -> validator.validate(new LedgerJournalCommand(
                "PAYMENT_PAID", "PAYMENT_PAID:123", null, null, null, null, 0, null, "desc", 1, createValidBaseline().postings()
        )));
        assertThrows(FinanceValidationException.class, () -> validator.validate(new LedgerJournalCommand(
                "PAYMENT_PAID", "PAYMENT_PAID:123", null, null, null, null, null, null, "desc", 0, createValidBaseline().postings()
        )));
        assertThrows(FinanceValidationException.class, () -> validator.validate(new LedgerJournalCommand(
                "PAYMENT_PAID", "PAYMENT_PAID:123", null, null, null, null, null, 0L, "desc", 1, createValidBaseline().postings()
        )));
    }

    @Test
    void testNullOptionalIdsAccepted() {
        LedgerJournalCommand command = new LedgerJournalCommand(
                "PAYMENT_PAID", "PAYMENT_PAID:123", null, null, null, null, null, null, null, null, createValidBaseline().postings()
        );
        assertDoesNotThrow(() -> validator.validate(command));
    }

    @Test
    void testFewerThanTwoPostingsRejected() {
        LedgerJournalCommand command = new LedgerJournalCommand(
                "PAYMENT_PAID", "PAYMENT_PAID:123", null, null, null, null, null, null, "desc", 1,
                List.of(createValidBaseline().postings().get(0))
        );
        assertThrows(FinanceValidationException.class, () -> validator.validate(command));
    }

    @Test
    void testNullPostingElementThrowsFinanceValidationException() {
        List<LedgerPostingCommand> list = new ArrayList<>();
        list.add(createValidBaseline().postings().get(0));
        list.add(null);

        LedgerJournalCommand command = new LedgerJournalCommand(
                "PAYMENT_PAID", "PAYMENT_PAID:123", null, null, null, null, null, null, "desc", 1, list
        );
        assertThrows(FinanceValidationException.class, () -> validator.validate(command));
    }

    @Test
    void testNullAccountCodeRejected() {
        List<LedgerPostingCommand> list = List.of(
                new LedgerPostingCommand(null, FinancialAccountOwnerType.PLATFORM, null, null, new BigDecimal("100"), BigDecimal.ZERO, FinancialCurrency.VND),
                createValidBaseline().postings().get(1)
        );
        LedgerJournalCommand command = new LedgerJournalCommand(
                "PAYMENT_PAID", "PAYMENT_PAID:123", null, null, null, null, null, null, "desc", 1, list
        );
        assertThrows(FinanceValidationException.class, () -> validator.validate(command));
    }

    @Test
    void testNullOwnerTypeRejected() {
        List<LedgerPostingCommand> list = List.of(
                new LedgerPostingCommand(FinancialAccountCode.PLATFORM_CASH, null, null, null, new BigDecimal("100"), BigDecimal.ZERO, FinancialCurrency.VND),
                createValidBaseline().postings().get(1)
        );
        LedgerJournalCommand command = new LedgerJournalCommand(
                "PAYMENT_PAID", "PAYMENT_PAID:123", null, null, null, null, null, null, "desc", 1, list
        );
        assertThrows(FinanceValidationException.class, () -> validator.validate(command));
    }

    @Test
    void testNonVndCurrencyRejected() {
        List<LedgerPostingCommand> list = List.of(
                new LedgerPostingCommand(FinancialAccountCode.PLATFORM_CASH, FinancialAccountOwnerType.PLATFORM, null, null, new BigDecimal("100"), BigDecimal.ZERO, null),
                createValidBaseline().postings().get(1)
        );
        LedgerJournalCommand command = new LedgerJournalCommand(
                "PAYMENT_PAID", "PAYMENT_PAID:123", null, null, null, null, null, null, "desc", 1, list
        );
        assertThrows(FinanceValidationException.class, () -> validator.validate(command));
    }

    @Test
    void testNullAmountsRejected() {
        List<LedgerPostingCommand> list = List.of(
                new LedgerPostingCommand(FinancialAccountCode.PLATFORM_CASH, FinancialAccountOwnerType.PLATFORM, null, null, null, BigDecimal.ZERO, FinancialCurrency.VND),
                createValidBaseline().postings().get(1)
        );
        LedgerJournalCommand command = new LedgerJournalCommand(
                "PAYMENT_PAID", "PAYMENT_PAID:123", null, null, null, null, null, null, "desc", 1, list
        );
        assertThrows(FinanceValidationException.class, () -> validator.validate(command));
    }

    @Test
    void testNegativeAmountRejected() {
        List<LedgerPostingCommand> list = List.of(
                new LedgerPostingCommand(FinancialAccountCode.PLATFORM_CASH, FinancialAccountOwnerType.PLATFORM, null, null, new BigDecimal("-10"), BigDecimal.ZERO, FinancialCurrency.VND),
                createValidBaseline().postings().get(1)
        );
        LedgerJournalCommand command = new LedgerJournalCommand(
                "PAYMENT_PAID", "PAYMENT_PAID:123", null, null, null, null, null, null, "desc", 1, list
        );
        assertThrows(FinanceValidationException.class, () -> validator.validate(command));
    }

    @Test
    void testBothDebitAndCreditPositiveRejected() {
        List<LedgerPostingCommand> list = List.of(
                new LedgerPostingCommand(FinancialAccountCode.PLATFORM_CASH, FinancialAccountOwnerType.PLATFORM, null, null, new BigDecimal("10"), new BigDecimal("10"), FinancialCurrency.VND),
                createValidBaseline().postings().get(1)
        );
        LedgerJournalCommand command = new LedgerJournalCommand(
                "PAYMENT_PAID", "PAYMENT_PAID:123", null, null, null, null, null, null, "desc", 1, list
        );
        assertThrows(FinanceValidationException.class, () -> validator.validate(command));
    }

    @Test
    void testBothSidesZeroRejected() {
        List<LedgerPostingCommand> list = List.of(
                new LedgerPostingCommand(FinancialAccountCode.PLATFORM_CASH, FinancialAccountOwnerType.PLATFORM, null, null, BigDecimal.ZERO, BigDecimal.ZERO, FinancialCurrency.VND),
                createValidBaseline().postings().get(1)
        );
        LedgerJournalCommand command = new LedgerJournalCommand(
                "PAYMENT_PAID", "PAYMENT_PAID:123", null, null, null, null, null, null, "desc", 1, list
        );
        assertThrows(FinanceValidationException.class, () -> validator.validate(command));
    }

    @Test
    void testFractionalVndRejected() {
        List<LedgerPostingCommand> list = List.of(
                new LedgerPostingCommand(FinancialAccountCode.PLATFORM_CASH, FinancialAccountOwnerType.PLATFORM, null, null, new BigDecimal("100.5"), BigDecimal.ZERO, FinancialCurrency.VND),
                new LedgerPostingCommand(FinancialAccountCode.PLATFORM_COMMISSION_REVENUE, FinancialAccountOwnerType.PLATFORM, null, null, BigDecimal.ZERO, new BigDecimal("100.5"), FinancialCurrency.VND)
        );
        LedgerJournalCommand command = new LedgerJournalCommand(
                "PAYMENT_PAID", "PAYMENT_PAID:123", null, null, null, null, null, null, "desc", 1, list
        );
        assertThrows(FinanceValidationException.class, () -> validator.validate(command));
    }

    @Test
    void testIntegralDecimalsAccepted() {
        List<LedgerPostingCommand> list = List.of(
                new LedgerPostingCommand(FinancialAccountCode.PLATFORM_CASH, FinancialAccountOwnerType.PLATFORM, null, null, new BigDecimal("100.00"), BigDecimal.ZERO, FinancialCurrency.VND),
                new LedgerPostingCommand(FinancialAccountCode.PLATFORM_COMMISSION_REVENUE, FinancialAccountOwnerType.PLATFORM, null, null, BigDecimal.ZERO, new BigDecimal("100.0"), FinancialCurrency.VND)
        );
        LedgerJournalCommand command = new LedgerJournalCommand(
                "PAYMENT_PAID", "PAYMENT_PAID:123", null, null, null, null, null, null, "desc", 1, list
        );
        assertDoesNotThrow(() -> validator.validate(command));
    }

    @Test
    void testMaxVndAmountEnforced() {
        BigDecimal maxVal = new BigDecimal("999999999999");
        BigDecimal overMaxVal = new BigDecimal("1000000000000");

        List<LedgerPostingCommand> validList = List.of(
                new LedgerPostingCommand(FinancialAccountCode.PLATFORM_CASH, FinancialAccountOwnerType.PLATFORM, null, null, maxVal, BigDecimal.ZERO, FinancialCurrency.VND),
                new LedgerPostingCommand(FinancialAccountCode.PLATFORM_COMMISSION_REVENUE, FinancialAccountOwnerType.PLATFORM, null, null, BigDecimal.ZERO, maxVal, FinancialCurrency.VND)
        );
        assertDoesNotThrow(() -> validator.validate(new LedgerJournalCommand("PAYMENT_PAID", "PAYMENT_PAID:123", null, null, null, null, null, null, "desc", 1, validList)));

        List<LedgerPostingCommand> invalidList = List.of(
                new LedgerPostingCommand(FinancialAccountCode.PLATFORM_CASH, FinancialAccountOwnerType.PLATFORM, null, null, overMaxVal, BigDecimal.ZERO, FinancialCurrency.VND),
                new LedgerPostingCommand(FinancialAccountCode.PLATFORM_COMMISSION_REVENUE, FinancialAccountOwnerType.PLATFORM, null, null, BigDecimal.ZERO, overMaxVal, FinancialCurrency.VND)
        );
        assertThrows(FinanceValidationException.class, () -> validator.validate(new LedgerJournalCommand("PAYMENT_PAID", "PAYMENT_PAID:123", null, null, null, null, null, null, "desc", 1, invalidList)));
    }

    @Test
    void testOwnerTypeMismatchRejected() {
        List<LedgerPostingCommand> list = List.of(
                new LedgerPostingCommand(FinancialAccountCode.PLATFORM_CASH, FinancialAccountOwnerType.STORE, 1, 1, new BigDecimal("100"), BigDecimal.ZERO, FinancialCurrency.VND),
                createValidBaseline().postings().get(1)
        );
        LedgerJournalCommand command = new LedgerJournalCommand(
                "PAYMENT_PAID", "PAYMENT_PAID:123", null, null, null, null, null, null, "desc", 1, list
        );
        assertThrows(FinanceValidationException.class, () -> validator.validate(command));
    }

    @Test
    void testPlatformAccountWithOwnerIdRejected() {
        List<LedgerPostingCommand> list = List.of(
                new LedgerPostingCommand(FinancialAccountCode.PLATFORM_CASH, FinancialAccountOwnerType.PLATFORM, 999, null, new BigDecimal("100"), BigDecimal.ZERO, FinancialCurrency.VND),
                createValidBaseline().postings().get(1)
        );
        LedgerJournalCommand command = new LedgerJournalCommand(
                "PAYMENT_PAID", "PAYMENT_PAID:123", null, null, null, null, null, null, "desc", 1, list
        );
        assertThrows(FinanceValidationException.class, () -> validator.validate(command));
    }

    @Test
    void testStoreAccountValidationRules() {
        // STORE account without storeId
        List<LedgerPostingCommand> list1 = List.of(
                new LedgerPostingCommand(FinancialAccountCode.STORE_PAYABLE_AVAILABLE, FinancialAccountOwnerType.STORE, 1, null, new BigDecimal("100"), BigDecimal.ZERO, FinancialCurrency.VND),
                createValidBaseline().postings().get(1)
        );
        assertThrows(FinanceValidationException.class, () -> validator.validate(new LedgerJournalCommand("PAYMENT_PAID", "PAYMENT_PAID:1", null, null, null, null, null, null, "desc", 1, list1)));

        // STORE account without accountOwnerId
        List<LedgerPostingCommand> list2 = List.of(
                new LedgerPostingCommand(FinancialAccountCode.STORE_PAYABLE_AVAILABLE, FinancialAccountOwnerType.STORE, null, 1, new BigDecimal("100"), BigDecimal.ZERO, FinancialCurrency.VND),
                createValidBaseline().postings().get(1)
        );
        assertThrows(FinanceValidationException.class, () -> validator.validate(new LedgerJournalCommand("PAYMENT_PAID", "PAYMENT_PAID:2", null, null, null, null, null, null, "desc", 1, list2)));

        // STORE accountOwnerId different from storeId
        List<LedgerPostingCommand> list3 = List.of(
                new LedgerPostingCommand(FinancialAccountCode.STORE_PAYABLE_AVAILABLE, FinancialAccountOwnerType.STORE, 2, 1, new BigDecimal("100"), BigDecimal.ZERO, FinancialCurrency.VND),
                createValidBaseline().postings().get(1)
        );
        assertThrows(FinanceValidationException.class, () -> validator.validate(new LedgerJournalCommand("PAYMENT_PAID", "PAYMENT_PAID:3", null, null, null, null, null, null, "desc", 1, list3)));
    }

    @Test
    void testStoreCommissionReceivableRules() {
        // STORE_COMMISSION_RECEIVABLE without storeId
        List<LedgerPostingCommand> list1 = List.of(
                new LedgerPostingCommand(FinancialAccountCode.STORE_COMMISSION_RECEIVABLE, FinancialAccountOwnerType.PLATFORM, null, null, new BigDecimal("100"), BigDecimal.ZERO, FinancialCurrency.VND),
                createValidBaseline().postings().get(1)
        );
        assertThrows(FinanceValidationException.class, () -> validator.validate(new LedgerJournalCommand("PAYMENT_PAID", "PAYMENT_PAID:1", null, null, null, null, null, null, "desc", 1, list1)));

        // STORE_COMMISSION_RECEIVABLE with positive storeId and PLATFORM owner is accepted
        List<LedgerPostingCommand> list2 = List.of(
                new LedgerPostingCommand(FinancialAccountCode.STORE_COMMISSION_RECEIVABLE, FinancialAccountOwnerType.PLATFORM, null, 5, new BigDecimal("100"), BigDecimal.ZERO, FinancialCurrency.VND),
                new LedgerPostingCommand(FinancialAccountCode.PLATFORM_COMMISSION_REVENUE, FinancialAccountOwnerType.PLATFORM, null, null, BigDecimal.ZERO, new BigDecimal("100"), FinancialCurrency.VND)
        );
        assertDoesNotThrow(() -> validator.validate(new LedgerJournalCommand("PAYMENT_PAID", "PAYMENT_PAID:2", null, null, null, null, null, null, "desc", 1, list2)));
    }

    @Test
    void testPlatformAccountsAllowNullStoreId() {
        List<LedgerPostingCommand> list = List.of(
                new LedgerPostingCommand(FinancialAccountCode.PLATFORM_CASH, FinancialAccountOwnerType.PLATFORM, null, null, new BigDecimal("100"), BigDecimal.ZERO, FinancialCurrency.VND),
                new LedgerPostingCommand(FinancialAccountCode.PLATFORM_COMMISSION_REVENUE, FinancialAccountOwnerType.PLATFORM, null, null, BigDecimal.ZERO, new BigDecimal("100"), FinancialCurrency.VND)
        );
        assertDoesNotThrow(() -> validator.validate(new LedgerJournalCommand("PAYMENT_PAID", "PAYMENT_PAID:1", null, null, null, null, null, null, "desc", 1, list)));
    }

    @Test
    void testPlatformAccountsRejectNonPositiveStoreId() {
        List<LedgerPostingCommand> list = List.of(
                new LedgerPostingCommand(FinancialAccountCode.PLATFORM_CASH, FinancialAccountOwnerType.PLATFORM, null, -1, new BigDecimal("100"), BigDecimal.ZERO, FinancialCurrency.VND),
                createValidBaseline().postings().get(1)
        );
        assertThrows(FinanceValidationException.class, () -> validator.validate(new LedgerJournalCommand("PAYMENT_PAID", "PAYMENT_PAID:1", null, null, null, null, null, null, "desc", 1, list)));
    }

    @Test
    void testUnbalancedJournalRejected() {
        List<LedgerPostingCommand> list = List.of(
                new LedgerPostingCommand(FinancialAccountCode.PLATFORM_CASH, FinancialAccountOwnerType.PLATFORM, null, null, new BigDecimal("100"), BigDecimal.ZERO, FinancialCurrency.VND),
                new LedgerPostingCommand(FinancialAccountCode.PLATFORM_COMMISSION_REVENUE, FinancialAccountOwnerType.PLATFORM, null, null, BigDecimal.ZERO, new BigDecimal("99"), FinancialCurrency.VND)
        );
        assertThrows(FinanceValidationException.class, () -> validator.validate(new LedgerJournalCommand("PAYMENT_PAID", "PAYMENT_PAID:1", null, null, null, null, null, null, "desc", 1, list)));
    }

    @Test
    void testZeroTotalDebitRejected() {
        // Sum is balanced but it's zero
        List<LedgerPostingCommand> list = List.of(
                new LedgerPostingCommand(FinancialAccountCode.PLATFORM_CASH, FinancialAccountOwnerType.PLATFORM, null, null, BigDecimal.ZERO, BigDecimal.ZERO, FinancialCurrency.VND),
                new LedgerPostingCommand(FinancialAccountCode.PLATFORM_COMMISSION_REVENUE, FinancialAccountOwnerType.PLATFORM, null, null, BigDecimal.ZERO, BigDecimal.ZERO, FinancialCurrency.VND)
        );
        // Wait, LedgerCommandValidator requires exactly one side to be positive, so a posting with both sides 0 is already rejected at posting level.
        assertThrows(FinanceValidationException.class, () -> validator.validate(new LedgerJournalCommand("PAYMENT_PAID", "PAYMENT_PAID:1", null, null, null, null, null, null, "desc", 1, list)));
    }

    @Test
    void testBalancedPostingsWithDifferentScalesAccepted() {
        List<LedgerPostingCommand> list = List.of(
                new LedgerPostingCommand(FinancialAccountCode.PLATFORM_CASH, FinancialAccountOwnerType.PLATFORM, null, null, new BigDecimal("100.00"), BigDecimal.ZERO, FinancialCurrency.VND),
                new LedgerPostingCommand(FinancialAccountCode.PLATFORM_COMMISSION_REVENUE, FinancialAccountOwnerType.PLATFORM, null, null, BigDecimal.ZERO, new BigDecimal("100"), FinancialCurrency.VND)
        );
        assertDoesNotThrow(() -> validator.validate(new LedgerJournalCommand("PAYMENT_PAID", "PAYMENT_PAID:1", null, null, null, null, null, null, "desc", 1, list)));
    }
}
