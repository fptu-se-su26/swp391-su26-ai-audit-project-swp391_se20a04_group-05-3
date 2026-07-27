package com.greenlife.finance.repository;

import com.greenlife.finance.entity.StoreBalance;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface StoreBalanceRepository extends JpaRepository<StoreBalance, Integer> {

    /**
     * Pessimistically lock a store balance cache projection.
     * Note: This lock is only effective inside an active transaction boundary.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select sb from StoreBalance sb where sb.storeId = :storeId")
    Optional<StoreBalance> findAndLockByStoreId(@Param("storeId") Integer storeId);
}
