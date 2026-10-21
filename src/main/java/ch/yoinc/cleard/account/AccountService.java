package ch.yoinc.cleard.account;

import ch.yoinc.cleard.app_settings.AppSettings;
import ch.yoinc.cleard.app_settings.AppSettingsRepository;
import ch.yoinc.cleard.category.CategoryRepository;
import ch.yoinc.cleard.category.CategoryService;
import ch.yoinc.cleard.transaction.TransactionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final CategoryService categoryService;
    private final AppSettingsRepository appSettingsRepository;

    public AccountService(AccountRepository accountRepository, TransactionRepository transactionRepository,
                          CategoryRepository categoryRepository, CategoryService categoryService,
                          AppSettingsRepository appSettingsRepository) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.categoryRepository = categoryRepository;
        this.categoryService = categoryService;
        this.appSettingsRepository = appSettingsRepository;
    }

    @Transactional
    public void delete(Long id) {
        Account account = accountRepository.findById(id).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Account " + id + " not found"));

        if (accountRepository.count() <= 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The last account can not be deleted");
        }
        if (transactionRepository.existsByAccount(account)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Account " + account.getName() + " still has transactions");
        }

        categoryRepository.findAllByAccountId(id).forEach(categoryService::deleteWithCounterpart);
        categoryRepository.flush();

        appSettingsRepository.findById(AppSettings.ACTIVE_ACCOUNT_ID)
                .filter(setting -> setting.getValue().equals(id.toString()))
                .ifPresent(appSettingsRepository::delete);

        accountRepository.delete(account);
    }
}
