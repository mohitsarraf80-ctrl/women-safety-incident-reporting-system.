package com.womensafety.repository;

import com.womensafety.entity.Responder;
import com.womensafety.enums.ResponderAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ResponderRepository extends JpaRepository<Responder, Long> {

    Optional<Responder> findByBadgeCodeIgnoreCase(String badgeCode);

    Optional<Responder> findByUserId(Long userId);

    boolean existsByBadgeCodeIgnoreCase(String badgeCode);

    List<Responder> findAllByOrderByDisplayNameAsc();

    List<Responder> findByAvailability(ResponderAvailability availability);

    @Query("select r from Responder r left join fetch r.user order by r.displayName asc")
    List<Responder> findAllWithUser();
}
