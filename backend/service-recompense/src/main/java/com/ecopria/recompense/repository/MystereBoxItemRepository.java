package com.ecopria.recompense.repository;

import com.ecopria.recompense.model.MystereBoxItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MystereBoxItemRepository extends JpaRepository<MystereBoxItem, Long> {
    List<MystereBoxItem> findByRecompenseId(Long recompenseId);
    void deleteByRecompenseId(Long recompenseId);
}
