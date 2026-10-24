package ch.yoinc.cleard.app_settings;

import ch.yoinc.cleard.account.Account;
import ch.yoinc.cleard.account.AccountRepository;
import ch.yoinc.cleard.category.CategoryRepository;
import ch.yoinc.cleard.transaction.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DataResetService {

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final AccountRepository accountRepository;
    private final AppSettingsRepository appSettingsRepository;

    public DataResetService(TransactionRepository transactionRepository, CategoryRepository categoryRepository,
                            AccountRepository accountRepository, AppSettingsRepository appSettingsRepository) {
        this.transactionRepository = transactionRepository;
        this.categoryRepository = categoryRepository;
        this.accountRepository = accountRepository;
        this.appSettingsRepository = appSettingsRepository;
    }

    @Transactional
    public void clearAllData() {
        transactionRepository.deleteAllInBatch();
        categoryRepository.deleteAllInBatch();
        accountRepository.deleteAllInBatch();

        Account defaultAccount = new Account();
        defaultAccount.setName(Account.DEFAULT_NAME);
        defaultAccount.setIcon(Account.DEFAULT_ICON);
        accountRepository.save(defaultAccount);
        appSettingsRepository.deleteById(AppSettings.ACTIVE_ACCOUNT_ID);
    }
}
