package ch.yoinc.cleard.tag;

import ch.yoinc.cleard.transaction.TransactionRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.YearMonth;
import java.util.List;

@RestController
@RequestMapping("/api/tags")
public class TagController {

    private final TransactionRepository transactionRepository;

    public TagController(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    @GetMapping
    public List<TagResponse> getTags(@RequestParam Long accountId, @RequestParam String month) {
        YearMonth yearMonth = YearMonth.parse(month);
        return transactionRepository.countTagsForMonth(accountId, yearMonth.atDay(1), yearMonth.atEndOfMonth());
    }
}
