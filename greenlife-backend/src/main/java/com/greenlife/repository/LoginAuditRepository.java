package com.greenlife.repository;

import com.greenlife.entity.LoginAudit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface LoginAuditRepository extends Repository<LoginAudit, Long> {
    
    Optional<LoginAudit> findById(Long id);

    Page<LoginAudit> findAll(Pageable pageable);

    List<LoginAudit> findTop20ByUserIdOrderByLoginTimeDesc(Integer userId);

    Page<LoginAudit> findBySuccess(boolean success, Pageable pageable);

    Page<LoginAudit> findByUserId(Integer userId, Pageable pageable);

    long countByEmailAndSuccessAndLoginTimeAfter(String email, boolean success, LocalDateTime loginTime);

    List<LoginAudit> findByUserIdAndSuccessAndLoginTimeAfter(Integer userId, boolean success, LocalDateTime loginTime);

    LoginAudit save(LoginAudit loginAudit);

    List<LoginAudit> findAll();

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM LoginAudit l WHERE l.loginTime < :date")
    void deleteByLoginTimeBefore(@org.springframework.data.repository.query.Param("date") LocalDateTime date);
}
