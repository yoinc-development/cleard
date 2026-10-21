package ch.yoinc.cleard.account;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.Set;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private static final Set<String> SUPPORTED_ICONS = Set.of("bank", "card", "savings", "wallet");

    private final AccountRepository accountRepository;
    private final AccountService accountService;

    public AccountController(AccountRepository accountRepository, AccountService accountService) {
        this.accountRepository = accountRepository;
        this.accountService = accountService;
    }

    @GetMapping
    public List<AccountResponse> getAccounts() {
        return accountRepository.findAllByOrderByIdAsc().stream()
                .map(AccountResponse::from)
                .toList();
    }

    @PostMapping
    public AccountResponse createAccount(@RequestBody AccountDraft draft) {
        validateDraft(draft);

        Account account = new Account();
        apply(account, draft);
        return AccountResponse.from(accountRepository.save(account));
    }

    @PutMapping("{id}")
    public AccountResponse updateAccount(@PathVariable Long id, @RequestBody AccountDraft draft) {
        validateDraft(draft);

        Account account = accountRepository.findById(id).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Account " + id + " not found"));
        apply(account, draft);
        return AccountResponse.from(accountRepository.save(account));
    }

    @DeleteMapping("{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAccount(@PathVariable Long id) {
        accountService.delete(id);
    }

    private static void validateDraft(AccountDraft draft) {
        if (draft.name() == null || draft.name().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No name is given");
        }
        if (draft.icon() == null || !SUPPORTED_ICONS.contains(draft.icon().strip().toLowerCase(Locale.ROOT))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported icon: " + draft.icon());
        }
    }

    private static void apply(Account account, AccountDraft draft) {
        account.setName(draft.name().strip());
        account.setIcon(draft.icon().strip().toLowerCase(Locale.ROOT));
    }
}
