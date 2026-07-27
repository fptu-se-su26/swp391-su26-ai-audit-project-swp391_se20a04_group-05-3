package com.greenlife.finance.service.impl;

import com.greenlife.finance.config.FinanceProperties;
import com.greenlife.finance.dto.LedgerJournalCommand;
import com.greenlife.finance.dto.LedgerPostResult;
import com.greenlife.finance.dto.LedgerPostingCommand;
import com.greenlife.finance.entity.FinancialJournal;
import com.greenlife.finance.entity.FinancialPosting;
import com.greenlife.finance.entity.Payout;
import com.greenlife.finance.entity.Refund;
import com.greenlife.finance.entity.enums.FinancialAccountOwnerType;
import com.greenlife.finance.entity.enums.FinancialCurrency;
import com.greenlife.finance.exception.FinanceValidationException;
import com.greenlife.finance.exception.LedgerIdempotencyConflictException;
import com.greenlife.finance.repository.FinancialJournalRepository;
import com.greenlife.finance.repository.FinancialPostingRepository;
import com.greenlife.finance.repository.PayoutRepository;
import com.greenlife.finance.repository.RefundRepository;
import com.greenlife.finance.service.LedgerCommandValidator;
import com.greenlife.finance.service.LedgerService;
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
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
public class LedgerServiceImpl implements LedgerService {

    private final LedgerCommandValidator validator;
    private final FinanceProperties financeProperties;
    private final FinancialJournalRepository journalRepository;
    private final FinancialPostingRepository postingRepository;
    private final OrderRepository orderRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final RefundRepository refundRepository;
    private final PayoutRepository payoutRepository;
    private final PromotionRepository promotionRepository;
    private final UserRepository userRepository;
    private final StoreRepository storeRepository;

    private final TransactionTemplate writeTransactionTemplate;
    private final TransactionTemplate readOnlyTransactionTemplate;

    public LedgerServiceImpl(
            LedgerCommandValidator validator,
            FinanceProperties financeProperties,
            FinancialJournalRepository journalRepository,
            FinancialPostingRepository postingRepository,
            OrderRepository orderRepository,
            PaymentTransactionRepository paymentTransactionRepository,
            RefundRepository refundRepository,
            PayoutRepository payoutRepository,
            PromotionRepository promotionRepository,
            UserRepository userRepository,
            StoreRepository storeRepository,
            PlatformTransactionManager transactionManager) {
        this.validator = validator;
        this.financeProperties = financeProperties;
        this.journalRepository = journalRepository;
        this.postingRepository = postingRepository;
        this.orderRepository = orderRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.refundRepository = refundRepository;
        this.payoutRepository = payoutRepository;
        this.promotionRepository = promotionRepository;
        this.userRepository = userRepository;
        this.storeRepository = storeRepository;

        // Configure templates to execute in separate transaction boundaries
        this.writeTransactionTemplate = new TransactionTemplate(transactionManager);
        this.writeTransactionTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        this.readOnlyTransactionTemplate = new TransactionTemplate(transactionManager);
        this.readOnlyTransactionTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        this.readOnlyTransactionTemplate.setReadOnly(true);
    }

    @Override
    public LedgerPostResult postJournal(LedgerJournalCommand command) {
        // 1. Pure command validation
        validator.validate(command);

        // 2. Finance properties check (fail-closed)
        financeProperties.assertPostingConfigured();

        // 3. Reversal safety fail-closed check for this stage
        if (command.reversalOfJournalId() != null) {
            throw new FinanceValidationException("Reversal posting is not enabled in this stage.");
        }

        try {
            // Execute the write transaction
            return writeTransactionTemplate.execute(status -> {
                // a. Query by businessReference
                Optional<FinancialJournal> existingJournalOpt = journalRepository.findByBusinessReference(command.businessReference());
                if (existingJournalOpt.isPresent()) {
                    FinancialJournal existingJournal = existingJournalOpt.get();
                    List<FinancialPosting> existingPostings = postingRepository.findByJournalIdOrderByIdAsc(existingJournal.getId());
                    if (isEquivalent(existingJournal, existingPostings, command)) {
                        return new LedgerPostResult(existingJournal.getId(), existingJournal.getBusinessReference(), false);
                    } else {
                        throw new LedgerIdempotencyConflictException("Ledger idempotency conflict: an existing journal has different immutable content.");
                    }
                }

                // b. Resolve referenced entities
                Order order = command.orderId() != null ?
                        orderRepository.findById(command.orderId())
                                .orElseThrow(() -> new FinanceValidationException("Order not found with ID: " + command.orderId())) : null;

                PaymentTransaction paymentTransaction = command.paymentTransactionId() != null ?
                        paymentTransactionRepository.findById(command.paymentTransactionId())
                                .orElseThrow(() -> new FinanceValidationException("Payment Transaction not found with ID: " + command.paymentTransactionId())) : null;

                Refund refund = command.refundId() != null ?
                        refundRepository.findById(command.refundId())
                                .orElseThrow(() -> new FinanceValidationException("Refund not found with ID: " + command.refundId())) : null;

                Payout payout = command.payoutId() != null ?
                        payoutRepository.findById(command.payoutId())
                                .orElseThrow(() -> new FinanceValidationException("Payout not found with ID: " + command.payoutId())) : null;

                Promotion promotion = command.promotionId() != null ?
                        promotionRepository.findById(command.promotionId())
                                .orElseThrow(() -> new FinanceValidationException("Promotion not found with ID: " + command.promotionId())) : null;

                User createdByUser = command.createdBy() != null ?
                        userRepository.findById(command.createdBy())
                                .orElseThrow(() -> new FinanceValidationException("User not found with ID: " + command.createdBy())) : null;

                // Resolve stores
                Map<Integer, Store> storeMap = new HashMap<>();
                for (LedgerPostingCommand postingCommand : command.postings()) {
                    Integer storeId = postingCommand.storeId();
                    if (storeId != null && !storeMap.containsKey(storeId)) {
                        Store store = storeRepository.findById(storeId)
                                .orElseThrow(() -> new FinanceValidationException("Store not found with ID: " + storeId));
                        storeMap.put(storeId, store);
                    }
                }

                // c. Insert FinancialJournal
                FinancialJournal journal = FinancialJournal.builder()
                        .businessEventType(command.businessEventType())
                        .businessReference(command.businessReference())
                        .order(order)
                        .paymentTransaction(paymentTransaction)
                        .refund(refund)
                        .payout(payout)
                        .promotion(promotion)
                        .description(command.description())
                        .createdBy(createdByUser)
                        .build();

                journalRepository.save(journal);
                journalRepository.flush(); // Evaluate unique constraint violations

                // d. Insert FinancialPostings
                for (LedgerPostingCommand postingCommand : command.postings()) {
                    FinancialPosting posting = FinancialPosting.builder()
                            .journal(journal)
                            .accountCode(postingCommand.accountCode().name())
                            .accountOwnerType(postingCommand.accountOwnerType())
                            .accountOwnerId(postingCommand.accountOwnerId())
                            .store(postingCommand.storeId() != null ? storeMap.get(postingCommand.storeId()) : null)
                            .debitAmount(postingCommand.debitAmount().setScale(0, RoundingMode.UNNECESSARY))
                            .creditAmount(postingCommand.creditAmount().setScale(0, RoundingMode.UNNECESSARY))
                            .currency(postingCommand.currency())
                            .build();
                    postingRepository.save(posting);
                }
                postingRepository.flush(); // Ensure postings are flushed before commit

                return new LedgerPostResult(journal.getId(), journal.getBusinessReference(), true);
            });
        } catch (DataIntegrityViolationException ex) {
            // Write transaction is rolled back and closed. Start read-only transaction to check winning record.
            return readOnlyTransactionTemplate.execute(status -> {
                Optional<FinancialJournal> existingJournalOpt = journalRepository.findByBusinessReference(command.businessReference());
                if (!existingJournalOpt.isPresent()) {
                    // Violation is unrelated to businessReference unique constraint
                    throw ex;
                }
                FinancialJournal existingJournal = existingJournalOpt.get();
                List<FinancialPosting> existingPostings = postingRepository.findByJournalIdOrderByIdAsc(existingJournal.getId());
                if (isEquivalent(existingJournal, existingPostings, command)) {
                    return new LedgerPostResult(existingJournal.getId(), existingJournal.getBusinessReference(), false);
                } else {
                    throw new LedgerIdempotencyConflictException("Ledger idempotency conflict: an existing journal has different immutable content.");
                }
            });
        }
    }

    private boolean isEquivalent(FinancialJournal journal, List<FinancialPosting> postings, LedgerJournalCommand command) {
        if (!Objects.equals(journal.getBusinessEventType(), command.businessEventType())) {
            return false;
        }
        if (!Objects.equals(journal.getBusinessReference(), command.businessReference())) {
            return false;
        }
        Integer existingOrderId = journal.getOrder() != null ? journal.getOrder().getId() : null;
        if (!Objects.equals(existingOrderId, command.orderId())) {
            return false;
        }
        Integer existingPTId = journal.getPaymentTransaction() != null ? journal.getPaymentTransaction().getId() : null;
        if (!Objects.equals(existingPTId, command.paymentTransactionId())) {
            return false;
        }
        Integer existingRefundId = journal.getRefund() != null ? journal.getRefund().getId() : null;
        if (!Objects.equals(existingRefundId, command.refundId())) {
            return false;
        }
        Integer existingPayoutId = journal.getPayout() != null ? journal.getPayout().getId() : null;
        if (!Objects.equals(existingPayoutId, command.payoutId())) {
            return false;
        }
        Integer existingPromotionId = journal.getPromotion() != null ? journal.getPromotion().getId() : null;
        if (!Objects.equals(existingPromotionId, command.promotionId())) {
            return false;
        }
        Long existingReversalId = journal.getReversalOfJournal() != null ? journal.getReversalOfJournal().getId() : null;
        if (!Objects.equals(existingReversalId, command.reversalOfJournalId())) {
            return false;
        }
        if (!Objects.equals(journal.getDescription(), command.description())) {
            return false;
        }
        Integer existingCreatedBy = journal.getCreatedBy() != null ? journal.getCreatedBy().getId() : null;
        if (!Objects.equals(existingCreatedBy, command.createdBy())) {
            return false;
        }

        // Compare postings multiset
        if (postings.size() != command.postings().size()) {
            return false;
        }

        Map<PostingSignature, Integer> commandPostings = getCommandPostingsMultiset(command.postings());
        Map<PostingSignature, Integer> dbPostings = getDatabasePostingsMultiset(postings);

        return Objects.equals(commandPostings, dbPostings);
    }

    private Map<PostingSignature, Integer> getCommandPostingsMultiset(List<LedgerPostingCommand> postings) {
        Map<PostingSignature, Integer> counts = new HashMap<>();
        for (LedgerPostingCommand p : postings) {
            PostingSignature sig = new PostingSignature(
                    p.accountCode().name(),
                    p.accountOwnerType(),
                    p.accountOwnerId(),
                    p.storeId(),
                    p.debitAmount(),
                    p.creditAmount(),
                    p.currency()
            );
            counts.put(sig, counts.getOrDefault(sig, 0) + 1);
        }
        return counts;
    }

    private Map<PostingSignature, Integer> getDatabasePostingsMultiset(List<FinancialPosting> postings) {
        Map<PostingSignature, Integer> counts = new HashMap<>();
        for (FinancialPosting p : postings) {
            PostingSignature sig = new PostingSignature(
                    p.getAccountCode(),
                    p.getAccountOwnerType(),
                    p.getAccountOwnerId(),
                    p.getStore() != null ? p.getStore().getId() : null,
                    p.getDebitAmount(),
                    p.getCreditAmount(),
                    p.getCurrency()
            );
            counts.put(sig, counts.getOrDefault(sig, 0) + 1);
        }
        return counts;
    }

    private record PostingSignature(
            String accountCode,
            FinancialAccountOwnerType accountOwnerType,
            Integer accountOwnerId,
            Integer storeId,
            BigDecimal debitAmountNormalized,
            BigDecimal creditAmountNormalized,
            FinancialCurrency currency
    ) {
        public PostingSignature {
            debitAmountNormalized = debitAmountNormalized.setScale(0, RoundingMode.UNNECESSARY);
            creditAmountNormalized = creditAmountNormalized.setScale(0, RoundingMode.UNNECESSARY);
        }
    }
}
