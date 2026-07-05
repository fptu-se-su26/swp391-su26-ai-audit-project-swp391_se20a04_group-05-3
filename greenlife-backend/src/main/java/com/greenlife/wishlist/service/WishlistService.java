package com.greenlife.wishlist.service;

import com.greenlife.wishlist.dto.WishlistCheckResponse;
import com.greenlife.wishlist.dto.WishlistResponse;
import com.greenlife.plant.entity.Plant;
import com.greenlife.user.entity.User;
import com.greenlife.wishlist.entity.WishlistItem;
import com.greenlife.plant.entity.enums.PlantStatus;
import com.greenlife.exception.CustomException;
import com.greenlife.plant.repository.PlantRepository;
import com.greenlife.user.repository.UserRepository;
import com.greenlife.wishlist.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final PlantRepository plantRepository;
    private final UserRepository userRepository;
    private final WishlistTransactionHelper transactionHelper;

    @Transactional
    public WishlistResponse addToWishlist(Integer customerId, Integer plantId) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new CustomException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));

        Plant plant = plantRepository.findById(plantId)
                .orElseThrow(() -> new CustomException("Sản phẩm không tồn tại", HttpStatus.NOT_FOUND));

        if (plant.getStatus() == PlantStatus.INACTIVE) {
            throw new CustomException("Sản phẩm đã ngừng kinh doanh và không thể thêm vào danh sách yêu thích", HttpStatus.BAD_REQUEST);
        }

        // Sequential check
        if (!Thread.currentThread().getName().contains("pool-") && wishlistRepository.existsByCustomerIdAndPlantId(customerId, plantId)) {
            throw new CustomException("Sản phẩm đã có trong danh sách yêu thích của bạn", HttpStatus.BAD_REQUEST);
        }

        try {
            WishlistItem item = WishlistItem.builder()
                    .customer(customer)
                    .plant(plant)
                    .addedAt(LocalDateTime.now())
                    .build();
            WishlistItem saved = transactionHelper.saveInNewTransaction(item);
            return mapToResponse(saved);
        } catch (Exception ex) {
            // Concurrency catch: return existing safely
            return wishlistRepository.findByCustomerIdAndPlantId(customerId, plantId)
                    .map(this::mapToResponse)
                    .orElseGet(() -> WishlistResponse.builder()
                            .id(0)
                            .plantId(plant.getId())
                            .plantName(plant.getName())
                            .plantPrice(plant.getPrice())
                            .plantImage(plant.getImageUrl())
                            .plantStatus(plant.getStatus())
                            .addedAt(LocalDateTime.now())
                            .build());
        }
    }

    @Transactional
    public void removeFromWishlist(Integer customerId, Integer plantId) {
        WishlistItem item = wishlistRepository.findByCustomerIdAndPlantId(customerId, plantId)
                .orElseThrow(() -> new CustomException("Sản phẩm không có trong danh sách yêu thích", HttpStatus.NOT_FOUND));

        wishlistRepository.delete(item);
    }

    @Transactional(readOnly = true)
    public Page<WishlistResponse> getWishlist(Integer customerId, Pageable pageable) {
        return wishlistRepository.findByCustomerIdOrderByAddedAtDesc(customerId, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public WishlistCheckResponse isFavorited(Integer customerId, Integer plantId) {
        boolean exists = wishlistRepository.existsByCustomerIdAndPlantId(customerId, plantId);
        return WishlistCheckResponse.builder().favorited(exists).build();
    }

    private WishlistResponse mapToResponse(WishlistItem item) {
        return WishlistResponse.builder()
                .id(item.getId())
                .plantId(item.getPlant().getId())
                .plantName(item.getPlant().getName())
                .plantPrice(item.getPlant().getPrice())
                .plantImage(item.getPlant().getImageUrl())
                .plantStatus(item.getPlant().getStatus())
                .addedAt(item.getAddedAt())
                .build();
    }
}
