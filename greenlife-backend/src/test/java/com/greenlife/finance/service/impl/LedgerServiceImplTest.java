package com.greenlife.finance.service.impl;

import com.greenlife.finance.config.FinanceProperties;
import com.greenlife.finance.dto.LedgerJournalCommand;
import com.greenlife.finance.dto.LedgerPostResult;
import com.greenlife.finance.dto.LedgerPostingCommand;
import com.greenlife.finance.entity.FinancialJournal;
import com.greenlife.finance.entity.FinancialPosting;
import com.greenlife.finance.entity.Payout;
import com.greenlife.finance.entity.Refund;
import com.greenlife.finance.entity.enums.FinancialAccountCode;
import com.greenlife.finance.entity.enums.FinancialAccountOwnerType;
import com.greenlife.finance.entity.enums.FinancialCurrency;
import com.greenlife.finance.exception.FinanceValidationException;
import com.greenlife.finance.exception.LedgerIdempotencyConflictException;
import com.greenlife.finance.repository.FinancialJournalRepository;
import com.greenlife.finance.repository.FinancialPostingRepository;
import com.greenlife.finance.repository.PayoutRepository;
import com.greenlife.finance.repository.RefundRepository;
import com.greenlife.finance.service.LedgerCommandValidator;
import com.greenlife.order.entity.Order;
import com.greenlife.order.repository.OrderRepository;
import com.greenlife.payment.entity.PaymentTransaction;
import com.greenlife.payment.repository.PaymentTransactionRepository;
import com.greenlife.promotion.entity.Promotion;
import com.greenlife.promotion.repository.PromotionRepository;
import com.greenlife.store.entity.Store;
import com.greenlife.store.repository.StoreRepository;
import com.greenlife.user.entity.User;
import com.greenlife.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionStatus;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LedgerServiceImplTest {

    @Mock private FinancialJournalRepository journalRepository;
    @Mock private FinancialPostingRepository postingRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private PaymentTransactionRepository paymentTransactionRepository;
    @Mock private RefundRepository refundRepository;
    @Mock private PayoutRepository payoutRepository;
    @Mock private PromotionRepository promotionRepository;
    @Mock private UserRepository userRepository;
    @Mock private StoreRepository storeRepository;
    @Mock private FinanceProperties financeProperties;
    @Spy private LedgerCommandValidator validator = new LedgerCommandValidator();

    @Mock private PlatformTransactionManager transactionManager;
    @Mock private TransactionStatus writeStatus;
    @Mock private TransactionStatus readOnlyStatus;

    private LedgerServiceImpl ledgerService;

    @BeforeEach
    void setUp() {
        ledgerService = new LedgerServiceImpl(
                validator,
                financeProperties,
                journalRepository,
                postingRepository,
                orderRepository,
                paymentTransactionRepository,
                refundRepository,
                payoutRepository,
                promotionRepository,
                userRepository,
                storeRepository,
                transactionManager
        );

        // Configure default transaction manager behaviors
        lenient().when(transactionManager.getTransaction(any(TransactionDefinition.class)))
                .thenAnswer(invocation -> {
                    TransactionDefinition def = invocation.getArgument(0);
                    if (def.isReadOnly()) {
                        return readOnlyStatus;
                    } else {
                        return writeStatus;
                    }
                });
    }

    private LedgerJournalCommand createValidCommand() {
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
                null,
                postings
        );
    }

    @Test
    void testValidatorRunsBeforeTransactionAndFailsClosed() {
        LedgerJournalCommand invalidCommand = new LedgerJournalCommand(
                "invalid_event_type", "REF", null, null, null, null, null, null, "desc", 1, List.of()
        );

        assertThrows(FinanceValidationException.class, () -> ledgerService.postJournal(invalidCommand));

        verify(validator).validate(invalidCommand);
        verifyNoInteractions(transactionManager);
        verifyNoInteractions(journalRepository);
    }

    @Test
    void testFinancePropertiesAssertBeforeTransactionAndFailsClosed() {
        LedgerJournalCommand command = createValidCommand();
        doThrow(new IllegalStateException("Finance disabled")).when(financeProperties).assertPostingConfigured();

        assertThrows(IllegalStateException.class, () -> ledgerService.postJournal(command));

        verify(financeProperties).assertPostingConfigured();
        verifyNoInteractions(transactionManager);
        verifyNoInteractions(journalRepository);
    }

    @Test
    void testReversalOfJournalIdRejectedBeforeTransaction() {
        LedgerJournalCommand command = new LedgerJournalCommand(
                "PAYMENT_PAID", "PAYMENT_PAID:123", null, null, null, null, null, 99L, "desc", 1, createValidCommand().postings()
        );

        assertThrows(FinanceValidationException.class, () -> ledgerService.postJournal(command));

        verifyNoInteractions(transactionManager);
        verifyNoInteractions(journalRepository);
    }

    @Test
    void testNewJournalCreationSuccessful() {
        LedgerJournalCommand command = createValidCommand();
        doNothing().when(financeProperties).assertPostingConfigured();

        // Setup save mock to simulate database assigning ID
        when(journalRepository.save(any(FinancialJournal.class))).thenAnswer(inv -> {
            FinancialJournal j = inv.getArgument(0);
            j.setId(10L);
            return j;
        });

        LedgerPostResult result = ledgerService.postJournal(command);

        assertTrue(result.created());
        assertEquals(10L, result.journalId());
        assertEquals("PAYMENT_PAID:123", result.businessReference());

        InOrder inOrder = inOrder(journalRepository, postingRepository, transactionManager);
        inOrder.verify(transactionManager).getTransaction(argThat(def -> 
            def.getPropagationBehavior() == TransactionDefinition.PROPAGATION_REQUIRES_NEW && !def.isReadOnly()
        ));
        inOrder.verify(journalRepository).save(any(FinancialJournal.class));
        inOrder.verify(journalRepository).flush();
        inOrder.verify(postingRepository, times(2)).save(any(FinancialPosting.class));
        inOrder.verify(postingRepository).flush();
        inOrder.verify(transactionManager).commit(writeStatus);
    }

    @Test
    void testMissingReferencedEntityThrowsAndRollsBack() {
        List<LedgerPostingCommand> postings = createValidCommand().postings();
        LedgerJournalCommand command = new LedgerJournalCommand(
                "PAYMENT_PAID", "PAYMENT_PAID:123", 999, null, null, null, null, null, "desc", 1, postings
        );

        doNothing().when(financeProperties).assertPostingConfigured();
        when(orderRepository.findById(999)).thenReturn(Optional.empty());

        assertThrows(FinanceValidationException.class, () -> ledgerService.postJournal(command));

        verify(transactionManager).rollback(writeStatus);
        verify(journalRepository, never()).save(any());
    }

    @Test
    void testEntityResolutionAndRepeatedStoreIdCached() {
        Store store = new Store();
        store.setId(5);

        List<LedgerPostingCommand> postings = List.of(
                new LedgerPostingCommand(
                        FinancialAccountCode.STORE_PAYABLE_AVAILABLE,
                        FinancialAccountOwnerType.STORE,
                        5,
                        5,
                        new BigDecimal("100"),
                        BigDecimal.ZERO,
                        FinancialCurrency.VND
                ),
                new LedgerPostingCommand(
                        FinancialAccountCode.STORE_COMMISSION_RECEIVABLE,
                        FinancialAccountOwnerType.PLATFORM,
                        null,
                        5,
                        BigDecimal.ZERO,
                        new BigDecimal("100"),
                        FinancialCurrency.VND
                )
        );

        LedgerJournalCommand command = new LedgerJournalCommand(
                "PAYMENT_PAID", "PAYMENT_PAID:123", null, null, null, null, null, null, "desc", null, postings
        );

        doNothing().when(financeProperties).assertPostingConfigured();
        when(storeRepository.findById(5)).thenReturn(Optional.of(store));

        LedgerPostResult result = ledgerService.postJournal(command);

        assertTrue(result.created());
        verify(storeRepository, times(1)).findById(5);
        verify(transactionManager).commit(writeStatus);
    }

    @Test
    void testExistingEquivalentJournalReturnsCreatedFalse() {
        LedgerJournalCommand command = createValidCommand();
        doNothing().when(financeProperties).assertPostingConfigured();

        FinancialJournal existingJournal = FinancialJournal.builder()
                .id(15L)
                .businessEventType("PAYMENT_PAID")
                .businessReference("PAYMENT_PAID:123")
                .description("Valid description")
                .createdBy(null)
                .build();

        List<FinancialPosting> existingPostings = List.of(
                FinancialPosting.builder()
                        .accountCode("PLATFORM_CASH")
                        .accountOwnerType(FinancialAccountOwnerType.PLATFORM)
                        .debitAmount(new BigDecimal("100"))
                        .creditAmount(BigDecimal.ZERO)
                        .currency(FinancialCurrency.VND)
                        .build(),
                FinancialPosting.builder()
                        .accountCode("PLATFORM_COMMISSION_REVENUE")
                        .accountOwnerType(FinancialAccountOwnerType.PLATFORM)
                        .debitAmount(BigDecimal.ZERO)
                        .creditAmount(new BigDecimal("100"))
                        .currency(FinancialCurrency.VND)
                        .build()
        );

        when(journalRepository.findByBusinessReference("PAYMENT_PAID:123")).thenReturn(Optional.of(existingJournal));
        when(postingRepository.findByJournalIdOrderByIdAsc(15L)).thenReturn(existingPostings);

        LedgerPostResult result = ledgerService.postJournal(command);

        assertFalse(result.created());
        assertEquals(15L, result.journalId());
        verify(journalRepository, never()).save(any());
        verify(postingRepository, never()).save(any());
        verify(transactionManager).commit(writeStatus);
    }

    @Test
    void testExistingConflictingJournalThrowsConflict() {
        LedgerJournalCommand command = createValidCommand();
        doNothing().when(financeProperties).assertPostingConfigured();

        FinancialJournal existingJournal = FinancialJournal.builder()
                .id(15L)
                .businessEventType("PAYMENT_PAID")
                .businessReference("PAYMENT_PAID:123")
                .description("DIFFERENT DESCRIPTION")
                .build();

        when(journalRepository.findByBusinessReference("PAYMENT_PAID:123")).thenReturn(Optional.of(existingJournal));

        assertThrows(LedgerIdempotencyConflictException.class, () -> ledgerService.postJournal(command));
        verify(transactionManager).rollback(writeStatus);
    }

    @Test
    void testPostingOrderAndDecimalScalesRemainEquivalent() {
        // Command has credit, then debit
        List<LedgerPostingCommand> postings = List.of(
                new LedgerPostingCommand(
                        FinancialAccountCode.PLATFORM_COMMISSION_REVENUE,
                        FinancialAccountOwnerType.PLATFORM,
                        null,
                        null,
                        BigDecimal.ZERO,
                        new BigDecimal("100.00"),
                        FinancialCurrency.VND
                ),
                new LedgerPostingCommand(
                        FinancialAccountCode.PLATFORM_CASH,
                        FinancialAccountOwnerType.PLATFORM,
                        null,
                        null,
                        new BigDecimal("100"),
                        BigDecimal.ZERO,
                        FinancialCurrency.VND
                )
        );

        LedgerJournalCommand command = new LedgerJournalCommand(
                "PAYMENT_PAID", "PAYMENT_PAID:123", null, null, null, null, null, null, "Valid description", null, postings
        );

        doNothing().when(financeProperties).assertPostingConfigured();

        FinancialJournal existingJournal = FinancialJournal.builder()
                .id(15L)
                .businessEventType("PAYMENT_PAID")
                .businessReference("PAYMENT_PAID:123")
                .description("Valid description")
                .build();

        // Database has debit, then credit
        List<FinancialPosting> existingPostings = List.of(
                FinancialPosting.builder()
                        .accountCode("PLATFORM_CASH")
                        .accountOwnerType(FinancialAccountOwnerType.PLATFORM)
                        .debitAmount(new BigDecimal("100"))
                        .creditAmount(BigDecimal.ZERO)
                        .currency(FinancialCurrency.VND)
                        .build(),
                FinancialPosting.builder()
                        .accountCode("PLATFORM_COMMISSION_REVENUE")
                        .accountOwnerType(FinancialAccountOwnerType.PLATFORM)
                        .debitAmount(BigDecimal.ZERO)
                        .creditAmount(new BigDecimal("100.0"))
                        .currency(FinancialCurrency.VND)
                        .build()
        );

        when(journalRepository.findByBusinessReference("PAYMENT_PAID:123")).thenReturn(Optional.of(existingJournal));
        when(postingRepository.findByJournalIdOrderByIdAsc(15L)).thenReturn(existingPostings);

        LedgerPostResult result = ledgerService.postJournal(command);

        assertFalse(result.created());
        verify(transactionManager).commit(writeStatus);
    }

    @Test
    void testConcurrentUniqueConflictRecoverySuccessful() {
        LedgerJournalCommand command = createValidCommand();
        doNothing().when(financeProperties).assertPostingConfigured();

        // Simulate save/flush unique constraint failure in write transaction
        when(journalRepository.findByBusinessReference("PAYMENT_PAID:123")).thenReturn(Optional.empty());
        when(journalRepository.save(any(FinancialJournal.class))).thenThrow(new DataIntegrityViolationException("Unique key constraint"));

        // Simulate recovery lookup finding the winning concurrent record
        FinancialJournal concurrentWinningJournal = FinancialJournal.builder()
                .id(20L)
                .businessEventType("PAYMENT_PAID")
                .businessReference("PAYMENT_PAID:123")
                .description("Valid description")
                .build();

        List<FinancialPosting> concurrentPostings = List.of(
                FinancialPosting.builder()
                        .accountCode("PLATFORM_CASH")
                        .accountOwnerType(FinancialAccountOwnerType.PLATFORM)
                        .debitAmount(new BigDecimal("100"))
                        .creditAmount(BigDecimal.ZERO)
                        .currency(FinancialCurrency.VND)
                        .build(),
                FinancialPosting.builder()
                        .accountCode("PLATFORM_COMMISSION_REVENUE")
                        .accountOwnerType(FinancialAccountOwnerType.PLATFORM)
                        .debitAmount(BigDecimal.ZERO)
                        .creditAmount(new BigDecimal("100"))
                        .currency(FinancialCurrency.VND)
                        .build()
        );

        when(journalRepository.findByBusinessReference("PAYMENT_PAID:123"))
                .thenReturn(Optional.empty()) // First lookup (write transaction)
                .thenReturn(Optional.of(concurrentWinningJournal)); // Second lookup (recovery transaction)

        when(postingRepository.findByJournalIdOrderByIdAsc(20L)).thenReturn(concurrentPostings);

        LedgerPostResult result = ledgerService.postJournal(command);

        assertFalse(result.created());
        assertEquals(20L, result.journalId());

        InOrder inOrder = inOrder(transactionManager);
        // Write transaction start
        inOrder.verify(transactionManager).getTransaction(argThat(def -> !def.isReadOnly()));
        // Write transaction rollback
        inOrder.verify(transactionManager).rollback(writeStatus);
        // Recovery read-only transaction start
        inOrder.verify(transactionManager).getTransaction(argThat(TransactionDefinition::isReadOnly));
        // Recovery read-only commit
        inOrder.verify(transactionManager).commit(readOnlyStatus);
    }

    @Test
    void testConcurrentUniqueConflictRecoveryConflictThrows() {
        LedgerJournalCommand command = createValidCommand();
        doNothing().when(financeProperties).assertPostingConfigured();

        when(journalRepository.findByBusinessReference("PAYMENT_PAID:123")).thenReturn(Optional.empty());
        when(journalRepository.save(any(FinancialJournal.class))).thenThrow(new DataIntegrityViolationException("Unique key constraint"));

        FinancialJournal concurrentWinningJournal = FinancialJournal.builder()
                .id(20L)
                .businessEventType("PAYMENT_PAID")
                .businessReference("PAYMENT_PAID:123")
                .description("DIFFERENT CONTENT")
                .build();

        when(journalRepository.findByBusinessReference("PAYMENT_PAID:123"))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(concurrentWinningJournal));

        assertThrows(LedgerIdempotencyConflictException.class, () -> ledgerService.postJournal(command));

        InOrder inOrder = inOrder(transactionManager);
        inOrder.verify(transactionManager).getTransaction(argThat(def -> !def.isReadOnly()));
        inOrder.verify(transactionManager).rollback(writeStatus);
        inOrder.verify(transactionManager).getTransaction(argThat(TransactionDefinition::isReadOnly));
        inOrder.verify(transactionManager).rollback(readOnlyStatus);
    }

    @Test
    void testConcurrentUniqueConflictRecoveryAbsentRethrowsOriginal() {
        LedgerJournalCommand command = createValidCommand();
        doNothing().when(financeProperties).assertPostingConfigured();

        DataIntegrityViolationException originalEx = new DataIntegrityViolationException("Some other constraint");
        when(journalRepository.findByBusinessReference("PAYMENT_PAID:123")).thenReturn(Optional.empty());
        when(journalRepository.save(any(FinancialJournal.class))).thenThrow(originalEx);

        // Recovery query returns empty (meaning conflict wasn't because of businessReference)
        when(journalRepository.findByBusinessReference("PAYMENT_PAID:123"))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.empty());

        DataIntegrityViolationException thrown = assertThrows(DataIntegrityViolationException.class, () -> ledgerService.postJournal(command));
        assertEquals(originalEx, thrown);

        InOrder inOrder = inOrder(transactionManager);
        inOrder.verify(transactionManager).getTransaction(argThat(def -> !def.isReadOnly()));
        inOrder.verify(transactionManager).rollback(writeStatus);
        inOrder.verify(transactionManager).getTransaction(argThat(TransactionDefinition::isReadOnly));
        inOrder.verify(transactionManager).rollback(readOnlyStatus);
    }

    @Test
    void testSafeExceptionMessages() {
        LedgerJournalCommand command = createValidCommand();
        doNothing().when(financeProperties).assertPostingConfigured();

        FinancialJournal existingJournal = FinancialJournal.builder()
                .id(15L)
                .businessEventType("PAYMENT_PAID")
                .businessReference("PAYMENT_PAID:123")
                .description("DIFFERENT DESCRIPTION")
                .build();

        when(journalRepository.findByBusinessReference("PAYMENT_PAID:123")).thenReturn(Optional.of(existingJournal));

        LedgerIdempotencyConflictException ex = assertThrows(
                LedgerIdempotencyConflictException.class,
                () -> ledgerService.postJournal(command)
        );

        String msg = ex.getMessage();
        assertFalse(msg.contains("PAYMENT_PAID:123"));
        assertFalse(msg.contains("100"));
        assertFalse(msg.contains("debitAmount"));
        assertEquals("Ledger idempotency conflict: an existing journal has different immutable content.", msg);
    }
}
