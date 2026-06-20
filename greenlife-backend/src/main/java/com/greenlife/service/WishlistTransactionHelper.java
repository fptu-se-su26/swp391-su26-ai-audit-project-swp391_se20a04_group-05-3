package com.greenlife.service;

import com.greenlife.entity.WishlistItem;
import com.greenlife.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class WishlistTransactionHelper {

    private final WishlistRepository wishlistRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public WishlistItem saveInNewTransaction(WishlistItem item) {
        return wishlistRepository.saveAndFlush(item);
    }
}
