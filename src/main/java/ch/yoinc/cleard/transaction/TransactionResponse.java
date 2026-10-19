package ch.yoinc.cleard.transaction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record TransactionResponse(
        String id,
        LocalDate date,
        BigDecimal amount,
        String currency,
        String description,
        String categoryId,
        String accountId,
        List<String> tags
) {
    public static TransactionResponse from(Transaction transaction) {
        return new TransactionResponse(
                transaction.getId().toString(),
                transaction.getTxDate(),
                transaction.getAmount(),
                transaction.getCurrency(),
                transaction.getDescription(),
                transaction.getCategory().getId().toString(),
                transaction.getAccount().getId().toString(),
                List.of() // no Tag entity/relation yet
        );
    }
}
