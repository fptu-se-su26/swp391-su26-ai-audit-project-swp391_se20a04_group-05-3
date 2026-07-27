package com.greenlife.auth.repository;

import com.greenlife.user.entity.User;
import com.greenlife.auth.entity.UserOtp;
import com.greenlife.auth.entity.enums.OtpPurpose;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserOtpRepository extends JpaRepository<UserOtp, Long> {

    @Query("SELECT o FROM UserOtp o WHERE o.user = :user AND o.purpose = :purpose ORDER BY o.createdAt DESC, o.id DESC")
    List<UserOtp> findByUserAndPurposeOrderByCreatedAtDesc(@Param("user") User user, @Param("purpose") OtpPurpose purpose);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM UserOtp o WHERE o.user = :user AND o.purpose = :purpose ORDER BY o.createdAt DESC, o.id DESC")
    List<UserOtp> findByUserAndPurposeForUpdate(@Param("user") User user, @Param("purpose") OtpPurpose purpose);

    default Optional<UserOtp> findByUserAndPurpose(User user, OtpPurpose purpose) {
        List<UserOtp> list = findByUserAndPurposeOrderByCreatedAtDesc(user, purpose);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    long countByUserAndCreatedAtAfter(User user, LocalDateTime time);

    long countByUserAndPurposeAndCreatedAtAfter(User user, OtpPurpose purpose, LocalDateTime time);

    void deleteByUserAndPurpose(User user, OtpPurpose purpose);

    @Modifying
    @Query("DELETE FROM UserOtp o WHERE o.expiresAt < :now")
    void deleteExpiredOtps(@Param("now") LocalDateTime now);
}
