package ch.yoinc.cleard.transaction;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@Transactional
class TransactionControllerTest {

    @Autowired
    private TransactionController transactionController;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    void getMonthSummaryCountsAndSumsTheMonthsTransactions() {
        saveTransaction(LocalDate.of(2026, 9, 24), "1200.00");
        saveTransaction(LocalDate.of(2026, 9, 5), "-30.00");
        saveTransaction(LocalDate.of(2026, 8, 31), "-999.00"); // outside the month
        entityManager.flush();

        MonthSummaryResponse summary = transactionController.getMonthSummary("2026-09");

        assertEquals(2, summary.count());
        assertEquals(1, summary.countIn());
        assertEquals(1, summary.countOut());
        assertBigDecimal("1200.00", summary.totalIn());
        assertBigDecimal("30.00", summary.totalOut());
    }

    @Test
    void getDailySpendGroupsExpensesByDayForTheMonth() {
        saveTransaction(LocalDate.of(2026, 9, 5), "-30.00");
        saveTransaction(LocalDate.of(2026, 9, 5), "-18.90");
        saveTransaction(LocalDate.of(2026, 9, 12), "1200.00"); // income, excluded
        saveTransaction(LocalDate.of(2026, 8, 31), "-50.00"); // outside the month
        entityManager.flush();

        List<DailySpendResponse> dailySpend = transactionController.getDailySpend("2026-09");

        assertEquals(1, dailySpend.size());
        assertEquals(LocalDate.of(2026, 9, 5), dailySpend.get(0).date());
        assertBigDecimal("48.90", dailySpend.get(0).totalOut());
    }

    private void saveTransaction(LocalDate txDate, String amount) {
        Transaction transaction = new Transaction();
        transaction.setTxDate(txDate);
        transaction.setAmount(new BigDecimal(amount));
        transaction.setCurrency("CHF");
        transactionRepository.save(transaction);
    }

    private static void assertBigDecimal(String expected, BigDecimal actual) {
        assertEquals(0, new BigDecimal(expected).compareTo(actual), () -> expected + " != " + actual);
    }
}
