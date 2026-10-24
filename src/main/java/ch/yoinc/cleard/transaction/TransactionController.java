package ch.yoinc.cleard.transaction;

import ch.yoinc.cleard.account.Account;
import ch.yoinc.cleard.account.AccountRepository;
import ch.yoinc.cleard.category.Category;
import ch.yoinc.cleard.category.CategoryRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private static final int MAX_TAG_LENGTH = 64;

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final AccountRepository accountRepository;
    private final TransactionService transactionService;

    public TransactionController(TransactionRepository transactionRepository, CategoryRepository categoryRepository,
                                 AccountRepository accountRepository, TransactionService transactionService) {
        this.transactionRepository = transactionRepository;
        this.categoryRepository = categoryRepository;
        this.accountRepository = accountRepository;
        this.transactionService = transactionService;
    }

    @GetMapping
    public TransactionPageResponse getTransactions(
            @RequestParam Long accountId,
            @RequestParam String month,
            @RequestParam(required = false) List<String> categoryIds,
            @RequestParam(required = false) List<String> tags,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "0") int offset
    ) {
        if (limit < 1 || offset < 0 || offset % limit != 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "limit must be >= 1, offset must be >= 0 and a multiple of limit");
        }

        YearMonth yearMonth = YearMonth.parse(month);
        LocalDate from = yearMonth.atDay(1);
        LocalDate to = yearMonth.atEndOfMonth();

        List<Long> parsedCategoryIds = (categoryIds == null || categoryIds.isEmpty())
                ? null
                : categoryIds.stream().map(Long::parseLong).toList();
        List<String> tagFilter = (tags == null || tags.isEmpty()) ? null : tags;
        String searchTerm = (q == null || q.isBlank()) ? null : q.trim();

        List<Transaction> page = transactionRepository.findForMonth(accountId, from, to, parsedCategoryIds, tagFilter, searchTerm, PageRequest.of(offset / limit, limit));
        long filteredCount = transactionRepository.countForMonth(accountId, from, to, parsedCategoryIds, tagFilter, searchTerm);

        List<TransactionResponse> transactions = page.stream().map(TransactionResponse::from).toList();

        return new TransactionPageResponse(transactions, filteredCount);
    }

    @GetMapping("summary")
    public MonthSummaryResponse getMonthSummary(@RequestParam Long accountId, @RequestParam String month) {
        YearMonth yearMonth = YearMonth.parse(month);
        LocalDate from = yearMonth.atDay(1);
        LocalDate to = yearMonth.atEndOfMonth();

        List<Transaction> rows = transactionRepository.findAllForMonth(accountId, from, to);
        return MonthSummaryResponse.from(rows);
    }

    @GetMapping("daily-spend")
    public List<DailySpendResponse> getDailySpend(@RequestParam Long accountId, @RequestParam String month) {
        YearMonth yearMonth = YearMonth.parse(month);
        LocalDate from = yearMonth.atDay(1);
        LocalDate to = yearMonth.atEndOfMonth();

        List<Transaction> rows = transactionRepository.findAllForMonth(accountId, from, to);
        return DailySpendResponse.listFrom(rows);
    }

    @PostMapping
    public TransactionResponse createTransaction(@RequestBody TransactionDraft transactionDraft) {
        Category category = validateDraft(transactionDraft);
        Account account = findAccount(transactionDraft);
        requireSameAccount(category, account);

        Transaction result = transactionService.create(toTransaction(transactionDraft, category, account));
        return TransactionResponse.from(result);
    }

    @PutMapping("{id}")
    public TransactionResponse updateTransaction(@PathVariable Long id, @RequestBody TransactionDraft transactionDraft) {
        Category category = validateDraft(transactionDraft);
        Account account = findAccount(transactionDraft);
        requireSameAccount(category, account);

        Transaction result = transactionService.update(id, toTransaction(transactionDraft, category, account));
        return TransactionResponse.from(result);
    }

    @DeleteMapping("{id}")
    public void deleteTransaction(@PathVariable Long id) {
        transactionService.delete(id);
    }

    private Category validateDraft(TransactionDraft transactionDraft) {
        if (transactionDraft.getCategoryId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No category is given");
        }

        if (transactionDraft.getDescription() == null || transactionDraft.getDescription().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No description is given");
        }
        transactionDraft.setDescription(transactionDraft.getDescription().trim());
        transactionDraft.setTags(normalizeTags(transactionDraft.getTags()));

        return categoryRepository.findById(transactionDraft.getCategoryId()).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Category " + transactionDraft.getCategoryId() + " not found"));
    }

    private List<String> normalizeTags(List<String> tags) {
        if (tags == null) {
            return List.of();
        }

        List<String> normalized = tags.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(tag -> !tag.isEmpty())
                .distinct()
                .toList();

        for (String tag : normalized) {
            if (tag.length() > MAX_TAG_LENGTH) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A tag may have at most " + MAX_TAG_LENGTH + " characters");
            }
            if (tag.contains(",")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A tag must not contain a comma");
            }
        }
        return normalized;
    }

    private void requireSameAccount(Category category, Account account) {
        if (!category.getAccount().getId().equals(account.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category " + category.getName() + " belongs to another account");
        }
    }

    private Account findAccount(TransactionDraft transactionDraft) {
        if (transactionDraft.getAccountId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No account is given");
        }

        return accountRepository.findById(transactionDraft.getAccountId()).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Account " + transactionDraft.getAccountId() + " not found"));
    }

    private Transaction toTransaction(TransactionDraft transactionDraft, Category category, Account account) {
        Transaction transaction = new Transaction();

        transaction.setTxDate(transactionDraft.getTxDate());
        transaction.setAmount(transactionDraft.getAmount());
        transaction.setCurrency(transactionDraft.getCurrency());
        transaction.setDescription(transactionDraft.getDescription());
        transaction.setCategory(category);
        transaction.setAccount(account);
        transaction.getTags().addAll(transactionDraft.getTags());

        return transaction;
    }
}
