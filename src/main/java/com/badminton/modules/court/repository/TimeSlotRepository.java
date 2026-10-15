package com.badminton.modules.court.repository;

import com.badminton.modules.court.entity.TimeSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalTime;
import java.util.List;

@Repository
public interface TimeSlotRepository extends JpaRepository<TimeSlot, Long> {

    List<TimeSlot> findAllByOrderByStartTimeAsc();

    @Query("SELECT COUNT(t) > 0 FROM TimeSlot t WHERE t.startTime < :endTime AND t.endTime > :startTime")
    boolean existsOverlappingSlot(@Param("startTime") LocalTime startTime, @Param("endTime") LocalTime endTime);

    @Query("SELECT COUNT(t) > 0 FROM TimeSlot t WHERE t.id != :id AND t.startTime < :endTime AND t.endTime > :startTime")
    boolean existsOverlappingSlotExcludingId(
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("id") Long id
    );
}
