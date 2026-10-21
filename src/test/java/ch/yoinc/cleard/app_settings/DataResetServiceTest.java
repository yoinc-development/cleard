package ch.yoinc.cleard.app_settings;

import ch.yoinc.cleard.account.Account;
import ch.yoinc.cleard.account.AccountRepository;
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
    private AccountRepository accountRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    void deletesAllTransactionsAndCategories() {
        Category groceries = saveCategory("Groceries");
        Category rent = saveCategory("Rent");
        saveTransaction(groceries);
        saveTransaction(groceries);
        saveTransaction(rent);

        service.clearAllData();
        entityManager.clear();

        assertEquals(0, transactionRepository.count());
        assertEquals(0, categoryRepository.count());
    }

    @Test
    void deletesTheTagsOfTheTransactions() {
        Transaction tagged = saveTransaction(saveCategory("Groceries"));
        tagged.getTags().add("weekly");
        entityManager.flush();

        service.clearAllData();
        entityManager.clear();

        assertEquals(0, transactionRepository.count());
        assertEquals(0, ((Number) entityManager.createNativeQuery("SELECT COUNT(*) FROM transaction_tags").getSingleResult()).intValue());
    }

    @Test
    void replacesAllAccountsWithASingleDefault() {
        Account extra = new Account();
        extra.setName("Savings");
        extra.setIcon("savings");
        extra = accountRepository.save(extra);
        controller.updateSettings(new AppSettingsRequest(null, null, null, extra.getId()));

        service.clearAllData();
        entityManager.clear();

        assertEquals(1, accountRepository.count());
        Account remaining = accountRepository.findAllByOrderByIdAsc().get(0);
        assertEquals("Default", remaining.getName());
        assertEquals(remaining.getId().toString(), controller.getSettings().activeAccountId());
    }

    @Test
    void deletesLinkedTransferCategories() {
        Account savings = new Account();
        savings.setName("Savings");
        savings.setIcon("savings");
        savings = accountRepository.save(savings);
        Category source = saveCategory("To Savings");
        Category mirror = new Category();
        mirror.setName("To Savings");
        mirror.setColor("#ff8000");
        mirror.setDirection("INCOME");
        mirror.setAccount(savings);
        mirror.setTargetAccount(source.getAccount());
        mirror.setCounterpart(source);
        mirror = categoryRepository.save(mirror);
        source.setTargetAccount(savings);
        source.setCounterpart(mirror);
        categoryRepository.save(source);
        entityManager.flush();

        service.clearAllData();
        entityManager.clear();

        assertEquals(0, categoryRepository.count());
        assertEquals(1, accountRepository.count());
    }

    @Test
    void keepsTheSettings() {
        controller.updateSettings(new AppSettingsRequest("EUR", null, null, null));

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
        category.setAccount(accountRepository.findAllByOrderByIdAsc().get(0));
        Category saved = categoryRepository.save(category);
        entityManager.flush();
        return saved;
    }

    private Transaction saveTransaction(Category category) {
        Transaction transaction = new Transaction();
        transaction.setTxDate(LocalDate.of(2026, 9, 5));
        transaction.setAmount(new BigDecimal("-10.0000"));
        transaction.setCurrency("CHF");
        transaction.setDescription("Test");
        transaction.setCategory(category);
        transaction.setAccount(accountRepository.findAllByOrderByIdAsc().get(0));
        Transaction saved = transactionRepository.save(transaction);
        entityManager.flush();
        return saved;
    }
}
