package ch.yoinc.cleard.transaction;

import ch.yoinc.cleard.account.AccountRepository;
import ch.yoinc.cleard.category.Category;
import ch.yoinc.cleard.category.CategoryRepository;
import ch.yoinc.cleard.tag.TagResponse;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Transactional
class TransactionRepositoryTest {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    void savesAndReloadsATransaction() {
        Transaction transaction = new Transaction();
        transaction.setTxDate(LocalDate.of(2026, 9, 14));
        transaction.setAmount(new BigDecimal("-42.5000"));
        transaction.setCurrency("CHF");
        transaction.setDescription("Test transaction");
        transaction.setCategory(saveCategory());
        transaction.setAccount(accountRepository.findAllByOrderByIdAsc().getFirst());

        Transaction saved = transactionRepository.save(transaction);
        assertNotNull(saved.getId());

        Optional<Transaction> reloaded = transactionRepository.findById(saved.getId());
        assertTrue(reloaded.isPresent());
        assertEquals("CHF", reloaded.get().getCurrency());
        assertEquals(0, new BigDecimal("-42.5000").compareTo(reloaded.get().getAmount()));
        assertEquals(LocalDate.of(2026, 9, 14), reloaded.get().getTxDate());
        assertEquals("Test transaction", reloaded.get().getDescription());
    }

    @Test
    void sumsFractionalAmountsExactly() {
        // Guards against the column ever reverting to SQLite's native NUMERIC storage
        // (an 8-byte IEEE double), where 0.1 + 0.2 != 0.3.
        Transaction first = newTransaction(new BigDecimal("0.1000"));
        Transaction second = newTransaction(new BigDecimal("0.2000"));
        transactionRepository.save(first);
        transactionRepository.save(second);

        BigDecimal firstReloaded = transactionRepository.findById(first.getId()).orElseThrow().getAmount();
        BigDecimal secondReloaded = transactionRepository.findById(second.getId()).orElseThrow().getAmount();

        assertEquals(0, new BigDecimal("0.3000").compareTo(firstReloaded.add(secondReloaded)));
    }

    @Test
    void storesAmountAsReadablePlainText() {
        Transaction transaction = newTransaction(new BigDecimal("-42.5000"));
        Transaction saved = transactionRepository.save(transaction);
        entityManager.flush();

        Object rawAmount = entityManager
                .createNativeQuery("SELECT amount FROM transactions WHERE id = ?1")
                .setParameter(1, saved.getId())
                .getSingleResult();

        assertEquals("-42.5000", rawAmount);
    }

    @Test
    void persistsTagsInTheJoinTable() {
        Transaction transaction = newTransaction(new BigDecimal("-1.0000"));
        transaction.getTags().addAll(Set.of("weekly", "food"));
        Transaction saved = transactionRepository.save(transaction);
        entityManager.flush();
        entityManager.clear();

        assertEquals(Set.of("weekly", "food"), transactionRepository.findById(saved.getId()).orElseThrow().getTags());
    }

    @Test
    void filtersAndCountsByAnyOfTheTagsCombinedWithTheOtherFilters() {
        Long accountId = accountRepository.findAllByOrderByIdAsc().getFirst().getId();
        LocalDate from = LocalDate.of(2026, 9, 1);
        LocalDate to = LocalDate.of(2026, 9, 30);
        saveTagged("Migros weekly", "weekly");
        saveTagged("Coop party", "party");
        saveTagged("Untagged");
        entityManager.flush();
        entityManager.clear();

        List<String> bothTags = List.of("weekly", "party");
        assertEquals(2, transactionRepository.countForMonth(accountId, from, to, null, bothTags, null));
        assertEquals(1, transactionRepository.countForMonth(accountId, from, to, null, bothTags, "migros"));
        assertEquals(1, transactionRepository.findForMonth(accountId, from, to, null, List.of("party"), null, Pageable.unpaged()).size());
        assertEquals(3, transactionRepository.countForMonth(accountId, from, to, null, null, null));
    }

    @Test
    void countsTagsPerMonthMostUsedFirst() {
        Long accountId = accountRepository.findAllByOrderByIdAsc().getFirst().getId();
        saveTagged("One", "weekly", "food");
        saveTagged("Two", "weekly");
        entityManager.flush();

        List<TagResponse> tags = transactionRepository.countTagsForMonth(accountId, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30));

        assertEquals(List.of(new TagResponse("weekly", 2), new TagResponse("food", 1)), tags);
        assertTrue(transactionRepository.countTagsForMonth(accountId, LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 31)).isEmpty());
    }

    private void saveTagged(String description, String... tags) {
        Transaction transaction = newTransaction(new BigDecimal("-10.0000"));
        transaction.setDescription(description);
        transaction.getTags().addAll(List.of(tags));
        transactionRepository.save(transaction);
    }

    private Category saveCategory() {
        Category category = new Category();
        category.setName("Test");
        category.setColor("#ff8000");
        category.setDirection("EXPENSE");
        category.setAccount(accountRepository.findAllByOrderByIdAsc().getFirst());
        return categoryRepository.save(category);
    }

    private Transaction newTransaction(BigDecimal amount) {
        Transaction transaction = new Transaction();
        transaction.setTxDate(LocalDate.of(2026, 9, 14));
        transaction.setAmount(amount);
        transaction.setCurrency("CHF");
        transaction.setDescription("Test transaction");
        transaction.setCategory(saveCategory());
        transaction.setAccount(accountRepository.findAllByOrderByIdAsc().getFirst());
        return transaction;
    }

}
