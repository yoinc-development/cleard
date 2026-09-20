package ch.yoinc.cleard.category;

import ch.yoinc.cleard.transaction.Transaction;
import ch.yoinc.cleard.transaction.TransactionRepository;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
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
    public List<CategoryResponse> getCategories(@RequestParam String month) {
        YearMonth yearMonth = YearMonth.parse(month);
        LocalDate from = yearMonth.atDay(1);
        LocalDate to = yearMonth.atEndOfMonth();

        Map<Long, List<Transaction>> byCategoryId = transactionRepository.findAllForMonth(from, to).stream()
                .filter(t -> t.getCategory() != null)
                .collect(Collectors.groupingBy(t -> t.getCategory().getId()));

        return categoryRepository.findAll().stream()
                .map(category -> {
                    List<Transaction> rows = byCategoryId.getOrDefault(category.getId(), List.of());
                    return CategoryResponse.from(category, sumAbsoluteAmounts(rows), rows.size());
                })
                .toList();
    }

    @PostMapping
    public CategoryResponse createCategory(@RequestBody Category categoryDraft) {
        Category category = categoryRepository.save(categoryDraft);
        return toResponse(category);
    }

    @PutMapping("{id}")
    public CategoryResponse updateCategory(@PathVariable Long id, @RequestBody Category categoryDraft) {
        categoryDraft.setId(id);
        Category category = categoryRepository.save(categoryDraft);
        return toResponse(category);
    }

    private CategoryResponse toResponse(Category category) {
        YearMonth now = YearMonth.now();
        List<Transaction> rows = transactionRepository.findAllForMonth(now.atDay(1), now.atEndOfMonth()).stream()
                .filter(t -> t.getCategory() != null && t.getCategory().getId().equals(category.getId()))
                .toList();
        return CategoryResponse.from(category, sumAbsoluteAmounts(rows), rows.size());
    }

    private static BigDecimal sumAbsoluteAmounts(List<Transaction> rows) {
        return rows.stream().map(t -> t.getAmount().abs()).reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
