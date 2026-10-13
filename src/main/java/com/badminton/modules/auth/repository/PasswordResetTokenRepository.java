package com.badminton.modules.auth.repository;

import com.badminton.modules.auth.entity.PasswordResetToken;
import com.badminton.modules.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenAndUsedFalse(String token);

    @Modifying
    @Query("DELETE FROM PasswordResetToken p WHERE p.user = :user")
    void deleteByUser(@Param("user") User user);
}
