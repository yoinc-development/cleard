package ch.yoinc.cleard.transaction;

import ch.yoinc.cleard.account.Account;
import ch.yoinc.cleard.account.AccountRepository;
import ch.yoinc.cleard.category.Category;
import ch.yoinc.cleard.category.CategoryRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@Transactional
class TransactionControllerTest {

    @Autowired
    private TransactionController transactionController;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    void getMonthSummaryCountsAndSumsTheMonthsTransactions() {
        saveTransaction(LocalDate.of(2026, 9, 24), "1200.00");
        saveTransaction(LocalDate.of(2026, 9, 5), "-30.00");
        saveTransaction(LocalDate.of(2026, 8, 31), "-999.00"); // outside the month
        entityManager.flush();

        MonthSummaryResponse summary = transactionController.getMonthSummary(defaultAccount().getId(), "2026-09");

        assertEquals(2, summary.count());
        assertEquals(1, summary.countIn());
        assertEquals(1, summary.countOut());
        assertBigDecimal("1200.00", summary.totalIn());
        assertBigDecimal("30.00", summary.totalOut());
    }

    @Test
    void readEndpointsOnlySeeTheRequestedAccount() {
        Account other = saveAccount("Other");
        saveTransaction(LocalDate.of(2026, 9, 5), "-30.00");
        saveTransaction(LocalDate.of(2026, 9, 6), "-70.00", other);
        entityManager.flush();

        MonthSummaryResponse summary = transactionController.getMonthSummary(other.getId(), "2026-09");
        TransactionPageResponse page = transactionController.getTransactions(other.getId(), "2026-09", null, null, null, 20, 0);
        List<DailySpendResponse> dailySpend = transactionController.getDailySpend(other.getId(), "2026-09");

        assertEquals(1, summary.count());
        assertBigDecimal("70.00", summary.totalOut());
        assertEquals(1, page.filteredCount());
        assertEquals(other.getId().toString(), page.transactions().get(0).accountId());
        assertBigDecimal("70.00", dailySpend.get(0).totalOut());
    }

    @Test
    void createTransactionRejectsAMissingAccount() {
        TransactionDraft draft = draft(saveCategory().getId(), "Migros");
        draft.setAccountId(null);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> transactionController.createTransaction(draft));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
    }

    @Test
    void createTransactionRejectsACategoryOfAnotherAccount() {
        TransactionDraft draft = draft(saveCategory().getId(), "Migros");
        draft.setAccountId(saveAccount("Other").getId());

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> transactionController.createTransaction(draft));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
    }

    @Test
    void createTransactionRejectsAnUnknownAccount() {
        TransactionDraft draft = draft(saveCategory().getId(), "Migros");
        draft.setAccountId(-1L);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> transactionController.createTransaction(draft));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }

    @Test
    void getDailySpendGroupsExpensesByDayForTheMonth() {
        saveTransaction(LocalDate.of(2026, 9, 5), "-30.00");
        saveTransaction(LocalDate.of(2026, 9, 5), "-18.90");
        saveTransaction(LocalDate.of(2026, 9, 12), "1200.00"); // income, excluded
        saveTransaction(LocalDate.of(2026, 8, 31), "-50.00"); // outside the month
        entityManager.flush();

        List<DailySpendResponse> dailySpend = transactionController.getDailySpend(defaultAccount().getId(), "2026-09");

        assertEquals(1, dailySpend.size());
        assertEquals(LocalDate.of(2026, 9, 5), dailySpend.get(0).date());
        assertBigDecimal("48.90", dailySpend.get(0).totalOut());
    }

    @Test
    void getTransactionsReturnsTheSecondPageWhenOffsetIsPastTheFirstPage() {
        for (int day = 1; day <= 20; day++) {
            saveTransaction(LocalDate.of(2026, 9, day), "-10.00");
        }
        entityManager.flush();

        TransactionPageResponse page = transactionController.getTransactions(defaultAccount().getId(), "2026-09", null, null, null, 15, 15);

        assertEquals(5, page.transactions().size());
        assertEquals(20, page.filteredCount());
    }

    @Test
    void getTransactionsRejectsANonPositiveLimit() {
        assertThrows(
                ResponseStatusException.class,
                () -> transactionController.getTransactions(defaultAccount().getId(), "2026-09", null, null, null, 0, 0)
        );
    }

    @Test
    void getTransactionsRejectsANegativeOffset() {
        assertThrows(
                ResponseStatusException.class,
                () -> transactionController.getTransactions(defaultAccount().getId(), "2026-09", null, null, null, 15, -1)
        );
    }

    @Test
    void getTransactionsRejectsAnOffsetNotAlignedToLimit() {
        assertThrows(
                ResponseStatusException.class,
                () -> transactionController.getTransactions(defaultAccount().getId(), "2026-09", null, null, null, 15, 7)
        );
    }

    @Test
    void createTransactionRejectsAMissingCategory() {
        TransactionDraft draft = draft(null, "Migros");

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> transactionController.createTransaction(draft));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
    }

    @Test
    void createTransactionRejectsAnUnknownCategory() {
        TransactionDraft draft = draft(-1L, "Migros");

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> transactionController.createTransaction(draft));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }

    @Test
    void createTransactionRejectsABlankDescription() {
        TransactionDraft draft = draft(saveCategory().getId(), "   ");

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> transactionController.createTransaction(draft));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
    }

    @Test
    void createTransactionTrimsTheDescription() {
        TransactionResponse response = transactionController.createTransaction(draft(saveCategory().getId(), "  Migros  "));

        assertEquals("Migros", response.description());
    }

    @Test
    void updateTransactionRejectsAMissingCategory() {
        TransactionDraft draft = draft(null, "Migros");

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> transactionController.updateTransaction(1L, draft));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
    }

    private TransactionDraft draft(Long categoryId, String description) {
        TransactionDraft draft = new TransactionDraft();
        draft.setTxDate(LocalDate.of(2026, 9, 5));
        draft.setAmount(new BigDecimal("-10.00"));
        draft.setCurrency("CHF");
        draft.setDescription(description);
        draft.setCategoryId(categoryId);
        draft.setAccountId(defaultAccount().getId());
        return draft;
    }

    private Account defaultAccount() {
        return accountRepository.findAllByOrderByIdAsc().get(0);
    }

    private Account saveAccount(String name) {
        Account account = new Account();
        account.setName(name);
        account.setIcon("card");
        return accountRepository.save(account);
    }

    private Category saveCategory() {
        Category category = new Category();
        category.setName("Test");
        category.setColor("#ff8000");
        category.setDirection("EXPENSE");
        category.setAccount(accountRepository.findAllByOrderByIdAsc().get(0));
        return categoryRepository.save(category);
    }

    private void saveTransaction(LocalDate txDate, String amount) {
        saveTransaction(txDate, amount, defaultAccount());
    }

    private void saveTransaction(LocalDate txDate, String amount, Account account) {
        Transaction transaction = new Transaction();
        transaction.setTxDate(txDate);
        transaction.setAmount(new BigDecimal(amount));
        transaction.setCurrency("CHF");
        transaction.setDescription("Test");
        transaction.setCategory(saveCategory());
        transaction.setAccount(account);
        transactionRepository.save(transaction);
    }

    private static void assertBigDecimal(String expected, BigDecimal actual) {
        assertEquals(0, new BigDecimal(expected).compareTo(actual), () -> expected + " != " + actual);
    }
}
