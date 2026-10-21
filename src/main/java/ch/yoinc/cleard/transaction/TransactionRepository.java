package ch.yoinc.cleard.transaction;

import ch.yoinc.cleard.account.Account;
import ch.yoinc.cleard.category.Category;
import ch.yoinc.cleard.tag.TagResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    @Query("""
            SELECT t FROM Transaction t
            LEFT JOIN FETCH t.category
            WHERE t.account.id = :accountId
              AND t.txDate BETWEEN :from AND :to
              AND (:categoryIds IS NULL OR t.category.id IN :categoryIds)
              AND (:tags IS NULL OR EXISTS (SELECT 1 FROM t.tags tg WHERE tg IN :tags))
              AND (:q IS NULL OR LOWER(t.description) LIKE LOWER(CONCAT('%', :q, '%')))
            ORDER BY t.txDate DESC, t.id DESC
            """)
    List<Transaction> findForMonth(
            @Param("accountId") Long accountId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("categoryIds") List<Long> categoryIds,
            @Param("tags") List<String> tags,
            @Param("q") String q,
            Pageable pageable
    );

    @Query("""
            SELECT COUNT(t) FROM Transaction t
            WHERE t.account.id = :accountId
              AND t.txDate BETWEEN :from AND :to
              AND (:categoryIds IS NULL OR t.category.id IN :categoryIds)
              AND (:tags IS NULL OR EXISTS (SELECT 1 FROM t.tags tg WHERE tg IN :tags))
              AND (:q IS NULL OR LOWER(t.description) LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    long countForMonth(
            @Param("accountId") Long accountId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("categoryIds") List<Long> categoryIds,
            @Param("tags") List<String> tags,
            @Param("q") String q
    );

    @Query("""
            SELECT new ch.yoinc.cleard.tag.TagResponse(tg, COUNT(t)) FROM Transaction t
            JOIN t.tags tg
            WHERE t.account.id = :accountId
              AND t.txDate BETWEEN :from AND :to
            GROUP BY tg
            ORDER BY COUNT(t) DESC, tg
            """)
    List<TagResponse> countTagsForMonth(
            @Param("accountId") Long accountId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );

    @Query("SELECT t FROM Transaction t WHERE t.account.id = :accountId AND t.txDate BETWEEN :from AND :to")
    List<Transaction> findAllForMonth(@Param("accountId") Long accountId, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT t FROM Transaction t WHERE t.category = :category")
    List<Transaction> findAllForCategory(@Param("category") Category category);

    boolean existsByCategory(Category category);

    boolean existsByAccount(Account account);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Transaction t SET t.currency = :currency")
    void updateAllCurrencies(@Param("currency") String currency);
}
