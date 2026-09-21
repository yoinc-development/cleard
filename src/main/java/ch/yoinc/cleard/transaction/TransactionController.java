package ch.yoinc.cleard.transaction;

import ch.yoinc.cleard.category.Category;
import ch.yoinc.cleard.category.CategoryRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;

    public TransactionController(TransactionRepository transactionRepository, CategoryRepository categoryRepository) {
        this.transactionRepository = transactionRepository;
        this.categoryRepository = categoryRepository;
    }

    @GetMapping
    public TransactionPageResponse getTransactions(
            @RequestParam String month,
            @RequestParam(required = false) List<String> categoryIds,
            @RequestParam(required = false) List<String> tags,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "0") int offset
    ) {
        YearMonth yearMonth = YearMonth.parse(month);
        LocalDate from = yearMonth.atDay(1);
        LocalDate to = yearMonth.atEndOfMonth();

        List<Long> parsedCategoryIds = (categoryIds == null || categoryIds.isEmpty())
                ? null
                : categoryIds.stream().map(Long::parseLong).toList();
        String searchTerm = (q == null || q.isBlank()) ? null : q.trim();

        List<Transaction> page = transactionRepository.findForMonth(from, to, parsedCategoryIds, searchTerm, PageRequest.of(offset / limit, limit));
        long filteredCount = transactionRepository.countForMonth(from, to, parsedCategoryIds, searchTerm);

        List<TransactionResponse> transactions = page.stream().map(TransactionResponse::from).toList();
        long remainingCount = Math.max(0, filteredCount - (offset + transactions.size()));

        return new TransactionPageResponse(transactions, filteredCount, remainingCount);
    }

    @GetMapping("summary")
    public MonthSummaryResponse getMonthSummary(@RequestParam String month) {
        YearMonth yearMonth = YearMonth.parse(month);
        LocalDate from = yearMonth.atDay(1);
        LocalDate to = yearMonth.atEndOfMonth();

        List<Transaction> rows = transactionRepository.findAllForMonth(from, to);
        return MonthSummaryResponse.from(rows);
    }

    @PostMapping
    public TransactionResponse createTransaction(@RequestBody TransactionDraft transactionDraft) {
        Optional<Category> optionalCategory = categoryRepository.findById(transactionDraft.getCategoryId());
        Category category = optionalCategory.orElse(null);

        Transaction result = transactionRepository.save(toTransaction(transactionDraft, category));
        return TransactionResponse.from(result);
    }

    @PutMapping("{id}")
    public TransactionResponse updateTransaction(@PathVariable Long id, @RequestBody TransactionDraft transactionDraft) {
        Optional<Category> optionalCategory = categoryRepository.findById(transactionDraft.getCategoryId());
        Category category = optionalCategory.orElse(null);

        Transaction transaction = toTransaction(transactionDraft, category);
        transaction.setId(id);

        Transaction result = transactionRepository.save(transaction);
        return TransactionResponse.from(result);
    }

    @DeleteMapping("{id}")
    public void deleteTransaction(@PathVariable Long id) {
        transactionRepository.deleteById(id);
    }

    private Transaction toTransaction(TransactionDraft transactionDraft, Category category) {
        Transaction transaction = new Transaction();

        transaction.setTxDate(transactionDraft.getTxDate());
        transaction.setAmount(transactionDraft.getAmount());
        transaction.setCurrency(transactionDraft.getCurrency());
        transaction.setDescription(transactionDraft.getDescription());
        transaction.setCategory(category);

        return transaction;
    }
}
