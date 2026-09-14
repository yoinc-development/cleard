package ch.yoinc.cleard.transaction;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Transactional
class TransactionRepositoryTest {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    void savesAndReloadsATransaction() {
        Transaction transaction = new Transaction();
        transaction.setTxDate(LocalDate.of(2026, 9, 14));
        transaction.setAmount(new BigDecimal("-42.5000"));
        transaction.setCurrency("CHF");
        transaction.setDescription("Test transaction");

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

    private static Transaction newTransaction(BigDecimal amount) {
        Transaction transaction = new Transaction();
        transaction.setTxDate(LocalDate.of(2026, 9, 14));
        transaction.setAmount(amount);
        transaction.setCurrency("CHF");
        return transaction;
    }

}
