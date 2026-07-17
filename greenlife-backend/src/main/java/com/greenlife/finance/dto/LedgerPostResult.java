package com.greenlife.finance.dto;

public record LedgerPostResult(
    Long journalId,
    String businessReference,
    boolean created
) {}
