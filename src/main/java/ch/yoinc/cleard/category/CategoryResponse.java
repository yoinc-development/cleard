package ch.yoinc.cleard.category;

import java.math.BigDecimal;

public record CategoryResponse(
        String id,
        String name,
        String color,
        String direction,
        BigDecimal monthToDateTotal,
        long monthToDateCount,
        BigDecimal warningThreshold
) {
    public static CategoryResponse from(Category category, BigDecimal total, int rowSize) {
        return new CategoryResponse(
                category.getId().toString(),
                category.getName(),
                category.getColor(),
                category.getDirection(),
                total, rowSize,
                category.getWarningThreshold() != null ? new BigDecimal(category.getWarningThreshold()) : null
        );
    }
}
