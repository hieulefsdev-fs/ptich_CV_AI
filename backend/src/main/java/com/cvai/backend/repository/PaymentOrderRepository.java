package com.cvai.backend.repository;

import com.cvai.backend.entity.PaymentOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PaymentOrderRepository extends JpaRepository<PaymentOrder, Long> {
    Optional<PaymentOrder> findByTxnRef(String txnRef);
    List<PaymentOrder> findAllByOrderByCreatedAtDesc();

    /** Same list with the user fetched in the same query, so reading order.getUser() never needs a lazy load. */
    @Query("select o from PaymentOrder o join fetch o.user order by o.createdAt desc")
    List<PaymentOrder> findAllWithUser();
}
