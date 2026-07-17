package com.greenlife.finance.entity.enums;

import lombok.Getter;

@Getter
public enum FinancialAccountCode {
    PLATFORM_CASH(FinancialAccountOwnerType.PLATFORM, false),
    PLATFORM_COMMISSION_REVENUE(FinancialAccountOwnerType.PLATFORM, false),
    PLATFORM_PROMOTION_EXPENSE(FinancialAccountOwnerType.PLATFORM, false),
    STORE_PAYABLE_PENDING(FinancialAccountOwnerType.STORE, true),
    STORE_PAYABLE_AVAILABLE(FinancialAccountOwnerType.STORE, true),
    STORE_PAYABLE_RESERVED(FinancialAccountOwnerType.STORE, true),
    STORE_COMMISSION_RECEIVABLE(FinancialAccountOwnerType.PLATFORM, true);

    private final FinancialAccountOwnerType ownerType;
    private final boolean storeIdRequired;

    FinancialAccountCode(FinancialAccountOwnerType ownerType, boolean storeIdRequired) {
        this.ownerType = ownerType;
        this.storeIdRequired = storeIdRequired;
    }

    public boolean isStoreIdAllowed() {
        return true; // storeId is allowed for all account codes
    }
}
