package ch.yoinc.cleard.category;

import ch.yoinc.cleard.transaction.Transaction;
import ch.yoinc.cleard.transaction.TransactionRepository;
import ch.yoinc.cleard.transaction.TransactionResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class CategoryDeleteTest {

    @Autowired
    private CategoryController categoryController;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private TransactionTemplate transactionTemplate;

    @AfterEach
    void cleanUp() {
        transactionRepository.deleteAll();
        categoryRepository.deleteAll();
    }

    @Test
    void deletesACategoryWithoutTransactions() {
        Category empty = saveCategory("Empty");

        categoryController.deleteCategory(empty.getId(), null);

        assertFalse(categoryRepository.existsById(empty.getId()));
    }

    @Test
    void deletesACategoryAfterReassigningAllTransactionsAcrossMonths() {
        Category doomed = saveCategory("Doomed");
        Category target = saveCategory("Target");
        Transaction september = saveTransaction(doomed, LocalDate.of(2026, 9, 5));
        Transaction march = saveTransaction(doomed, LocalDate.of(2025, 3, 1));

        categoryController.deleteCategory(doomed.getId(), request(
                reassignment(september, target),
                reassignment(march, target)));

        assertFalse(categoryRepository.existsById(doomed.getId()));
        assertEquals(target.getId(), categoryIdOf(september));
        assertEquals(target.getId(), categoryIdOf(march));
    }

    @Test
    void rejectsDeleteWhenNoReassignmentsAreGiven() {
        Category doomed = saveCategory("Doomed");
        Transaction kept = saveTransaction(doomed, LocalDate.of(2026, 9, 5));

        assertStatus(HttpStatus.CONFLICT, () -> categoryController.deleteCategory(doomed.getId(), null));
        assertStatus(HttpStatus.CONFLICT, () -> categoryController.deleteCategory(doomed.getId(), request()));

        assertTrue(categoryRepository.existsById(doomed.getId()));
        assertEquals(doomed.getId(), categoryIdOf(kept));
    }

    @Test
    void rejectsPartialReassignmentAndRollsBackTheOnesAlreadyApplied() {
        Category doomed = saveCategory("Doomed");
        Category target = saveCategory("Target");
        Transaction moved = saveTransaction(doomed, LocalDate.of(2026, 9, 5));
        Transaction forgotten = saveTransaction(doomed, LocalDate.of(2026, 9, 6));

        assertStatus(HttpStatus.CONFLICT, () -> categoryController.deleteCategory(
                doomed.getId(), request(reassignment(moved, target))));

        assertTrue(categoryRepository.existsById(doomed.getId()));
        assertEquals(doomed.getId(), categoryIdOf(moved));
        assertEquals(doomed.getId(), categoryIdOf(forgotten));
    }

    @Test
    void rejectsUnknownTargetCategoryAndRollsBackTheOnesAlreadyApplied() {
        Category doomed = saveCategory("Doomed");
        Category target = saveCategory("Target");
        Transaction first = saveTransaction(doomed, LocalDate.of(2026, 9, 5));
        Transaction second = saveTransaction(doomed, LocalDate.of(2026, 9, 6));

        assertStatus(HttpStatus.NOT_FOUND, () -> categoryController.deleteCategory(doomed.getId(), request(
                reassignment(first, target),
                new CategoryReassignment(second.getId(), -1L))));

        assertTrue(categoryRepository.existsById(doomed.getId()));
        assertEquals(doomed.getId(), categoryIdOf(first));
        assertEquals(doomed.getId(), categoryIdOf(second));
    }

    @Test
    void rejectsReassigningATransactionIntoTheCategoryBeingDeleted() {
        Category doomed = saveCategory("Doomed");
        Transaction kept = saveTransaction(doomed, LocalDate.of(2026, 9, 5));

        assertStatus(HttpStatus.CONFLICT, () -> categoryController.deleteCategory(
                doomed.getId(), request(reassignment(kept, doomed))));

        assertTrue(categoryRepository.existsById(doomed.getId()));
        assertEquals(doomed.getId(), categoryIdOf(kept));
    }

    @Test
    void doesNotMoveTransactionsThatBelongToAnotherCategory() {
        Category doomed = saveCategory("Doomed");
        Category other = saveCategory("Other");
        Category target = saveCategory("Target");
        Transaction own = saveTransaction(doomed, LocalDate.of(2026, 9, 5));
        Transaction foreign = saveTransaction(other, LocalDate.of(2026, 9, 6));

        categoryController.deleteCategory(doomed.getId(), request(
                reassignment(own, target),
                reassignment(foreign, target)));

        assertFalse(categoryRepository.existsById(doomed.getId()));
        assertEquals(target.getId(), categoryIdOf(own));
        assertEquals(other.getId(), categoryIdOf(foreign));
    }

    @Test
    void rejectsDeletingAnUnknownCategory() {
        assertStatus(HttpStatus.NOT_FOUND, () -> categoryController.deleteCategory(-1L, null));
    }

    @Test
    void rejectsReassignmentsWithMissingIds() {
        Category doomed = saveCategory("Doomed");
        Category target = saveCategory("Target");
        Transaction kept = saveTransaction(doomed, LocalDate.of(2026, 9, 5));

        assertStatus(HttpStatus.BAD_REQUEST, () -> categoryController.deleteCategory(
                doomed.getId(), request(new CategoryReassignment(kept.getId(), null))));
        assertStatus(HttpStatus.BAD_REQUEST, () -> categoryController.deleteCategory(
                doomed.getId(), request(new CategoryReassignment(null, target.getId()))));

        assertTrue(categoryRepository.existsById(doomed.getId()));
        assertEquals(doomed.getId(), categoryIdOf(kept));
    }

    @Test
    void searchReturnsTheTransactionsOfACategoryAcrossAllMonths() {
        Category category = saveCategory("Groceries");
        Category other = saveCategory("Other");
        saveTransaction(category, LocalDate.of(2026, 9, 5));
        saveTransaction(category, LocalDate.of(2025, 3, 1));
        saveTransaction(other, LocalDate.of(2026, 9, 6));

        List<TransactionResponse> result = categoryController.getTransactions(category.getId());

        assertEquals(2, result.size());
    }

    @Test
    void searchRejectsAnUnknownCategory() {
        assertStatus(HttpStatus.NOT_FOUND, () -> categoryController.getTransactions(-1L));
    }

    private Category saveCategory(String name) {
        Category category = new Category();
        category.setName(name);
        category.setColor("#ff8000");
        category.setDirection("EXPENSE");
        return categoryRepository.save(category);
    }

    private Transaction saveTransaction(Category category, LocalDate txDate) {
        Transaction transaction = new Transaction();
        transaction.setTxDate(txDate);
        transaction.setAmount(new BigDecimal("-10.0000"));
        transaction.setCurrency("CHF");
        transaction.setDescription("test");
        transaction.setCategory(category);
        return transactionRepository.save(transaction);
    }

    private Long categoryIdOf(Transaction transaction) {
        return transactionTemplate.execute(status ->
                transactionRepository.findById(transaction.getId()).orElseThrow().getCategory().getId());
    }

    private static CategoryReassignment reassignment(Transaction transaction, Category target) {
        return new CategoryReassignment(transaction.getId(), target.getId());
    }

    private static CategoryDeleteRequest request(CategoryReassignment... reassignments) {
        return new CategoryDeleteRequest(List.of(reassignments));
    }

    private static void assertStatus(HttpStatus expected, Runnable action) {
        ResponseStatusException thrown = assertThrows(ResponseStatusException.class, action::run);
        assertEquals(expected.value(), thrown.getStatusCode().value());
    }
}
