package ch.yoinc.cleard.category;

import java.math.BigDecimal;

public record CategoryDraft(
        String name,
        String color,
        String direction,
        BigDecimal warningThreshold,
        Long accountId,
        Long targetAccountId
) {
}
