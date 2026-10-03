package ch.yoinc.cleard.app_settings;

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

        AppSettingsResponse response = controller.updateSettings(new AppSettingsRequest("EUR", null));
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

        controller.updateSettings(new AppSettingsRequest("EUR", null));

        assertEquals("EUR", controller.getSettings().currency());
    }

    @Test
    void normalisesTheCurrencyCode() {
        assertEquals("EUR", controller.updateSettings(new AppSettingsRequest(" eur ", null)).currency());
    }

    @Test
    void rejectsAnUnknownCurrencyAndChangesNothing() {
        Transaction transaction = saveTransaction("CHF");

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> controller.updateSettings(new AppSettingsRequest("XXXX", null)));
        entityManager.clear();

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        assertEquals("CHF", controller.getSettings().currency());
        assertEquals("CHF", transactionRepository.findById(transaction.getId()).orElseThrow().getCurrency());
    }

    @Test
    void leavesSettingsAloneWhenTheRequestOmitsThem() {
        Transaction transaction = saveTransaction("CHF");

        assertEquals("CHF", controller.updateSettings(new AppSettingsRequest(null, null)).currency());
        entityManager.clear();

        assertEquals("CHF", transactionRepository.findById(transaction.getId()).orElseThrow().getCurrency());
    }

    @Test
    void localeIsNullByDefault() {
        assertNull(controller.getSettings().locale());
    }

    @Test
    void storesAndReturnsTheLocale() {
        assertEquals("de", controller.updateSettings(new AppSettingsRequest(null, "de")).locale());
        assertEquals("de", controller.getSettings().locale());
    }

    @Test
    void normalisesTheLocale() {
        assertEquals("de", controller.updateSettings(new AppSettingsRequest(null, " DE ")).locale());
    }

    @Test
    void rejectsAnUnsupportedLocaleAndChangesNothing() {
        controller.updateSettings(new AppSettingsRequest(null, "de"));

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> controller.updateSettings(new AppSettingsRequest(null, "fr")));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        assertEquals("de", controller.getSettings().locale());
    }

    @Test
    void blankLocaleResetsToTheSystemDefault() {
        controller.updateSettings(new AppSettingsRequest(null, "de"));
        entityManager.flush();

        assertNull(controller.updateSettings(new AppSettingsRequest(null, "")).locale());
    }

    @Test
    void omittedLocaleLeavesItAlone() {
        controller.updateSettings(new AppSettingsRequest(null, "de"));

        assertEquals("de", controller.updateSettings(new AppSettingsRequest("EUR", null)).locale());
    }

    @Test
    void currencyAndLocaleAreIndependent() {
        controller.updateSettings(new AppSettingsRequest("EUR", "de"));

        assertEquals("EUR", controller.updateSettings(new AppSettingsRequest(null, "en")).currency());
        assertEquals("en", controller.getSettings().locale());
    }

    private Transaction saveTransaction(String currency) {
        Transaction transaction = new Transaction();
        transaction.setTxDate(LocalDate.of(2026, 9, 5));
        transaction.setAmount(new BigDecimal("-10.0000"));
        transaction.setCurrency(currency);
        transaction.setDescription("Test");
        Transaction saved = transactionRepository.save(transaction);
        entityManager.flush();
        return saved;
    }

    @Test
    void versionInfoIsEmptyWithoutAnInstalledVersion() {
        assertEquals(new AppVersionResponse(null, null, false, null), controller.getVersion());
    }
}
