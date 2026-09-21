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
        BigDecimal warningThreshold
) {
    public static CategoryResponse from(Category category, MonthToDateTotals totals) {
        return new CategoryResponse(
                category.getId().toString(),
                category.getName(),
                category.getColor(),
                category.getDirection(),
                totals.net(), totals.in(), totals.out(), totals.count(),
                category.getWarningThreshold() != null ? new BigDecimal(category.getWarningThreshold()) : null
        );
    }
}
