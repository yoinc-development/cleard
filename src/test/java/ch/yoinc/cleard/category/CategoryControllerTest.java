package ch.yoinc.cleard.category;

import ch.yoinc.cleard.transaction.Transaction;
import ch.yoinc.cleard.transaction.TransactionRepository;
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
class CategoryControllerTest {

    @Autowired
    private CategoryController categoryController;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    void netsOffsettingTransactionsInTheCategoryDirection() {
        Category groceries = new Category();
        groceries.setName("Groceries");
        groceries.setColor("#8b7cf6");
        groceries.setDirection("EXPENSE");
        groceries = categoryRepository.save(groceries);

        saveTransaction(groceries, "-50.0000", LocalDate.of(2026, 9, 5));
        saveTransaction(groceries, "30.0000", LocalDate.of(2026, 9, 10));
        entityManager.flush();

        CategoryResponse response = findCategory(categoryController.getCategories("2026-09"), groceries.getId());

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
        rent = categoryRepository.save(rent);
        entityManager.flush();

        CategoryResponse response = findCategory(categoryController.getCategories("2026-09"), rent.getId());

        assertBigDecimal("0", response.monthToDateTotal());
        assertBigDecimal("0", response.monthToDateOut());
        assertBigDecimal("0", response.monthToDateIn());
        assertEquals(0, response.monthToDateCount());
    }

    private void saveTransaction(Category category, String amount, LocalDate txDate) {
        Transaction transaction = new Transaction();
        transaction.setTxDate(txDate);
        transaction.setAmount(new BigDecimal(amount));
        transaction.setCurrency("CHF");
        transaction.setCategory(category);
        transactionRepository.save(transaction);
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
