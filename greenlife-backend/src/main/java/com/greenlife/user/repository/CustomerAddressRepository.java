package com.greenlife.user.repository;




import com.greenlife.user.entity.CustomerAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerAddressRepository extends JpaRepository<CustomerAddress, Integer> {

    List<CustomerAddress> findByCustomerIdOrderByIsDefaultDescUpdatedAtDescCreatedAtDesc(Integer customerId);

    Optional<CustomerAddress> findByCustomerIdAndIsDefaultTrue(Integer customerId);

    long countByCustomerId(Integer customerId);

    Optional<CustomerAddress> findFirstByCustomerIdAndIdNotOrderByUpdatedAtDesc(Integer customerId, Integer addressId);
}
