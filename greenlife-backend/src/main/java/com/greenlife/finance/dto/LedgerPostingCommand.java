package com.greenlife.finance.dto;

import com.greenlife.finance.entity.enums.FinancialAccountCode;
import com.greenlife.finance.entity.enums.FinancialAccountOwnerType;
import com.greenlife.finance.entity.enums.FinancialCurrency;
import java.math.BigDecimal;

public record LedgerPostingCommand(
    FinancialAccountCode accountCode,
    FinancialAccountOwnerType accountOwnerType,
    Integer accountOwnerId,
    Integer storeId,
    BigDecimal debitAmount,
    BigDecimal creditAmount,
    FinancialCurrency currency
) {}
