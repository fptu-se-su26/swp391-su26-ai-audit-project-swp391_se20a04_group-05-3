package com.greenlife.finance.dto;

import org.junit.jupiter.api.Test;
import java.util.ArrayList;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class LedgerJournalCommandTest {

    @Test
    void testNullPostingsBecomesEmptyList() {
        LedgerJournalCommand command = new LedgerJournalCommand(
                "PAYMENT_PAID", "REF:123", null, null, null, null, null, null, "desc", 1, null
        );
        assertNotNull(command.postings());
        assertTrue(command.postings().isEmpty());
    }

    @Test
    void testCallerMutationDoesNotAffectCommand() {
        List<LedgerPostingCommand> mutableList = new ArrayList<>();
        LedgerJournalCommand command = new LedgerJournalCommand(
                "PAYMENT_PAID", "REF:123", null, null, null, null, null, null, "desc", 1, mutableList
        );
        
        mutableList.add(null);
        
        assertTrue(command.postings().isEmpty());
    }

    @Test
    void testCommandPostingsThrowsOnMutation() {
        List<LedgerPostingCommand> postings = List.of();
        LedgerJournalCommand command = new LedgerJournalCommand(
                "PAYMENT_PAID", "REF:123", null, null, null, null, null, null, "desc", 1, postings
        );
        
        assertThrows(UnsupportedOperationException.class, () -> command.postings().add(null));
    }

    @Test
    void testListContainingNullPostingCanBeConstructed() {
        List<LedgerPostingCommand> postings = new ArrayList<>();
        postings.add(null);
        
        LedgerJournalCommand command = new LedgerJournalCommand(
                "PAYMENT_PAID", "REF:123", null, null, null, null, null, null, "desc", 1, postings
        );
        
        assertNotNull(command.postings());
        assertEquals(1, command.postings().size());
        assertNull(command.postings().get(0));
    }
}
