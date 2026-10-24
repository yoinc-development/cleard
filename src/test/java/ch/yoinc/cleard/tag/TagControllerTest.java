package ch.yoinc.cleard.tag;

import ch.yoinc.cleard.account.Account;
import ch.yoinc.cleard.account.AccountRepository;
import ch.yoinc.cleard.category.Category;
import ch.yoinc.cleard.category.CategoryRepository;
import ch.yoinc.cleard.transaction.Transaction;
import ch.yoinc.cleard.transaction.TransactionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Transactional
class TagControllerTest {

    @Autowired
    private TagController tagController;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Test
    void countsTheTagsOfTheRequestedAccountAndMonthMostUsedFirst() {
        Account checking = accountRepository.findAllByOrderByIdAsc().getFirst();
        Account other = saveAccount();
        save(checking, LocalDate.of(2026, 9, 5), "weekly", "food");
        save(checking, LocalDate.of(2026, 9, 6), "weekly");
        save(checking, LocalDate.of(2026, 9, 7), "alpha");
        save(checking, LocalDate.of(2026, 8, 31), "august");
        save(other, LocalDate.of(2026, 9, 5), "elsewhere");

        List<TagResponse> tags = tagController.getTags(checking.getId(), "2026-09");

        assertEquals(List.of(new TagResponse("weekly", 2), new TagResponse("alpha", 1), new TagResponse("food", 1)), tags);
    }

    @Test
    void returnsNothingWhenNoTransactionIsTagged() {
        Account checking = accountRepository.findAllByOrderByIdAsc().getFirst();
        save(checking, LocalDate.of(2026, 9, 5));

        assertTrue(tagController.getTags(checking.getId(), "2026-09").isEmpty());
    }

    private Account saveAccount() {
        Account account = new Account();
        account.setName("Other");
        account.setIcon("card");
        return accountRepository.save(account);
    }

    private void save(Account account, LocalDate date, String... tags) {
        Category category = new Category();
        category.setName("Test");
        category.setColor("#ff8000");
        category.setDirection("EXPENSE");
        category.setAccount(account);
        category = categoryRepository.save(category);

        Transaction transaction = new Transaction();
        transaction.setTxDate(date);
        transaction.setAmount(new BigDecimal("-10.0000"));
        transaction.setCurrency("CHF");
        transaction.setDescription("Test");
        transaction.setCategory(category);
        transaction.setAccount(account);
        transaction.getTags().addAll(List.of(tags));
        transactionRepository.save(transaction);
    }
}
