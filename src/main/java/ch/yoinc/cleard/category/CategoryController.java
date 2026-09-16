package ch.yoinc.cleard.category;

import ch.yoinc.cleard.transaction.Transaction;
import ch.yoinc.cleard.transaction.TransactionRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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
                    BigDecimal total = rows.stream()
                            .map(t -> t.getAmount().abs())
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal warningThreshold = category.getWarningThreshold() != null
                            ? new BigDecimal(category.getWarningThreshold())
                            : null;
                    return new CategoryResponse(
                            category.getId().toString(),
                            category.getName(),
                            category.getColor(),
                            category.getDirection(),
                            total,
                            rows.size(),
                            warningThreshold
                    );
                })
                .toList();
    }
}
