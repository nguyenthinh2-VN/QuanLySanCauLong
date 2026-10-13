package com.badminton.modules.auth.repository;

import com.badminton.modules.auth.entity.User;
import com.badminton.shared.constant.RoleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    Optional<User> findByEmail(String email);

    Optional<User> findByPhone(String phone);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    boolean existsByPhoneAndIdNot(String phone, Long id);

    @Query("SELECT COUNT(DISTINCT u) FROM User u JOIN u.roles r WHERE r.name = :roleName")
    long countByRolesName(@Param("roleName") RoleType roleName);

    @Query("SELECT COUNT(DISTINCT u) FROM User u JOIN u.roles r WHERE r.name = :roleName AND u.active = true")
    long countActiveAdmins(@Param("roleName") RoleType roleName);
}
