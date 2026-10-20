package ch.yoinc.cleard.category;

import java.math.BigDecimal;

public record CategoryResponse(
        String id,
        String name,
        String color,
        String direction,
        BigDecimal monthToDateTotal,
        BigDecimal monthToDateIn,
        BigDecimal monthToDateOut,
        long monthToDateCount,
        BigDecimal warningThreshold,
        String accountId,
        String targetAccountId,
        String counterpartId
) {
    public static CategoryResponse from(Category category, MonthToDateTotals totals) {
        return new CategoryResponse(
                category.getId().toString(),
                category.getName(),
                category.getColor(),
                category.getDirection(),
                totals.net(), totals.in(), totals.out(), totals.count(),
                category.getWarningThreshold() != null ? new BigDecimal(category.getWarningThreshold()) : null,
                category.getAccount().getId().toString(),
                category.getTargetAccount() != null ? category.getTargetAccount().getId().toString() : null,
                category.getCounterpart() != null ? category.getCounterpart().getId().toString() : null
        );
    }
}
