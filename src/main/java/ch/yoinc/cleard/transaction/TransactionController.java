package ch.yoinc.cleard.transaction;

import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionRepository transactionRepository;

    public TransactionController(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
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
}
