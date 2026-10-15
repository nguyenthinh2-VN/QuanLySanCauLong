package com.badminton.modules.court.repository;

import com.badminton.modules.court.entity.Court;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface CourtRepository extends JpaRepository<Court, Long>, JpaSpecificationExecutor<Court> {

    boolean existsByComplexIdAndName(Long complexId, String name);

    boolean existsByComplexIdAndNameAndIdNot(Long complexId, String name, Long id);

    long countByComplexId(Long complexId);
}
