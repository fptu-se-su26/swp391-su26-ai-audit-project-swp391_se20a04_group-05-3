package com.greenlife.user;

import com.greenlife.user.entity.User;
import com.greenlife.user.entity.enums.UserStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

public class UserLockingUnitTest {

    @Test
    @DisplayName("Active user is unlocked and enabled")
    void testActiveUserIsUnlockedAndEnabled() {
        User user = User.builder()
                .status(UserStatus.ACTIVE)
                .build();

        assertTrue(user.isAccountNonLocked());
        assertTrue(user.isEnabled());
    }

    @Test
    @DisplayName("Admin locked user (lockoutEnd == null) is locked and disabled")
    void testAdminLockedUserIsLockedAndDisabled() {
        User user = User.builder()
                .status(UserStatus.LOCKED)
                .lockoutEnd(null)
                .build();

        assertFalse(user.isAccountNonLocked());
        assertFalse(user.isEnabled());
    }

    @Test
    @DisplayName("Temporary locked user (lockoutEnd in future) is locked and disabled")
    void testTemporaryLockedUserIsLockedAndDisabled() {
        User user = User.builder()
                .status(UserStatus.LOCKED)
                .lockoutEnd(LocalDateTime.now().plusMinutes(15))
                .build();

        assertFalse(user.isAccountNonLocked());
        assertFalse(user.isEnabled());
    }

    @Test
    @DisplayName("Expired temporary locked user (lockoutEnd in past) is unlocked and enabled")
    void testExpiredTemporaryLockedUserIsUnlockedAndEnabled() {
        User user = User.builder()
                .status(UserStatus.LOCKED)
                .lockoutEnd(LocalDateTime.now().minusMinutes(5))
                .build();

        assertTrue(user.isAccountNonLocked());
        assertTrue(user.isEnabled());
    }

    @Test
    @DisplayName("Disabled user is locked and disabled")
    void testDisabledUserIsLockedAndDisabled() {
        User user = User.builder()
                .status(UserStatus.DISABLED)
                .build();

        assertFalse(user.isAccountNonLocked());
        assertFalse(user.isEnabled());
    }
}
