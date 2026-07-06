package com.greenlife.diagnosis.repository;

import com.greenlife.diagnosis.entity.DiagnosisHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DiagnosisHistoryRepository extends JpaRepository<DiagnosisHistory, Integer>, JpaSpecificationExecutor<DiagnosisHistory> {

    long countByCustomerId(Integer customerId);

    long countByCustomerIdAndCreatedAtAfter(Integer customerId, LocalDateTime startOfDay);

    Optional<DiagnosisHistory> findByIdAndCustomerId(Integer id, Integer customerId);

    @Query(value = "SELECT * FROM diagnosis_history WHERE id = :id", nativeQuery = true)
    Optional<DiagnosisHistory> findIncludingDeleted(@Param("id") Integer id);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query(value = "DELETE FROM diagnosis_history", nativeQuery = true)
    void hardDeleteAll();
}
