package com.greenlife.finance.dto;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public record LedgerJournalCommand(
    String businessEventType,
    String businessReference,
    Integer orderId,
    Integer paymentTransactionId,
    Integer refundId,
    Integer payoutId,
    Integer promotionId,
    Long reversalOfJournalId,
    String description,
    Integer createdBy,
    List<LedgerPostingCommand> postings
) {
    public LedgerJournalCommand {
        if (postings == null) {
            postings = List.of();
        } else {
            postings = Collections.unmodifiableList(new ArrayList<>(postings));
        }
    }
}
