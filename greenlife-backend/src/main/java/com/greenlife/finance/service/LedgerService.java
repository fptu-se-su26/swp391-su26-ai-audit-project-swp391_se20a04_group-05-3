package com.greenlife.finance.service;

import com.greenlife.finance.dto.LedgerJournalCommand;
import com.greenlife.finance.dto.LedgerPostResult;

public interface LedgerService {
    LedgerPostResult postJournal(LedgerJournalCommand command);
}
