package com.greenlife.auth.repository;

import com.greenlife.auth.entity.PasswordHistory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PasswordHistoryRepository extends JpaRepository<PasswordHistory, Long> {
    List<PasswordHistory> findByUserIdOrderByCreatedAtDesc(Integer userId, Pageable pageable);
    List<PasswordHistory> findByUserIdOrderByCreatedAtDesc(Integer userId);
}
