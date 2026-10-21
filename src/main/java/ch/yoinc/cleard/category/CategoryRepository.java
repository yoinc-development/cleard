package ch.yoinc.cleard.category;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    @Query("SELECT c FROM Category c WHERE c.account.id = :accountId ORDER BY LOWER(c.name) ASC")
    List<Category> findAllForAccountAlphabetical(@Param("accountId") Long accountId);

    @Query("SELECT c FROM Category c WHERE c.account.id = :accountId")
    List<Category> findAllByAccountId(@Param("accountId") Long accountId);
}
