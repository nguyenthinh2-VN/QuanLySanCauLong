package com.badminton.modules.court.repository;

import com.badminton.modules.court.entity.Court;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CourtRepository extends JpaRepository<Court, Long>, JpaSpecificationExecutor<Court> {

    boolean existsByComplexIdAndName(Long complexId, String name);

    boolean existsByComplexIdAndNameAndIdNot(Long complexId, String name, Long id);

    long countByComplexId(Long complexId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Court c WHERE c.id = :id")
    Optional<Court> findByIdForUpdate(@Param("id") Long id);
}

