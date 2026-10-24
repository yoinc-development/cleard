package ch.yoinc.cleard.transaction;

import ch.yoinc.cleard.account.Account;
import ch.yoinc.cleard.account.AccountRepository;
import ch.yoinc.cleard.category.CategoryController;
import ch.yoinc.cleard.category.CategoryDeleteRequest;
import ch.yoinc.cleard.category.CategoryDraft;
import ch.yoinc.cleard.category.CategoryReassignment;
import ch.yoinc.cleard.category.CategoryRepository;
import ch.yoinc.cleard.category.CategoryResponse;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
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
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Transactional
class TransactionServiceTest {

    @Autowired
    private TransactionController transactionController;

    @Autowired
    private CategoryController categoryController;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private EntityManager entityManager;

    private Account checking;
    private Account savings;
    private CategoryResponse toSavings;
    private CategoryResponse groceries;

    @BeforeEach
    void setUp() {
        checking = accountRepository.findAllByOrderByIdAsc().getFirst();
        savings = saveAccount("Savings");
        toSavings = category("To Savings", checking, savings);
        groceries = category("Groceries", checking, null);
    }

    @Test
    void booking_in_a_transfer_category_creates_the_mirror_on_the_target_account() {
        TransactionResponse response = book(toSavings, checking, "-500.00", "Monthly");

        Transaction original = reload(response.id());
        Transaction mirror = original.getPairedTransaction();
        assertNotNull(mirror);
        assertEquals(response.pairedTransactionId(), mirror.getId().toString());
        assertEquals(savings.getId(), mirror.getAccount().getId());
        assertEquals(Long.valueOf(toSavings.counterpartId()), mirror.getCategory().getId());
        assertEquals(0, new BigDecimal("500.00").compareTo(mirror.getAmount()));
        assertEquals(LocalDate.of(2026, 9, 5), mirror.getTxDate());
        assertEquals("CHF", mirror.getCurrency());
        assertEquals("Monthly", mirror.getDescription());
        assertEquals(original.getId(), mirror.getPairedTransaction().getId());
    }

    @Test
    void booking_in_a_normal_category_creates_no_pair() {
        TransactionResponse response = book(groceries, checking, "-20.00", "Migros");

        assertNull(response.pairedTransactionId());
        assertEquals(1, transactionRepository.count());
    }

    @Test
    void editing_either_side_updates_the_other() {
        TransactionResponse response = book(toSavings, checking, "-500.00", "Monthly");
        Long mirrorId = Long.valueOf(response.pairedTransactionId());

        transactionController.updateTransaction(Long.valueOf(response.id()),
                draft(toSavings, checking, "-750.00", "Monthly raised", LocalDate.of(2026, 9, 6)));
        Transaction mirror = reload(mirrorId.toString());
        assertEquals(0, new BigDecimal("750.00").compareTo(mirror.getAmount()));
        assertEquals("Monthly raised", mirror.getDescription());
        assertEquals(LocalDate.of(2026, 9, 6), mirror.getTxDate());

        CategoryResponse mirrorCategory = counterpartOf(toSavings);
        transactionController.updateTransaction(mirrorId,
                draft(mirrorCategory, savings, "300.00", "Edited from savings", LocalDate.of(2026, 9, 7)));
        Transaction original = reload(response.id());
        assertEquals(0, new BigDecimal("-300.00").compareTo(original.getAmount()));
        assertEquals("Edited from savings", original.getDescription());
        assertEquals(LocalDate.of(2026, 9, 7), original.getTxDate());
        assertEquals(checking.getId(), original.getAccount().getId());
        assertEquals(1, transactionRepository.findAll().stream().filter(t -> t.getAccount().getId().equals(savings.getId())).count());
    }

    @Test
    void moving_to_a_normal_category_deletes_the_pair() {
        TransactionResponse response = book(toSavings, checking, "-500.00", "Monthly");

        transactionController.updateTransaction(Long.valueOf(response.id()),
                draft(groceries, checking, "-500.00", "Monthly", LocalDate.of(2026, 9, 5)));
        entityManager.flush();
        entityManager.clear();

        assertEquals(1, transactionRepository.count());
        assertNull(reload(response.id()).getPairedTransaction());
    }

    @Test
    void moving_to_a_transfer_category_with_another_target_moves_the_pair() {
        Account holiday = saveAccount("Holiday");
        CategoryResponse toHoliday = category("To Holiday", checking, holiday);
        TransactionResponse response = book(toSavings, checking, "-500.00", "Monthly");
        String mirrorId = response.pairedTransactionId();

        transactionController.updateTransaction(Long.valueOf(response.id()),
                draft(toHoliday, checking, "-500.00", "Monthly", LocalDate.of(2026, 9, 5)));
        entityManager.flush();
        entityManager.clear();

        Transaction mirror = reload(mirrorId);
        assertEquals(holiday.getId(), mirror.getAccount().getId());
        assertEquals(Long.valueOf(toHoliday.counterpartId()), mirror.getCategory().getId());
        assertEquals(2, transactionRepository.count());
    }

    @Test
    void saving_an_unpaired_transaction_in_a_transfer_category_creates_its_pair() {
        Transaction legacy = new Transaction();
        legacy.setTxDate(LocalDate.of(2026, 9, 5));
        legacy.setAmount(new BigDecimal("-100.00"));
        legacy.setCurrency("CHF");
        legacy.setDescription("Legacy");
        legacy.setCategory(categoryRepository.findById(Long.valueOf(toSavings.id())).orElseThrow());
        legacy.setAccount(checking);
        legacy = transactionRepository.save(legacy);

        transactionController.updateTransaction(legacy.getId(),
                draft(toSavings, checking, "-100.00", "Legacy", LocalDate.of(2026, 9, 5)));
        entityManager.flush();
        entityManager.clear();

        assertNotNull(reload(legacy.getId().toString()).getPairedTransaction());
        assertEquals(2, transactionRepository.count());
    }

    @Test
    void deleting_either_side_deletes_both() {
        TransactionResponse first = book(toSavings, checking, "-500.00", "One");
        TransactionResponse second = book(toSavings, checking, "-40.00", "Two");

        transactionController.deleteTransaction(Long.valueOf(first.id()));
        transactionController.deleteTransaction(Long.valueOf(second.pairedTransactionId()));
        entityManager.flush();
        entityManager.clear();

        assertEquals(0, transactionRepository.count());
    }

    @Test
    void deleting_an_unknown_transaction_does_nothing() {
        transactionController.deleteTransaction(-1L);

        assertEquals(0, transactionRepository.count());
    }

    @Test
    void reassigning_out_of_a_transfer_category_removes_the_pairs_so_both_categories_can_be_deleted() {
        TransactionResponse response = book(toSavings, checking, "-500.00", "Monthly");
        entityManager.flush();

        categoryController.deleteCategory(Long.valueOf(toSavings.id()), new CategoryDeleteRequest(
                List.of(new CategoryReassignment(Long.valueOf(response.id()), Long.valueOf(groceries.id())))));
        entityManager.flush();
        entityManager.clear();

        assertEquals(1, transactionRepository.count());
        Transaction remaining = reload(response.id());
        assertEquals(Long.valueOf(groceries.id()), remaining.getCategory().getId());
        assertNull(remaining.getPairedTransaction());
        assertFalse(categoryRepository.existsById(Long.valueOf(toSavings.id())));
        assertFalse(categoryRepository.existsById(Long.valueOf(toSavings.counterpartId())));
    }

    @Test
    void updating_an_unknown_transaction_is_not_found() {
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () ->
                transactionController.updateTransaction(-1L, draft(groceries, checking, "-1.00", "x", LocalDate.of(2026, 9, 5))));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }

    @Test
    void the_mirror_is_listed_on_the_target_account_only() {
        book(toSavings, checking, "-500.00", "Monthly");
        entityManager.flush();

        TransactionPageResponse onSavings = transactionController.getTransactions(savings.getId(), "2026-09", null, null, null, 20, 0);
        TransactionPageResponse onChecking = transactionController.getTransactions(checking.getId(), "2026-09", null, null, null, 20, 0);

        assertEquals(1, onSavings.filteredCount());
        assertTrue(onSavings.transactions().
                getFirst().amount().signum() > 0);
        assertEquals(1, onChecking.filteredCount());
        assertEquals(onChecking.transactions().getFirst().id(), onSavings.transactions().getFirst().pairedTransactionId());
    }

    @Test
    void the_mirror_gets_the_tags_of_the_original_and_follows_edits_from_either_side() {
        TransactionDraft draft = draft(toSavings, checking, "-500.00", "Monthly", LocalDate.of(2026, 9, 5));
        draft.setTags(List.of("savings", "monthly"));
        TransactionResponse response = transactionController.createTransaction(draft);
        Long mirrorId = Long.valueOf(response.pairedTransactionId());

        assertEquals(List.of("monthly", "savings"), TransactionResponse.from(reload(mirrorId.toString())).tags());

        TransactionDraft fromMirror = draft(counterpartOf(toSavings), savings, "500.00", "Monthly", LocalDate.of(2026, 9, 5));
        fromMirror.setTags(List.of("monthly"));
        transactionController.updateTransaction(mirrorId, fromMirror);

        assertEquals(List.of("monthly"), TransactionResponse.from(reload(response.id())).tags());
        assertEquals(List.of("monthly"), TransactionResponse.from(reload(mirrorId.toString())).tags());
    }

    @Test
    void deleting_a_tagged_transaction_removes_its_tags() {
        TransactionDraft draft = draft(groceries, checking, "-20.00", "Migros", LocalDate.of(2026, 9, 5));
        draft.setTags(List.of("weekly"));
        TransactionResponse response = transactionController.createTransaction(draft);
        entityManager.flush();

        transactionController.deleteTransaction(Long.valueOf(response.id()));
        entityManager.flush();

        assertEquals(0, ((Number) entityManager.createNativeQuery("SELECT COUNT(*) FROM transaction_tags").getSingleResult()).intValue());
    }

    private Account saveAccount(String name) {
        Account account = new Account();
        account.setName(name);
        account.setIcon("card");
        return accountRepository.save(account);
    }

    private CategoryResponse category(String name, Account account, Account target) {
        return categoryController.createCategory(new CategoryDraft(
                name, "#8b7cf6", "EXPENSE", null, account.getId(), target != null ? target.getId() : null));
    }

    private CategoryResponse counterpartOf(CategoryResponse category) {
        return categoryController.getCategories(Long.valueOf(category.targetAccountId()), "2026-09").stream()
                .filter(c -> c.id().equals(category.counterpartId()))
                .findFirst()
                .orElseThrow();
    }

    private TransactionResponse book(CategoryResponse category, Account account, String amount, String description) {
        return transactionController.createTransaction(draft(category, account, amount, description, LocalDate.of(2026, 9, 5)));
    }

    private static TransactionDraft draft(CategoryResponse category, Account account, String amount, String description, LocalDate date) {
        TransactionDraft draft = new TransactionDraft();
        draft.setTxDate(date);
        draft.setAmount(new BigDecimal(amount));
        draft.setCurrency("CHF");
        draft.setDescription(description);
        draft.setCategoryId(Long.valueOf(category.id()));
        draft.setAccountId(account.getId());
        draft.setTags(List.of());
        return draft;
    }

    private Transaction reload(String id) {
        entityManager.flush();
        entityManager.clear();
        return transactionRepository.findById(Long.valueOf(id)).orElseThrow();
    }
}
