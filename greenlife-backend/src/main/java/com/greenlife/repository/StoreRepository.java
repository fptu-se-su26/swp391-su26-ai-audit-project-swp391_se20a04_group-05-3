package com.greenlife.repository;

import com.greenlife.entity.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StoreRepository extends JpaRepository<Store, Integer> {
    List<Store> findByOwnerEmail(String email);
    List<Store> findByStatus(String status);
}
