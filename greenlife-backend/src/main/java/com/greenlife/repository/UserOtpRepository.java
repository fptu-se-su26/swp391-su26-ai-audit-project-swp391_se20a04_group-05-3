package com.greenlife.repository;

import com.greenlife.entity.User;
import com.greenlife.entity.UserOtp;
import com.greenlife.entity.enums.OtpPurpose;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.Optional;

public interface UserOtpRepository extends JpaRepository<UserOtp, Long> {

    Optional<UserOtp> findByUserAndPurpose(User user, OtpPurpose purpose);

    void deleteByUserAndPurpose(User user, OtpPurpose purpose);

    @Modifying
    @Query("DELETE FROM UserOtp o WHERE o.expiresAt < :now")
    void deleteExpiredOtps(@Param("now") LocalDateTime now);
}
