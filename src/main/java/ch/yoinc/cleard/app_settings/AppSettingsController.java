package ch.yoinc.cleard.app_settings;

import ch.yoinc.cleard.transaction.TransactionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Currency;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/settings")
public class AppSettingsController {

    private final AppSettingsRepository appSettingsRepository;
    private final TransactionRepository transactionRepository;
    private final VersionService versionService;
    private final DataResetService dataResetService;

    public AppSettingsController(AppSettingsRepository appSettingsRepository,
                                 TransactionRepository transactionRepository,
                                 VersionService versionService,
                                 DataResetService dataResetService) {
        this.appSettingsRepository = appSettingsRepository;
        this.transactionRepository = transactionRepository;
        this.versionService = versionService;
        this.dataResetService = dataResetService;
    }

    @GetMapping
    public AppSettingsResponse getSettings() {
        Map<String, String> values = appSettingsRepository.findAll().stream()
                .collect(Collectors.toMap(AppSettings::getKey, AppSettings::getValue));
        return AppSettingsResponse.from(values);
    }

    @PutMapping
    @Transactional
    public AppSettingsResponse updateSettings(@RequestBody AppSettingsRequest appSettingsRequest) {
        if (appSettingsRequest.currency() != null) {
            String currency = parseCurrency(appSettingsRequest.currency());
            saveValue(AppSettings.CURRENCY, currency);
            transactionRepository.updateAllCurrencies(currency);
        }
        return getSettings();
    }

    @GetMapping("version")
    public AppVersionResponse getVersion() {
        return versionService.getVersionInfo();
    }

    @DeleteMapping("data")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clearAllData() {
        dataResetService.clearAllData();
    }

    private void saveValue(String key, String value) {
        AppSettings setting = appSettingsRepository.findById(key).orElseGet(() -> {
            AppSettings created = new AppSettings();
            created.setKey(key);
            return created;
        });
        setting.setValue(value);
        appSettingsRepository.save(setting);
    }

    private static String parseCurrency(String code) {
        try {
            return Currency.getInstance(code.strip().toUpperCase(Locale.ROOT)).getCurrencyCode();
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown currency code: " + code);
        }
    }
}
