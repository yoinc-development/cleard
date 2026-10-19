package ch.yoinc.cleard.category;

import ch.yoinc.cleard.transaction.Transaction;
import ch.yoinc.cleard.transaction.TransactionRepository;
import ch.yoinc.cleard.transaction.TransactionResponse;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;

    public CategoryController(CategoryRepository categoryRepository, TransactionRepository transactionRepository) {
        this.categoryRepository = categoryRepository;
        this.transactionRepository = transactionRepository;
    }

    /**
     * Lists all categories with their month-to-date usage mixed in.
     */
    @GetMapping
    public List<CategoryResponse> getCategories(@RequestParam Long accountId, @RequestParam String month) {
        YearMonth yearMonth = YearMonth.parse(month);
        LocalDate from = yearMonth.atDay(1);
        LocalDate to = yearMonth.atEndOfMonth();

        Map<Long, List<Transaction>> byCategoryId = transactionRepository.findAllForMonth(accountId, from, to).stream()
                .collect(Collectors.groupingBy(t -> t.getCategory().getId()));

        return categoryRepository.findAllAlphabetical().stream()
                .map(category -> {
                    List<Transaction> rows = byCategoryId.getOrDefault(category.getId(), List.of());
                    return CategoryResponse.from(category, MonthToDateTotals.of(rows, category.getDirection()));
                })
                .toList();
    }

    @PostMapping
    public CategoryResponse createCategory(@RequestBody Category categoryDraft) {
        validateDraft(categoryDraft);
        Category category = categoryRepository.save(categoryDraft);
        return toResponse(category);
    }

    @PutMapping("{id}")
    public CategoryResponse updateCategory(@PathVariable Long id, @RequestBody Category categoryDraft) {
        validateDraft(categoryDraft);
        categoryDraft.setId(id);
        Category category = categoryRepository.save(categoryDraft);
        return toResponse(category);
    }

    @DeleteMapping("{id}")
    @Transactional
    public void deleteCategory(@PathVariable Long id,
                               @RequestBody(required = false) CategoryDeleteRequest request) {
        List<CategoryReassignment> reassignments =
                request == null || request.reassignments() == null ? List.of() : request.reassignments();
        if (!reassignments.isEmpty()) {
            reassignments
                    .forEach(reassignment -> {
                        if (reassignment.categoryId() == null) {
                            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No reassignment category is given");
                        }

                        if (reassignment.categoryId().equals(id)) {
                            throw new ResponseStatusException(HttpStatus.CONFLICT, "The reassignment category can not be the same as the category to be deleted");
                        }

                        if (reassignment.transactionId() == null) {
                            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No transaction is given");
                        }

                        Category targetCategory = categoryRepository.findById(reassignment.categoryId()).orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND, "Target category " + reassignment.categoryId() + " not found"));
                        transactionRepository.migrateCategoryOnTransaction(reassignment.transactionId(), id, targetCategory);
                    });
        }

        Category category = categoryRepository.findById(id).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Category to be deleted " + id + " not found"));

        if (transactionRepository.existsByCategory(category)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Category " + category.getName() + " still has transactions assigned to it");
        }

        categoryRepository.deleteById(id);
    }

    @GetMapping("{categoryId}/transactions")
    public List<TransactionResponse> getTransactions(@PathVariable Long categoryId) {
        Category category = categoryRepository.findById(categoryId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category " + categoryId + " not found"));
        return transactionRepository.findAllForCategory(category).stream()
                .map(TransactionResponse::from)
                .toList();
    }

    private void validateDraft(Category categoryDraft) {
        if (categoryDraft.getName() == null || categoryDraft.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No name is given");
        }

        if (categoryDraft.getColor() == null || categoryDraft.getColor().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No color is given");
        }

        if (categoryDraft.getDirection() == null || categoryDraft.getDirection().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No direction is given");
        }
    }

    private CategoryResponse toResponse(Category category) {
        return CategoryResponse.from(category, MonthToDateTotals.of(List.of(), category.getDirection()));
    }
}
