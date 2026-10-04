package com.cvai.backend.repository;

import com.cvai.backend.entity.CvAnalysis;
import com.cvai.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CvAnalysisRepository extends JpaRepository<CvAnalysis, Long> {
    List<CvAnalysis> findByUserOrderByCreatedAtDesc(User user);
    Optional<CvAnalysis> findByIdAndUser(Long id, User user);
    long countByUser(User user);
    Optional<CvAnalysis> findFirstByUserAndContentHashOrderByCreatedAtDesc(User user, String contentHash);
}
