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
        List<String> tags,
        BigDecimal runningBalance
) {
    public static TransactionResponse from(Transaction transaction) {
        return new TransactionResponse(
                transaction.getId().toString(),
                transaction.getTxDate(),
                transaction.getAmount(),
                transaction.getCurrency(),
                transaction.getDescription(),
                transaction.getCategory() != null ? transaction.getCategory().getId().toString() : null,
                List.of(), // no Tag entity/relation yet
                null // running balance not computed yet
        );
    }
}
