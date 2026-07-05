package com.greenlife.booking.repository;

import com.greenlife.booking.entity.Booking;
import com.greenlife.booking.entity.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Collection;

public interface BookingRepository extends JpaRepository<Booking, Integer> {

    Page<Booking> findByCustomerId(Integer customerId, Pageable pageable);

    Page<Booking> findByStoreId(Integer storeId, Pageable pageable);

    long countByCustomerIdAndStatusIn(Integer customerId, Collection<BookingStatus> statuses);

    boolean existsByServiceIdAndScheduledAtAndStatusIn(
            Integer serviceId, java.time.LocalDateTime scheduledAt, Collection<BookingStatus> statuses);
}
