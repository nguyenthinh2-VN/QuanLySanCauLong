package com.badminton.modules.court.repository;

import com.badminton.modules.court.entity.CourtComplex;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface CourtComplexRepository
        extends JpaRepository<CourtComplex, Long>, JpaSpecificationExecutor<CourtComplex> {

    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, Long id);
}
