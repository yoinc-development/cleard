package ch.yoinc.cleard.transaction;

import ch.yoinc.cleard.category.Category;
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
            WHERE t.txDate BETWEEN :from AND :to
              AND (:categoryIds IS NULL OR t.category.id IN :categoryIds)
              AND (:q IS NULL OR LOWER(t.description) LIKE LOWER(CONCAT('%', :q, '%')))
            ORDER BY t.txDate DESC, t.id DESC
            """)
    List<Transaction> findForMonth(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("categoryIds") List<Long> categoryIds,
            @Param("q") String q,
            Pageable pageable
    );

    @Query("""
            SELECT COUNT(t) FROM Transaction t
            WHERE t.txDate BETWEEN :from AND :to
              AND (:categoryIds IS NULL OR t.category.id IN :categoryIds)
              AND (:q IS NULL OR LOWER(t.description) LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    long countForMonth(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("categoryIds") List<Long> categoryIds,
            @Param("q") String q
    );

    @Query("SELECT t FROM Transaction t WHERE t.txDate BETWEEN :from AND :to")
    List<Transaction> findAllForMonth(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT t FROM Transaction t WHERE t.category = :category")
    List<Transaction> findAllForCategory(@Param("category") Category category);

    boolean existsByCategory(Category category);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE Transaction t
            SET t.category = :target
            WHERE t.id = :transactionId AND t.category.id = :categoryId
            """)
    void migrateCategoryOnTransaction(
            @Param("transactionId") Long transactionId,
            @Param("categoryId") Long categoryId,
            @Param("target") Category target
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Transaction t SET t.currency = :currency")
    void updateAllCurrencies(@Param("currency") String currency);
}
