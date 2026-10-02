package ch.yoinc.cleard.app_settings;

import ch.yoinc.cleard.category.CategoryRepository;
import ch.yoinc.cleard.transaction.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DataResetService {

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;

    public DataResetService(TransactionRepository transactionRepository, CategoryRepository categoryRepository) {
        this.transactionRepository = transactionRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional
    public void clearAllData() {
        transactionRepository.deleteAllInBatch();
        categoryRepository.deleteAllInBatch();
    }
}
