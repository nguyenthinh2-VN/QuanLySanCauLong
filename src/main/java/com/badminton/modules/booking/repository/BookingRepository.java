package com.badminton.modules.booking.repository;

import com.badminton.modules.booking.entity.Booking;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long>, JpaSpecificationExecutor<Booking> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Booking b WHERE b.id = :id")
    Optional<Booking> findByIdForUpdate(@Param("id") Long id);

    @Query("SELECT COUNT(b) > 0 FROM Booking b " +
            "WHERE b.court.id = :courtId " +
            "AND b.bookingDate = :bookingDate " +
            "AND b.timeSlot.id = :timeSlotId " +
            "AND b.status IN (com.badminton.modules.booking.entity.BookingStatus.PENDING, " +
            "                 com.badminton.modules.booking.entity.BookingStatus.CONFIRMED, " +
            "                 com.badminton.modules.booking.entity.BookingStatus.CHECKED_IN)")
    boolean existsActiveBooking(@Param("courtId") Long courtId,
                                @Param("bookingDate") LocalDate bookingDate,
                                @Param("timeSlotId") Long timeSlotId);

    @Query("SELECT COUNT(b) > 0 FROM Booking b " +
            "WHERE b.court.id = :courtId " +
            "AND b.bookingDate = :bookingDate " +
            "AND b.timeSlot.id = :timeSlotId " +
            "AND b.id != :excludeBookingId " +
            "AND b.status IN (com.badminton.modules.booking.entity.BookingStatus.PENDING, " +
            "                 com.badminton.modules.booking.entity.BookingStatus.CONFIRMED, " +
            "                 com.badminton.modules.booking.entity.BookingStatus.CHECKED_IN)")
    boolean existsActiveBookingExcludingId(@Param("courtId") Long courtId,
                                          @Param("bookingDate") LocalDate bookingDate,
                                          @Param("timeSlotId") Long timeSlotId,
                                          @Param("excludeBookingId") Long excludeBookingId);

    @Query("SELECT b FROM Booking b " +
            "WHERE b.bookingDate = :date " +
            "AND b.court.id IN :courtIds " +
            "AND b.status IN (com.badminton.modules.booking.entity.BookingStatus.PENDING, " +
            "                 com.badminton.modules.booking.entity.BookingStatus.CONFIRMED, " +
            "                 com.badminton.modules.booking.entity.BookingStatus.CHECKED_IN)")
    List<Booking> findActiveBookingsByDateAndCourtIds(@Param("date") LocalDate date,
                                                      @Param("courtIds") Collection<Long> courtIds);
}
