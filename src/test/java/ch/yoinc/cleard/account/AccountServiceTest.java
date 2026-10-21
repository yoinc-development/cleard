package ch.yoinc.cleard.account;

import ch.yoinc.cleard.app_settings.AppSettingsController;
import ch.yoinc.cleard.app_settings.AppSettingsRequest;
import ch.yoinc.cleard.category.CategoryController;
import ch.yoinc.cleard.category.CategoryDraft;
import ch.yoinc.cleard.category.CategoryRepository;
import ch.yoinc.cleard.category.CategoryResponse;
import ch.yoinc.cleard.transaction.Transaction;
import ch.yoinc.cleard.transaction.TransactionController;
import ch.yoinc.cleard.transaction.TransactionDraft;
import ch.yoinc.cleard.transaction.TransactionRepository;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Transactional
class AccountServiceTest {

    @Autowired
    private AccountController accountController;

    @Autowired
    private CategoryController categoryController;

    @Autowired
    private TransactionController transactionController;

    @Autowired
    private AppSettingsController settingsController;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private EntityManager entityManager;

    private Account checking;
    private Account savings;

    @BeforeEach
    void setUp() {
        checking = accountRepository.findAllByOrderByIdAsc().get(0);
        savings = accountRepository.save(account("Savings"));
    }

    @Test
    void deletesTheAccountAndItsCategories() {
        CategoryResponse groceries = category("Groceries", savings, null);
        CategoryResponse other = category("Other", checking, null);

        accountController.deleteAccount(savings.getId());
        entityManager.flush();
        entityManager.clear();

        assertFalse(accountRepository.existsById(savings.getId()));
        assertFalse(categoryRepository.existsById(Long.valueOf(groceries.id())));
        assertTrue(categoryRepository.existsById(Long.valueOf(other.id())));
    }

    @Test
    void deletingAnAccountAlsoDeletesTheLinkedCategoriesOnTheOtherAccount() {
        CategoryResponse toChecking = category("To Checking", savings, checking);
        CategoryResponse untouched = category("Rent", checking, null);

        accountController.deleteAccount(savings.getId());
        entityManager.flush();
        entityManager.clear();

        assertFalse(categoryRepository.existsById(Long.valueOf(toChecking.id())));
        assertFalse(categoryRepository.existsById(Long.valueOf(toChecking.counterpartId())));
        assertTrue(categoryRepository.existsById(Long.valueOf(untouched.id())));
        assertTrue(accountRepository.existsById(checking.getId()));
    }

    @Test
    void isBlockedWhileTheAccountHasTransactions() {
        CategoryResponse groceries = category("Groceries", savings, null);
        book(groceries, savings, "-10.00");
        entityManager.flush();

        assertConflict(() -> accountController.deleteAccount(savings.getId()));
        assertTrue(accountRepository.existsById(savings.getId()));
        assertTrue(categoryRepository.existsById(Long.valueOf(groceries.id())));
    }

    @Test
    void aMirrorTransactionOfATransferCountsAsATransaction() {
        CategoryResponse toSavings = category("To Savings", checking, savings);
        book(toSavings, checking, "-500.00");
        entityManager.flush();

        assertConflict(() -> accountController.deleteAccount(savings.getId()));
    }

    @Test
    void isBlockedWhenTheLinkedCategoryStillHasTransactions() {
        CategoryResponse toChecking = category("To Checking", savings, checking);
        Transaction legacy = new Transaction();
        legacy.setTxDate(LocalDate.of(2026, 9, 5));
        legacy.setAmount(new BigDecimal("10.00"));
        legacy.setCurrency("CHF");
        legacy.setDescription("Legacy");
        legacy.setCategory(categoryRepository.findById(Long.valueOf(toChecking.counterpartId())).orElseThrow());
        legacy.setAccount(checking);
        transactionRepository.save(legacy);
        entityManager.flush();

        assertConflict(() -> accountController.deleteAccount(savings.getId()));
        assertTrue(categoryRepository.existsById(Long.valueOf(toChecking.id())));
    }

    @Test
    void theLastAccountCanNotBeDeleted() {
        accountController.deleteAccount(savings.getId());

        assertConflict(() -> accountController.deleteAccount(checking.getId()));
        assertTrue(accountRepository.existsById(checking.getId()));
    }

    @Test
    void anUnknownAccountIsNotFound() {
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> accountController.deleteAccount(-1L));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }

    @Test
    void deletingTheActiveAccountFallsBackToAnother() {
        settingsController.updateSettings(new AppSettingsRequest(null, null, null, savings.getId()));
        assertEquals(savings.getId().toString(), settingsController.getSettings().activeAccountId());

        accountController.deleteAccount(savings.getId());
        entityManager.flush();
        entityManager.clear();

        assertEquals(checking.getId().toString(), settingsController.getSettings().activeAccountId());
    }

    private static Account account(String name) {
        Account account = new Account();
        account.setName(name);
        account.setIcon("card");
        return account;
    }

    private CategoryResponse category(String name, Account account, Account target) {
        return categoryController.createCategory(new CategoryDraft(
                name, "#8b7cf6", "EXPENSE", null, account.getId(), target != null ? target.getId() : null));
    }

    private void book(CategoryResponse category, Account account, String amount) {
        TransactionDraft draft = new TransactionDraft();
        draft.setTxDate(LocalDate.of(2026, 9, 5));
        draft.setAmount(new BigDecimal(amount));
        draft.setCurrency("CHF");
        draft.setDescription("Test");
        draft.setCategoryId(Long.valueOf(category.id()));
        draft.setAccountId(account.getId());
        transactionController.createTransaction(draft);
    }

    private static void assertConflict(Runnable action) {
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, action::run);
        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
    }
}
