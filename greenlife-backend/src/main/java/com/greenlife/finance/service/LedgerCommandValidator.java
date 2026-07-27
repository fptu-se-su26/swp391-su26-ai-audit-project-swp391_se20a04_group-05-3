package com.greenlife.finance.service;

import com.greenlife.finance.dto.LedgerJournalCommand;
import com.greenlife.finance.dto.LedgerPostingCommand;
import com.greenlife.finance.entity.enums.FinancialAccountCode;
import com.greenlife.finance.entity.enums.FinancialAccountOwnerType;
import com.greenlife.finance.entity.enums.FinancialCurrency;
import com.greenlife.finance.exception.FinanceValidationException;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.regex.Pattern;

@Component
public class LedgerCommandValidator {

    private static final BigDecimal MAX_VND_AMOUNT = new BigDecimal("999999999999");

    private static final Pattern BUSINESS_EVENT_TYPE_PATTERN = Pattern.compile("^[A-Z][A-Z0-9_]{0,49}$");
    private static final Pattern BUSINESS_REFERENCE_PATTERN = Pattern.compile("^[A-Z0-9][A-Z0-9:_-]{0,149}$");

    public void validate(LedgerJournalCommand command) {
        if (command == null) {
            throw new FinanceValidationException("Ledger journal command must not be null.");
        }

        // Validate businessEventType
        if (command.businessEventType() == null) {
            throw new FinanceValidationException("Business event type must not be null.");
        }
        if (!BUSINESS_EVENT_TYPE_PATTERN.matcher(command.businessEventType()).matches()) {
            throw new FinanceValidationException("Business event type is not in canonical format.");
        }

        // Validate businessReference
        if (command.businessReference() == null) {
            throw new FinanceValidationException("Business reference must not be null.");
        }
        if (!BUSINESS_REFERENCE_PATTERN.matcher(command.businessReference()).matches()) {
            throw new FinanceValidationException("Business reference is not in canonical format.");
        }

        // Validate description
        if (command.description() != null && command.description().length() > 500) {
            throw new FinanceValidationException("Description length must be at most 500 characters.");
        }

        // Validate optional numeric IDs
        validateOptionalPositiveId(command.orderId(), "Order ID");
        validateOptionalPositiveId(command.paymentTransactionId(), "Payment Transaction ID");
        validateOptionalPositiveId(command.refundId(), "Refund ID");
        validateOptionalPositiveId(command.payoutId(), "Payout ID");
        validateOptionalPositiveId(command.promotionId(), "Promotion ID");
        validateOptionalPositiveId(command.createdBy(), "Created By user ID");
        validateOptionalPositiveLongId(command.reversalOfJournalId(), "Reversal journal ID");

        // Validate postings list
        if (command.postings() == null || command.postings().size() < 2) {
            throw new FinanceValidationException("Journal must contain at least two postings.");
        }

        BigDecimal totalDebit = BigDecimal.ZERO;
        BigDecimal totalCredit = BigDecimal.ZERO;

        for (LedgerPostingCommand posting : command.postings()) {
            validatePosting(posting);
            totalDebit = totalDebit.add(posting.debitAmount());
            totalCredit = totalCredit.add(posting.creditAmount());
        }

        // Validate journal balance
        if (totalDebit.compareTo(BigDecimal.ZERO) <= 0) {
            throw new FinanceValidationException("Total debit amount must be greater than zero.");
        }
        if (totalDebit.compareTo(totalCredit) != 0) {
            throw new FinanceValidationException("Journal is unbalanced. Total debits must equal total credits.");
        }
    }

    private void validatePosting(LedgerPostingCommand posting) {
        if (posting == null) {
            throw new FinanceValidationException("Posting must not be null.");
        }

        if (posting.accountCode() == null) {
            throw new FinanceValidationException("Account code must not be null.");
        }

        if (posting.accountOwnerType() == null) {
            throw new FinanceValidationException("Account owner type must not be null.");
        }

        if (posting.currency() != FinancialCurrency.VND) {
            throw new FinanceValidationException("Currency must be VND.");
        }

        // Validate amounts non-null
        if (posting.debitAmount() == null || posting.creditAmount() == null) {
            throw new FinanceValidationException("Debit and credit amounts must not be null.");
        }

        // Validate amounts non-negative
        if (posting.debitAmount().compareTo(BigDecimal.ZERO) < 0 || posting.creditAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new FinanceValidationException("Debit and credit amounts must not be negative.");
        }

        // Validate DECIMAL(12,0) upper bound
        if (posting.debitAmount().compareTo(MAX_VND_AMOUNT) > 0) {
            throw new FinanceValidationException("Debit amount exceeds maximum allowed value.");
        }
        if (posting.creditAmount().compareTo(MAX_VND_AMOUNT) > 0) {
            throw new FinanceValidationException("Credit amount exceeds maximum allowed value.");
        }

        boolean isDebitPositive = posting.debitAmount().compareTo(BigDecimal.ZERO) > 0;
        boolean isCreditPositive = posting.creditAmount().compareTo(BigDecimal.ZERO) > 0;

        if (isDebitPositive && isCreditPositive) {
            throw new FinanceValidationException("A posting cannot have both positive debit and credit amounts.");
        }
        if (!isDebitPositive && !isCreditPositive) {
            throw new FinanceValidationException("A posting must have exactly one positive side (debit or credit).");
        }

        // Validate fractional VND
        if (posting.debitAmount().remainder(BigDecimal.ONE).compareTo(BigDecimal.ZERO) != 0) {
            throw new FinanceValidationException("Fractional debit amount is not allowed in VND.");
        }
        if (posting.creditAmount().remainder(BigDecimal.ONE).compareTo(BigDecimal.ZERO) != 0) {
            throw new FinanceValidationException("Fractional credit amount is not allowed in VND.");
        }

        // Validate accountOwnerType matches accountCode configuration
        if (posting.accountOwnerType() != posting.accountCode().getOwnerType()) {
            throw new FinanceValidationException("Account owner type does not match account code configuration.");
        }

        // Owner consistency rules
        if (posting.accountCode() == FinancialAccountCode.STORE_COMMISSION_RECEIVABLE) {
            if (posting.accountOwnerId() != null) {
                throw new FinanceValidationException("Platform-owned account must not have owner ID.");
            }
            if (posting.storeId() == null || posting.storeId() <= 0) {
                throw new FinanceValidationException("Store commission receivable requires a positive store ID.");
            }
        } else if (posting.accountOwnerType() == FinancialAccountOwnerType.PLATFORM) {
            if (posting.accountOwnerId() != null) {
                throw new FinanceValidationException("Platform-owned account must not have owner ID.");
            }
            if (posting.storeId() != null && posting.storeId() <= 0) {
                throw new FinanceValidationException("Store ID must be positive if present on platform-owned account.");
            }
        } else if (posting.accountOwnerType() == FinancialAccountOwnerType.STORE) {
            if (posting.storeId() == null || posting.storeId() <= 0) {
                throw new FinanceValidationException("Store-owned account requires a positive store ID.");
            }
            if (posting.accountOwnerId() == null) {
                throw new FinanceValidationException("Store-owned account requires an owner ID.");
            }
            if (!posting.accountOwnerId().equals(posting.storeId())) {
                throw new FinanceValidationException("Store-owned account owner ID must equal store ID.");
            }
        }
    }

    private void validateOptionalPositiveId(Integer id, String name) {
        if (id != null && id <= 0) {
            throw new FinanceValidationException(name + " must be positive.");
        }
    }

    private void validateOptionalPositiveLongId(Long id, String name) {
        if (id != null && id <= 0) {
            throw new FinanceValidationException(name + " must be positive.");
        }
    }
}
