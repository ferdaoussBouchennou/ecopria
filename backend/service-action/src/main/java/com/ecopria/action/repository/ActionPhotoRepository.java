package com.ecopria.action.repository;

import com.ecopria.action.model.ActionPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ActionPhotoRepository extends JpaRepository<ActionPhoto, Long> {
    List<ActionPhoto> findByActionId(Long actionId);

    void deleteByActionId(Long actionId);
}