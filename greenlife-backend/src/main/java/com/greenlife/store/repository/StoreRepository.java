package com.greenlife.store.repository;

import com.greenlife.store.entity.Store;
import com.greenlife.store.entity.enums.StoreStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StoreRepository extends JpaRepository<Store, Integer> {
    List<Store> findByOwnerEmail(String email);
    List<Store> findByOwnerId(Integer ownerId);
    List<Store> findByStatus(StoreStatus status);
    List<Store> findByStatusOrderById(StoreStatus status);
}
