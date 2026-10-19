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
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@Transactional
class AppSettingsControllerTest {

    @Autowired
    private AppSettingsController controller;

    @Autowired
    private AppSettingsRepository repository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    void returnsTheSeededDefaultCurrency() {
        assertEquals("CHF", controller.getSettings().currency());
    }

    @Test
    void returnsTheStoredCurrency() {
        AppSettings currency = repository.findById(AppSettings.CURRENCY).orElseThrow();
        currency.setValue("EUR");
        repository.save(currency);
        entityManager.flush();

        assertEquals("EUR", controller.getSettings().currency());
    }

    @Test
    void fallsBackToTheDefaultWhenTheRowIsMissing() {
        repository.deleteById(AppSettings.CURRENCY);
        entityManager.flush();

        assertEquals("CHF", controller.getSettings().currency());
    }

    @Test
    void updatesTheCurrencyAndRelabelsAllTransactions() {
        Transaction first = saveTransaction("CHF");
        Transaction second = saveTransaction("USD");

        AppSettingsResponse response = controller.updateSettings(new AppSettingsRequest("EUR", null, null, null));
        entityManager.clear();

        assertEquals("EUR", response.currency());
        assertEquals("EUR", controller.getSettings().currency());
        assertEquals("EUR", transactionRepository.findById(first.getId()).orElseThrow().getCurrency());
        assertEquals("EUR", transactionRepository.findById(second.getId()).orElseThrow().getCurrency());
    }

    @Test
    void createsTheCurrencyRowIfItIsMissing() {
        repository.deleteById(AppSettings.CURRENCY);
        entityManager.flush();

        controller.updateSettings(new AppSettingsRequest("EUR", null, null, null));

        assertEquals("EUR", controller.getSettings().currency());
    }

    @Test
    void normalisesTheCurrencyCode() {
        assertEquals("EUR", controller.updateSettings(new AppSettingsRequest(" eur ", null, null, null)).currency());
    }

    @Test
    void rejectsAnUnknownCurrencyAndChangesNothing() {
        Transaction transaction = saveTransaction("CHF");

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> controller.updateSettings(new AppSettingsRequest("XXXX", null, null, null)));
        entityManager.clear();

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        assertEquals("CHF", controller.getSettings().currency());
        assertEquals("CHF", transactionRepository.findById(transaction.getId()).orElseThrow().getCurrency());
    }

    @Test
    void leavesSettingsAloneWhenTheRequestOmitsThem() {
        Transaction transaction = saveTransaction("CHF");

        assertEquals("CHF", controller.updateSettings(new AppSettingsRequest(null, null, null, null)).currency());
        entityManager.clear();

        assertEquals("CHF", transactionRepository.findById(transaction.getId()).orElseThrow().getCurrency());
    }

    @Test
    void localeIsNullByDefault() {
        assertNull(controller.getSettings().locale());
    }

    @Test
    void storesAndReturnsTheLocale() {
        assertEquals("de", controller.updateSettings(new AppSettingsRequest(null, "de", null, null)).locale());
        assertEquals("de", controller.getSettings().locale());
    }

    @Test
    void normalisesTheLocale() {
        assertEquals("de", controller.updateSettings(new AppSettingsRequest(null, " DE ", null, null)).locale());
    }

    @Test
    void rejectsAnUnsupportedLocaleAndChangesNothing() {
        controller.updateSettings(new AppSettingsRequest(null, "de", null, null));

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> controller.updateSettings(new AppSettingsRequest(null, "fr", null, null)));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        assertEquals("de", controller.getSettings().locale());
    }

    @Test
    void blankLocaleResetsToTheSystemDefault() {
        controller.updateSettings(new AppSettingsRequest(null, "de", null, null));
        entityManager.flush();

        assertNull(controller.updateSettings(new AppSettingsRequest(null, "", null, null)).locale());
    }

    @Test
    void omittedLocaleLeavesItAlone() {
        controller.updateSettings(new AppSettingsRequest(null, "de", null, null));

        assertEquals("de", controller.updateSettings(new AppSettingsRequest("EUR", null, null, null)).locale());
    }

    @Test
    void currencyAndLocaleAreIndependent() {
        controller.updateSettings(new AppSettingsRequest("EUR", "de", null, null));

        assertEquals("EUR", controller.updateSettings(new AppSettingsRequest(null, "en", null, null)).currency());
        assertEquals("en", controller.getSettings().locale());
    }

    @Test
    void themeDefaultsToDark() {
        assertEquals("dark", controller.getSettings().theme());
    }

    @Test
    void storesAndNormalisesTheTheme() {
        assertEquals("forest", controller.updateSettings(new AppSettingsRequest(null, null, " Forest ", null)).theme());
        assertEquals("forest", controller.getSettings().theme());
    }

    @Test
    void rejectsAnUnsupportedThemeAndChangesNothing() {
        controller.updateSettings(new AppSettingsRequest(null, null, "light", null));

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> controller.updateSettings(new AppSettingsRequest(null, null, "neon", null)));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        assertEquals("light", controller.getSettings().theme());
    }

    @Test
    void blankThemeResetsToTheDefault() {
        controller.updateSettings(new AppSettingsRequest(null, null, "sepia", null));
        entityManager.flush();

        assertEquals("dark", controller.updateSettings(new AppSettingsRequest(null, null, "", null)).theme());
    }

    @Test
    void omittedThemeLeavesItAlone() {
        controller.updateSettings(new AppSettingsRequest(null, null, "light", null));

        assertEquals("light", controller.updateSettings(new AppSettingsRequest("EUR", null, null, null)).theme());
    }

    @Test
    void activeAccountFallsBackToTheFirstAccount() {
        Long first = accountRepository.findAllByOrderByIdAsc().get(0).getId();

        assertEquals(first.toString(), controller.getSettings().activeAccountId());
    }

    @Test
    void storesTheActiveAccount() {
        Account savings = new Account();
        savings.setName("Savings");
        savings.setIcon("savings");
        savings = accountRepository.save(savings);

        AppSettingsResponse response = controller.updateSettings(new AppSettingsRequest(null, null, null, savings.getId()));

        assertEquals(savings.getId().toString(), response.activeAccountId());
    }

    @Test
    void rejectsAnUnknownActiveAccount() {
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> controller.updateSettings(new AppSettingsRequest(null, null, null, -1L)));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }

    private Transaction saveTransaction(String currency) {
        Category category = new Category();
        category.setName("Test");
        category.setColor("#ff8000");
        category.setDirection("EXPENSE");
        category = categoryRepository.save(category);

        Transaction transaction = new Transaction();
        transaction.setTxDate(LocalDate.of(2026, 9, 5));
        transaction.setAmount(new BigDecimal("-10.0000"));
        transaction.setCurrency(currency);
        transaction.setDescription("Test");
        transaction.setCategory(category);
        transaction.setAccount(accountRepository.findAllByOrderByIdAsc().get(0));
        Transaction saved = transactionRepository.save(transaction);
        entityManager.flush();
        return saved;
    }

    @Test
    void versionInfoIsEmptyWithoutAnInstalledVersion() {
        assertEquals(new AppVersionResponse(null, null, false, null), controller.getVersion());
    }
}
