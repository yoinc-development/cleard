package ch.yoinc.cleard.category;

import ch.yoinc.cleard.account.Account;
import ch.yoinc.cleard.account.AccountRepository;
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

    private static final String EXPENSE = "EXPENSE";
    private static final String INCOME = "INCOME";

    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;

    public CategoryController(CategoryRepository categoryRepository, TransactionRepository transactionRepository,
                              AccountRepository accountRepository) {
        this.categoryRepository = categoryRepository;
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
    }

    /**
     * Lists the account's categories with their month-to-date usage mixed in.
     */
    @GetMapping
    @Transactional(readOnly = true)
    public List<CategoryResponse> getCategories(@RequestParam Long accountId, @RequestParam String month) {
        YearMonth yearMonth = YearMonth.parse(month);
        LocalDate from = yearMonth.atDay(1);
        LocalDate to = yearMonth.atEndOfMonth();

        Map<Long, List<Transaction>> byCategoryId = transactionRepository.findAllForMonth(accountId, from, to).stream()
                .collect(Collectors.groupingBy(t -> t.getCategory().getId()));

        return categoryRepository.findAllForAccountAlphabetical(accountId).stream()
                .map(category -> {
                    List<Transaction> rows = byCategoryId.getOrDefault(category.getId(), List.of());
                    return CategoryResponse.from(category, MonthToDateTotals.of(rows, category.getDirection()));
                })
                .toList();
    }

    @PostMapping
    @Transactional
    public CategoryResponse createCategory(@RequestBody CategoryDraft draft) {
        validateDraft(draft);
        if (draft.accountId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No account is given");
        }
        Account account = findAccount(draft.accountId());

        Account target = null;
        if (draft.targetAccountId() != null) {
            if (draft.targetAccountId().equals(draft.accountId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The target account can not be the account itself");
            }
            target = findAccount(draft.targetAccountId());
        }

        Category category = new Category();
        category.setName(draft.name().trim());
        category.setColor(draft.color());
        category.setDirection(draft.direction());
        category.setWarningThreshold(draft.warningThreshold() != null ? draft.warningThreshold().toPlainString() : null);
        category.setAccount(account);
        category.setTargetAccount(target);
        category = categoryRepository.save(category);

        if (target != null) {
            Category mirror = new Category();
            mirror.setName(category.getName());
            mirror.setColor(category.getColor());
            mirror.setDirection(flip(category.getDirection()));
            mirror.setAccount(target);
            mirror.setTargetAccount(account);
            mirror.setCounterpart(category);
            mirror = categoryRepository.save(mirror);

            category.setCounterpart(mirror);
            category = categoryRepository.save(category);
        }

        return toResponse(category);
    }

    @PutMapping("{id}")
    @Transactional
    public CategoryResponse updateCategory(@PathVariable Long id, @RequestBody CategoryDraft draft) {
        validateDraft(draft);
        Category category = categoryRepository.findById(id).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Category " + id + " not found"));

        if (draft.accountId() != null && !draft.accountId().equals(category.getAccount().getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The account of a category can not be changed");
        }
        Long currentTargetId = category.getTargetAccount() != null ? category.getTargetAccount().getId() : null;
        if (draft.targetAccountId() != null && !draft.targetAccountId().equals(currentTargetId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The target account of a category can not be changed");
        }

        category.setName(draft.name().trim());
        category.setColor(draft.color());
        category.setDirection(draft.direction());
        category.setWarningThreshold(draft.warningThreshold() != null ? draft.warningThreshold().toPlainString() : null);
        category = categoryRepository.save(category);

        Category counterpart = category.getCounterpart();
        if (counterpart != null) {
            counterpart.setName(category.getName());
            counterpart.setColor(category.getColor());
            counterpart.setDirection(flip(category.getDirection()));
            categoryRepository.save(counterpart);
        }

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

                        // a transaction can only live in a category of its own account
                        categoryRepository.findById(id).ifPresent(source -> {
                            if (!source.getAccount().getId().equals(targetCategory.getAccount().getId())) {
                                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The reassignment category belongs to another account");
                            }
                        });
                        transactionRepository.migrateCategoryOnTransaction(reassignment.transactionId(), id, targetCategory);
                    });
        }

        Category category = categoryRepository.findById(id).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Category to be deleted " + id + " not found"));

        if (transactionRepository.existsByCategory(category)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Category " + category.getName() + " still has transactions assigned to it");
        }

        Category counterpart = category.getCounterpart();
        if (counterpart != null) {
            if (transactionRepository.existsByCategory(counterpart)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "The linked category " + counterpart.getName()
                        + " on the other account still has transactions assigned to it");
            }
            category.setCounterpart(null);
            counterpart.setCounterpart(null);
            categoryRepository.saveAll(List.of(category, counterpart));
            categoryRepository.flush();
            categoryRepository.delete(counterpart);
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

    private Account findAccount(Long accountId) {
        return accountRepository.findById(accountId).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Account " + accountId + " not found"));
    }

    private static String flip(String direction) {
        return EXPENSE.equals(direction) ? INCOME : EXPENSE;
    }

    private void validateDraft(CategoryDraft draft) {
        if (draft.name() == null || draft.name().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No name is given");
        }

        if (draft.color() == null || draft.color().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No color is given");
        }

        if (draft.direction() == null || draft.direction().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No direction is given");
        }
    }

    private CategoryResponse toResponse(Category category) {
        return CategoryResponse.from(category, MonthToDateTotals.of(List.of(), category.getDirection()));
    }
}
