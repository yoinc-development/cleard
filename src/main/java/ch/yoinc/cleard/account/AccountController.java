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

    public AccountController(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @GetMapping
    public List<AccountResponse> getAccounts() {
        return accountRepository.findAllByOrderByIdAsc().stream()
                .map(AccountResponse::from)
                .toList();
    }

    @PostMapping
    public AccountResponse createAccount(@RequestBody AccountDraft draft) {
        if (draft.name() == null || draft.name().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No name is given");
        }
        if (draft.icon() == null || !SUPPORTED_ICONS.contains(draft.icon().strip().toLowerCase(Locale.ROOT))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported icon: " + draft.icon());
        }

        Account account = new Account();
        account.setName(draft.name().strip());
        account.setIcon(draft.icon().strip().toLowerCase(Locale.ROOT));
        return AccountResponse.from(accountRepository.save(account));
    }
}
