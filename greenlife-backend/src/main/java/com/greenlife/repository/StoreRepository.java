package com.greenlife.repository;

import com.greenlife.entity.Store;
import com.greenlife.entity.enums.StoreStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StoreRepository extends JpaRepository<Store, Integer> {
    List<Store> findByOwnerEmail(String email);
    List<Store> findByOwnerId(Integer ownerId);
    List<Store> findByStatus(StoreStatus status);
}
