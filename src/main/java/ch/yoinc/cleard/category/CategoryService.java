package ch.yoinc.cleard.category;

import ch.yoinc.cleard.transaction.TransactionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;

    public CategoryService(CategoryRepository categoryRepository, TransactionRepository transactionRepository) {
        this.categoryRepository = categoryRepository;
        this.transactionRepository = transactionRepository;
    }

    @Transactional
    public void deleteWithCounterpart(Category category) {
        Category counterpart = category.getCounterpart();
        if (counterpart != null) {
            if (transactionRepository.existsByCategory(counterpart)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "The linked category " + counterpart.getName()
                        + " on the other account still has transactions assigned to it");
            }
            // Unlink both sides first, so the self-reference does not block the deletion.
            category.setCounterpart(null);
            counterpart.setCounterpart(null);
            categoryRepository.saveAll(List.of(category, counterpart));
            categoryRepository.flush();
            categoryRepository.delete(counterpart);
        }

        categoryRepository.delete(category);
    }
}
