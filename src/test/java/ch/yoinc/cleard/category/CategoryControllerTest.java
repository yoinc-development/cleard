package ch.yoinc.cleard.category;

import ch.yoinc.cleard.account.Account;
import ch.yoinc.cleard.account.AccountRepository;
import ch.yoinc.cleard.transaction.Transaction;
import ch.yoinc.cleard.transaction.TransactionRepository;
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
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Transactional
class CategoryControllerTest {

    @Autowired
    private CategoryController categoryController;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    void netsOffsettingTransactionsInTheCategoryDirection() {
        Category groceries = new Category();
        groceries.setName("Groceries");
        groceries.setColor("#ff8000");
        groceries.setDirection("EXPENSE");
        groceries.setAccount(accountRepository.findAllByOrderByIdAsc().getFirst());
        groceries = categoryRepository.save(groceries);

        saveTransaction(groceries, "-50.0000", LocalDate.of(2026, 9, 5));
        saveTransaction(groceries, "30.0000", LocalDate.of(2026, 9, 10));
        entityManager.flush();

        CategoryResponse response = findCategory(categoryController.getCategories(defaultAccount().getId(), "2026-09"), groceries.getId());

        assertBigDecimal("20", response.monthToDateTotal());
        assertBigDecimal("50", response.monthToDateOut());
        assertBigDecimal("30", response.monthToDateIn());
        assertEquals(2, response.monthToDateCount());
    }

    @Test
    void categoryWithNoTransactionsNetsToZero() {
        Category rent = new Category();
        rent.setName("Rent");
        rent.setColor("#f97316");
        rent.setDirection("EXPENSE");
        rent.setAccount(accountRepository.findAllByOrderByIdAsc().getFirst());
        rent = categoryRepository.save(rent);
        entityManager.flush();

        CategoryResponse response = findCategory(categoryController.getCategories(defaultAccount().getId(), "2026-09"), rent.getId());

        assertBigDecimal("0", response.monthToDateTotal());
        assertBigDecimal("0", response.monthToDateOut());
        assertBigDecimal("0", response.monthToDateIn());
        assertEquals(0, response.monthToDateCount());
    }

    @Test
    void createCategoryRejectsAMissingColor() {
        CategoryDraft draft = draft("Rent", null, "EXPENSE", defaultAccount().getId(), null);

        assertStatus(HttpStatus.BAD_REQUEST, () -> categoryController.createCategory(draft));
    }

    @Test
    void createCategoryRejectsAMissingDirection() {
        CategoryDraft draft = draft("Rent", "#f97316", null, defaultAccount().getId(), null);

        assertStatus(HttpStatus.BAD_REQUEST, () -> categoryController.createCategory(draft));
    }

    @Test
    void createCategoryRejectsAMissingOrUnknownAccount() {
        assertStatus(HttpStatus.BAD_REQUEST, () -> categoryController.createCategory(draft("Rent", "#f97316", "EXPENSE", null, null)));
        assertStatus(HttpStatus.NOT_FOUND, () -> categoryController.createCategory(draft("Rent", "#f97316", "EXPENSE", -1L, null)));
    }

    @Test
    void listsOnlyTheRequestedAccountsCategories() {
        Account other = saveAccount("Other");
        CategoryResponse mine = categoryController.createCategory(draft("Mine", "#f97316", "EXPENSE", defaultAccount().getId(), null));
        CategoryResponse theirs = categoryController.createCategory(draft("Theirs", "#f97316", "EXPENSE", other.getId(), null));

        List<CategoryResponse> defaultList = categoryController.getCategories(defaultAccount().getId(), "2026-09");
        List<CategoryResponse> otherList = categoryController.getCategories(other.getId(), "2026-09");

        assertTrue(defaultList.stream().anyMatch(c -> c.id().equals(mine.id())));
        assertFalse(defaultList.stream().anyMatch(c -> c.id().equals(theirs.id())));
        assertEquals(List.of(theirs.id()), otherList.stream().map(CategoryResponse::id).toList());
        assertEquals(other.getId().toString(), otherList.getFirst().accountId());
    }

    @Test
    void aTransferCategoryCreatesAFlippedMirrorOnTheTargetAccount() {
        Account savings = saveAccount("Savings");

        CategoryResponse created = categoryController.createCategory(
                draft("To Savings", "#8b7cf6", "EXPENSE", defaultAccount().getId(), savings.getId()));

        assertEquals(savings.getId().toString(), created.targetAccountId());
        assertNotNull(created.counterpartId());
        CategoryResponse mirror = findCategory(categoryController.getCategories(savings.getId(), "2026-09"), Long.valueOf(created.counterpartId()));
        assertEquals("To Savings", mirror.name());
        assertEquals("#8b7cf6", mirror.color());
        assertEquals("INCOME", mirror.direction());
        assertEquals(savings.getId().toString(), mirror.accountId());
        assertEquals(defaultAccount().getId().toString(), mirror.targetAccountId());
        assertEquals(created.id(), mirror.counterpartId());
        assertNull(mirror.warningThreshold());
    }

    @Test
    void createCategoryRejectsAnInvalidTarget() {
        Long source = defaultAccount().getId();

        assertStatus(HttpStatus.BAD_REQUEST, () -> categoryController.createCategory(draft("X", "#f97316", "EXPENSE", source, source)));
        assertStatus(HttpStatus.NOT_FOUND, () -> categoryController.createCategory(draft("X", "#f97316", "EXPENSE", source, -1L)));
    }

    @Test
    void updatingACategoryKeepsItsCounterpartInSync() {
        Account savings = saveAccount("Savings");
        CategoryResponse created = categoryController.createCategory(
                draft("To Savings", "#8b7cf6", "EXPENSE", defaultAccount().getId(), savings.getId()));

        categoryController.updateCategory(Long.valueOf(created.id()),
                new CategoryDraft("Savings plan", "#112233", "INCOME", new BigDecimal("300"), null, null));

        CategoryResponse mirror = findCategory(categoryController.getCategories(savings.getId(), "2026-09"), Long.valueOf(created.counterpartId()));
        assertEquals("Savings plan", mirror.name());
        assertEquals("#112233", mirror.color());
        assertEquals("EXPENSE", mirror.direction());
        assertNull(mirror.warningThreshold());
    }

    @Test
    void theAccountAndTargetOfACategoryCanNotBeChanged() {
        Account savings = saveAccount("Savings");
        Account other = saveAccount("Other");
        CategoryResponse created = categoryController.createCategory(
                draft("To Savings", "#8b7cf6", "EXPENSE", defaultAccount().getId(), savings.getId()));
        Long id = Long.valueOf(created.id());

        assertStatus(HttpStatus.BAD_REQUEST, () -> categoryController.updateCategory(id, draft("To Savings", "#8b7cf6", "EXPENSE", other.getId(), null)));
        assertStatus(HttpStatus.BAD_REQUEST, () -> categoryController.updateCategory(id, draft("To Savings", "#8b7cf6", "EXPENSE", null, other.getId())));
    }

    @Test
    void updateCategoryRejectsAnUnknownCategory() {
        assertStatus(HttpStatus.NOT_FOUND, () -> categoryController.updateCategory(-1L, draft("X", "#f97316", "EXPENSE", null, null)));
    }

    @Test
    void deletingATransferCategoryDeletesItsCounterpart() {
        Account savings = saveAccount("Savings");
        CategoryResponse created = categoryController.createCategory(
                draft("To Savings", "#8b7cf6", "EXPENSE", defaultAccount().getId(), savings.getId()));

        categoryController.deleteCategory(Long.valueOf(created.id()), null);
        entityManager.flush();
        entityManager.clear();

        assertFalse(categoryRepository.existsById(Long.valueOf(created.id())));
        assertFalse(categoryRepository.existsById(Long.valueOf(created.counterpartId())));
    }

    @Test
    void deletingIsBlockedWhileTheCounterpartHasTransactions() {
        Account savings = saveAccount("Savings");
        CategoryResponse created = categoryController.createCategory(
                draft("To Savings", "#8b7cf6", "EXPENSE", defaultAccount().getId(), savings.getId()));
        Category mirror = categoryRepository.findById(Long.valueOf(created.counterpartId())).orElseThrow();
        saveTransaction(mirror, "500.0000", LocalDate.of(2026, 9, 5), savings);
        entityManager.flush();

        assertStatus(HttpStatus.CONFLICT, () -> categoryController.deleteCategory(Long.valueOf(created.id()), null));
        assertTrue(categoryRepository.existsById(Long.valueOf(created.id())));
        assertTrue(categoryRepository.existsById(mirror.getId()));
    }

    @Test
    void reassigningIntoACategoryOfAnotherAccountIsRejected() {
        Account other = saveAccount("Other");
        CategoryResponse doomed = categoryController.createCategory(draft("Doomed", "#f97316", "EXPENSE", defaultAccount().getId(), null));
        CategoryResponse foreign = categoryController.createCategory(draft("Foreign", "#f97316", "EXPENSE", other.getId(), null));
        Category doomedCategory = categoryRepository.findById(Long.valueOf(doomed.id())).orElseThrow();
        saveTransaction(doomedCategory, "-10.0000", LocalDate.of(2026, 9, 5));
        entityManager.flush();
        Long transactionId = transactionRepository.findAllForCategory(doomedCategory).getFirst().getId();

        CategoryDeleteRequest request = new CategoryDeleteRequest(
                List.of(new CategoryReassignment(transactionId, Long.valueOf(foreign.id()))));

        assertStatus(HttpStatus.BAD_REQUEST, () -> categoryController.deleteCategory(Long.valueOf(doomed.id()), request));
    }

    private Account saveAccount(String name) {
        Account account = new Account();
        account.setName(name);
        account.setIcon("card");
        return accountRepository.save(account);
    }

    private static CategoryDraft draft(String name, String color, String direction, Long accountId, Long targetAccountId) {
        return new CategoryDraft(name, color, direction, null, accountId, targetAccountId);
    }

    private static void assertStatus(HttpStatus expected, Runnable action) {
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, action::run);
        assertEquals(expected, exception.getStatusCode());
    }

    private void saveTransaction(Category category, String amount, LocalDate txDate) {
        saveTransaction(category, amount, txDate, defaultAccount());
    }

    private void saveTransaction(Category category, String amount, LocalDate txDate, Account account) {
        Transaction transaction = new Transaction();
        transaction.setTxDate(txDate);
        transaction.setAmount(new BigDecimal(amount));
        transaction.setCurrency("CHF");
        transaction.setDescription("Test");
        transaction.setCategory(category);
        transaction.setAccount(account);
        transactionRepository.save(transaction);
    }

    private Account defaultAccount() {
        return accountRepository.findAllByOrderByIdAsc().getFirst();
    }

    private static CategoryResponse findCategory(List<CategoryResponse> responses, Long id) {
        return responses.stream()
                .filter(response -> response.id().equals(id.toString()))
                .findFirst()
                .orElseThrow();
    }

    private static void assertBigDecimal(String expected, BigDecimal actual) {
        assertEquals(0, new BigDecimal(expected).compareTo(actual), () -> expected + " != " + actual);
    }
}
