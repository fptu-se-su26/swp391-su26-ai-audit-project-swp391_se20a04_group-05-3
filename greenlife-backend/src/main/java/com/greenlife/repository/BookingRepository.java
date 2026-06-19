package com.greenlife.repository;

import com.greenlife.entity.Booking;
import com.greenlife.entity.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Collection;

public interface BookingRepository extends JpaRepository<Booking, Integer> {

    Page<Booking> findByCustomerId(Integer customerId, Pageable pageable);

    Page<Booking> findByStoreId(Integer storeId, Pageable pageable);

    long countByCustomerIdAndStatusIn(Integer customerId, Collection<BookingStatus> statuses);
}
