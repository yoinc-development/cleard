package ch.yoinc.cleard.category;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    @Query("SELECT c FROM Category c ORDER BY LOWER(c.name) ASC")
    List<Category> findAllAlphabetical();
}
