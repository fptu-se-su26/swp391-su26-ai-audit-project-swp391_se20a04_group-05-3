package com.greenlife.wishlist.service;

import com.greenlife.wishlist.entity.WishlistItem;
import com.greenlife.wishlist.repository.WishlistRepository;
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
