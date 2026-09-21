package ch.yoinc.cleard.transaction;

import java.util.List;

public record TransactionPageResponse(
        List<TransactionResponse> transactions,
        long filteredCount,
        long remainingCount
) {
}
