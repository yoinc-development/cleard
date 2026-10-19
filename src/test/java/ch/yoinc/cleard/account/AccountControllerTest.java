package ch.yoinc.cleard.account;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@Transactional
class AccountControllerTest {

    @Autowired
    private AccountController controller;

    @Test
    void theMigrationSeedsADefaultAccountFirst() {
        List<AccountResponse> accounts = controller.getAccounts();

        assertEquals("Default", accounts.get(0).name());
        assertEquals("bank", accounts.get(0).icon());
    }

    @Test
    void createsAnAccountAndListsItLast() {
        AccountResponse created = controller.createAccount(new AccountDraft("  ZKB Sparkonto ", "Savings"));

        assertEquals("ZKB Sparkonto", created.name());
        assertEquals("savings", created.icon());
        List<AccountResponse> accounts = controller.getAccounts();
        assertEquals(created, accounts.get(accounts.size() - 1));
    }

    @Test
    void rejectsABlankName() {
        assertBadRequest(() -> controller.createAccount(new AccountDraft("   ", "bank")));
        assertBadRequest(() -> controller.createAccount(new AccountDraft(null, "bank")));
    }

    @Test
    void rejectsAnUnsupportedIcon() {
        assertBadRequest(() -> controller.createAccount(new AccountDraft("Cash", "rocket")));
        assertBadRequest(() -> controller.createAccount(new AccountDraft("Cash", null)));
    }

    private static void assertBadRequest(Runnable action) {
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, action::run);
        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
    }
}
