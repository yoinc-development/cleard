package ch.yoinc.cleard.app_settings;

import ch.yoinc.cleard.category.Category;
import ch.yoinc.cleard.category.CategoryRepository;
import ch.yoinc.cleard.transaction.Transaction;
import ch.yoinc.cleard.transaction.TransactionRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@Transactional
class DataResetServiceTest {

    @Autowired
    private AppSettingsController controller;

    @Autowired
    private DataResetService service;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private AppSettingsRepository appSettingsRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    void deletesAllTransactionsAndCategories() {
        Category groceries = saveCategory("Groceries");
        saveCategory("Rent");
        saveTransaction(groceries);
        saveTransaction(groceries);
        saveTransaction(null);

        service.clearAllData();
        entityManager.clear();

        assertEquals(0, transactionRepository.count());
        assertEquals(0, categoryRepository.count());
    }

    @Test
    void keepsTheSettings() {
        controller.updateSettings(new AppSettingsRequest("EUR"));

        service.clearAllData();
        entityManager.clear();

        assertEquals("EUR", controller.getSettings().currency());
        assertEquals(1, appSettingsRepository.count());
    }

    @Test
    void isANoOpOnAnEmptyDatabase() {
        service.clearAllData();

        assertEquals(0, transactionRepository.count());
        assertEquals(0, categoryRepository.count());
    }

    @Test
    void theEndpointDelegatesToTheService() {
        saveTransaction(saveCategory("Groceries"));

        controller.clearAllData();
        entityManager.clear();

        assertEquals(0, transactionRepository.count());
        assertEquals(0, categoryRepository.count());
    }

    private Category saveCategory(String name) {
        Category category = new Category();
        category.setName(name);
        category.setColor("#ff8000");
        category.setDirection("EXPENSE");
        Category saved = categoryRepository.save(category);
        entityManager.flush();
        return saved;
    }

    private void saveTransaction(Category category) {
        Transaction transaction = new Transaction();
        transaction.setTxDate(LocalDate.of(2026, 9, 5));
        transaction.setAmount(new BigDecimal("-10.0000"));
        transaction.setCurrency("CHF");
        transaction.setDescription("Test");
        transaction.setCategory(category);
        transactionRepository.save(transaction);
        entityManager.flush();
    }
}
