package com.cvai.backend.repository;

import com.cvai.backend.entity.CvAnalysis;
import com.cvai.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CvAnalysisRepository extends JpaRepository<CvAnalysis, Long> {
    List<CvAnalysis> findByUserOrderByCreatedAtDesc(User user);
    Optional<CvAnalysis> findByIdAndUser(Long id, User user);
    long countByUser(User user);
    Optional<CvAnalysis> findFirstByUserAndContentHashOrderByCreatedAtDesc(User user, String contentHash);

    /** Admin list: only the columns we show, joined to the user, without loading the CV file bytes. */
    @Query("""
            select a.id as id, u.email as userEmail, a.targetJobTitle as targetJobTitle, a.atsScore as atsScore,
                   a.originalFilename as originalFilename, a.fileSizeBytes as fileSizeBytes, a.createdAt as createdAt
            from CvAnalysis a join a.user u
            order by a.createdAt desc
            """)
    List<AdminAnalysisView> findAdminViews();
}
